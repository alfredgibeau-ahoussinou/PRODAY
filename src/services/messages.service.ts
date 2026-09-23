import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  onSnapshot,
  type Unsubscribe,
} from 'firebase/firestore';
import { getDb } from '../lib/firebase';
import { isFirebaseConfigured } from '../config/firebase';
import {
  messageThreadFromFirestore,
  chatMessageFromFirestore,
  type MessageThread,
  type ChatMessage,
} from '../lib/firestoreMappers';
import { threadKindForParticipants, type ThreadKind } from '../utils/physioMessaging';
import {
  canSendInConversation,
  conversationAccessFromRequest,
  requiresMessageRequest,
  resolveMessageRequest,
} from '../utils/messageRequestState';
import type { User, UserRole } from '../models/User';
import { validateMessageBody } from '../utils/messagingLimits';
import { isMinorUser } from '../utils/minor';
import { evaluateScreenTimeAccess, shouldEnforceScreenTime } from '../utils/parentalScreenTime';
import { needsOnboardingDocumentUpload } from '../utils/onboardingGate';
import { callFunction } from '../lib/firebaseFunctions';
import { getErrorCode } from '../utils/errors';
import type { MessageRequestStatus } from '../models/MessageRequest';
import type { GroupThreadPayload } from '../features/messaging/groupDraft';

const SPONSOR_MESSAGE_FUNCTIONS_REGION = 'europe-west1';

function assertDocumentsSubmitted(sender?: User): void {
  if (sender && needsOnboardingDocumentUpload(sender)) {
    throw new Error(
      'Envoyez vos documents de vérification depuis votre profil pour utiliser la messagerie.'
    );
  }
}

function threadIdFor(uidA: string, uidB: string): string {
  return [uidA, uidB].sort().join('__');
}

async function assertMinorMessagingAllowed(sender?: User): Promise<void> {
  if (!sender || !isMinorUser(sender)) return;
  const settings = sender.parental_settings;
  if (!shouldEnforceScreenTime(settings)) return;
  const result = await evaluateScreenTimeAccess(sender.uid, settings!);
  if (result.blocked) {
    throw new Error('Limite de temps parentale atteinte. Réessayez plus tard.');
  }
}

export const messagesService = {
  async listThreads(currentUid: string, max = 40): Promise<MessageThread[]> {
    if (!isFirebaseConfigured() || !currentUid) return [];
    const database = getDb();
    if (!database) return [];

    try {
      const q = query(
        collection(database, 'message_threads'),
        where('participant_ids', 'array-contains', currentUid),
        orderBy('updated_at', 'desc'),
        limit(max)
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) =>
        messageThreadFromFirestore(
          d.id,
          d.data() as Record<string, unknown>,
          currentUid
        )
      );
    } catch (error) {
      console.error('[messagesService] listThreads:', error);
      return [];
    }
  },

  async getOrCreateThread(
    currentUid: string,
    currentName: string,
    otherUid: string,
    otherName: string,
    options?: { currentRole?: UserRole; otherRole?: UserRole }
  ): Promise<string> {
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');
    if (currentUid === otherUid) throw new Error('Impossible de vous contacter vous-même.');

    const id = threadIdFor(currentUid, otherUid);
    const ref = doc(database, 'message_threads', id);
    const snap = await getDoc(ref);
    const threadKind: ThreadKind =
      options?.currentRole && options?.otherRole
        ? threadKindForParticipants(options.currentRole, options.otherRole)
        : 'standard';

    const needsRequest =
      options?.currentRole && options?.otherRole
        ? requiresMessageRequest(options.currentRole, options.otherRole)
        : false;

    if (!snap.exists()) {
      const requestId = needsRequest ? `req_${id}` : undefined;
      await setDoc(ref, {
        participant_ids: [currentUid, otherUid],
        participant_names: {
          [currentUid]: currentName,
          [otherUid]: otherName,
        },
        thread_kind: threadKind,
        last_message: needsRequest ? 'Demande de message' : '',
        updated_at: serverTimestamp(),
        unread_by: needsRequest ? [otherUid] : [],
        ...(needsRequest
          ? {
              request_status: 'pending' as MessageRequestStatus,
              request_id: requestId,
              request_requester_uid: currentUid,
              request_recipient_uid: otherUid,
            }
          : {}),
      });
      if (needsRequest && requestId) {
        await setDoc(doc(database, 'message_requests', requestId), {
          thread_id: id,
          requester_uid: currentUid,
          recipient_uid: otherUid,
          pair_kind: 'player_agent',
          status: 'pending',
          created_at: serverTimestamp(),
          updated_at: serverTimestamp(),
        });
      }
    } else {
      const names = (snap.data().participant_names ?? {}) as Record<string, string>;
      const patch: Record<string, unknown> = {
        participant_names: {
          ...names,
          [currentUid]: currentName,
          [otherUid]: otherName,
        },
        updated_at: serverTimestamp(),
      };
      if (!snap.data().thread_kind && (threadKind === 'physio_care' || threadKind === 'message_request')) {
        patch.thread_kind = threadKind;
      }
      await updateDoc(ref, patch);
    }

    return id;
  },

  async resolveThreadRequest(
    threadId: string,
    actorUid: string,
    action: 'accept' | 'refuse' | 'cancel',
  ): Promise<MessageRequestStatus> {
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');
    const ref = doc(database, 'message_threads', threadId);
    const snap = await getDoc(ref);
    if (!snap.exists()) throw new Error('Conversation introuvable.');
    const data = snap.data();
    const current = (data.request_status as MessageRequestStatus | undefined) ?? 'pending';
    const requester = String(data.request_requester_uid ?? '');
    const recipient = String(data.request_recipient_uid ?? '');
    const actor: 'recipient' | 'requester' =
      actorUid === recipient ? 'recipient' : actorUid === requester ? 'requester' : 'recipient';
    if (actorUid !== recipient && actorUid !== requester) {
      throw new Error('Vous ne pouvez pas traiter cette demande.');
    }
    const next = resolveMessageRequest(current, action, actor);
    if (!next) throw new Error('Action impossible sur cette demande.');

    await updateDoc(ref, {
      request_status: next,
      thread_kind: next === 'accepted' ? 'standard' : data.thread_kind ?? 'message_request',
      updated_at: serverTimestamp(),
      last_message:
        next === 'accepted'
          ? 'Demande acceptée'
          : next === 'refused'
            ? 'Demande refusée'
            : data.last_message ?? '',
    });

    const requestId = data.request_id ? String(data.request_id) : null;
    if (requestId) {
      await updateDoc(doc(database, 'message_requests', requestId), {
        status: next,
        updated_at: serverTimestamp(),
        resolved_at: serverTimestamp(),
      });
    }
    return next;
  },

  async listMessages(threadId: string, max = 80): Promise<ChatMessage[]> {
    if (!isFirebaseConfigured()) return [];
    const database = getDb();
    if (!database) return [];

    try {
      const q = query(
        collection(database, 'messages'),
        where('thread_id', '==', threadId),
        orderBy('created_at', 'asc'),
        limit(max)
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) =>
        chatMessageFromFirestore(d.id, d.data() as Record<string, unknown>)
      );
    } catch (error) {
      console.error('[messagesService] listMessages:', error);
      return [];
    }
  },

  async sendMessage(
    threadId: string,
    senderUid: string,
    receiverUid: string,
    body: string,
    sender?: User,
  ): Promise<void> {
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');
    await assertMinorMessagingAllowed(sender);
    assertDocumentsSubmitted(sender);
    const text = validateMessageBody(body);

    const threadSnap = await getDoc(doc(database, 'message_threads', threadId));
    if (threadSnap.exists()) {
      const td = threadSnap.data();
      const status = td.request_status as MessageRequestStatus | undefined;
      const kind =
        td.thread_kind === 'message_request' || status
          ? 'player_agent'
          : 'standard';
      const access = conversationAccessFromRequest(
        status ? { status } : null,
        kind,
      );
      if (!canSendInConversation(access) && kind === 'player_agent') {
        throw new Error(
          access === 'request_pending'
            ? 'Demande en attente — la conversation s’ouvre après acceptation.'
            : 'Cette conversation n’est pas active.',
        );
      }
    }

    // Sponsor : quota + écriture atomiques côté Cloud Function (rules bloquent addDoc).
    if (sender?.role === 'sponsor') {
      try {
        await callFunction<
          { threadId: string; receiverUid: string; body: string },
          { ok: boolean }
        >(
          'sendSponsorClubMessage',
          { threadId, receiverUid, body: text },
          SPONSOR_MESSAGE_FUNCTIONS_REGION,
        );
        return;
      } catch (e) {
        const code = getErrorCode(e);
        if (code === 'functions/resource-exhausted') {
          throw new Error(
            e instanceof Error ? e.message : 'Quota messages clubs atteint pour ce mois.',
          );
        }
        throw e instanceof Error ? e : new Error('Envoi message sponsor impossible.');
      }
    }

    await addDoc(collection(database, 'messages'), {
      thread_id: threadId,
      sender_id: senderUid,
      receiver_id: receiverUid,
      body: text,
      created_at: serverTimestamp(),
    });

    await updateDoc(doc(database, 'message_threads', threadId), {
      last_message: text,
      updated_at: serverTimestamp(),
      unread_by: arrayUnion(receiverUid),
    });
  },

  async markThreadRead(threadId: string, uid: string): Promise<void> {
    const database = getDb();
    if (!database) return;
    await updateDoc(doc(database, 'message_threads', threadId), {
      unread_by: arrayRemove(uid),
    });
  },

  getOtherParticipantId(threadId: string, currentUid: string): string | null {
    if (threadId.startsWith('team__')) return 'group';
    // Les groupes créés depuis la messagerie utilisent un identifiant propre (`grp_…`) :
    // sans ce cas, un fil de groupe serait traité comme un dialogue direct et l'écran de
    // conversation chercherait un destinataire unique inexistant.
    if (threadId.startsWith('grp_')) return 'group';
    const parts = threadId.split('__');
    if (parts.length !== 2) return null;
    return parts[0] === currentUid ? parts[1] : parts[0];
  },

  /* ---------------------------------------------------------------- *
   * Groupes
   * ---------------------------------------------------------------- */

  /**
   * Crée un groupe.
   *
   * Le document est **construit hors de l'écran** (`buildGroupThreadPayload`) : l'écran ne
   * décide ni des participants, ni des non-lus, ni des administrateurs. L'écriture est faite en
   * une seule opération `setDoc` : soit le groupe existe entièrement, soit il n'existe pas —
   * il n'y a donc pas de groupe à moitié créé à nettoyer après un échec.
   */
  async createGroupThread(payload: GroupThreadPayload): Promise<string> {
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');
    if (!payload.participant_ids.includes(payload.created_by)) {
      throw new Error('Le créateur doit faire partie du groupe.');
    }

    try {
      const ref = doc(database, 'message_threads', payload.id);
      const existing = await getDoc(ref);
      if (existing.exists()) {
        throw new Error('Un groupe portant cet identifiant existe déjà.');
      }
      await setDoc(ref, {
        is_group: true,
        thread_kind: payload.thread_kind,
        thread_title: payload.thread_title,
        group_avatar_url: payload.group_avatar_url,
        created_by: payload.created_by,
        participant_ids: payload.participant_ids,
        participant_names: payload.participant_names,
        participant_roles: payload.participant_roles,
        contains_minor: payload.contains_minor,
        admin_uids: payload.admin_uids,
        last_message: payload.last_message,
        unread_by: payload.unread_by,
        updated_at: serverTimestamp(),
      });
      return payload.id;
    } catch (error) {
      if (error instanceof Error) throw error;
      throw new Error('Création du groupe impossible. Réessayez.');
    }
  },

  /** Détails éditables du groupe (nom, image). Réservé aux administrateurs côté règles. */
  async updateGroupDetails(
    threadId: string,
    updates: { name?: string; avatarUrl?: string | null },
  ): Promise<void> {
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');
    const patch: Record<string, unknown> = { updated_at: serverTimestamp() };
    if (updates.name !== undefined) patch.thread_title = updates.name.trim();
    if (updates.avatarUrl !== undefined) {
      patch.group_avatar_url = updates.avatarUrl?.trim() ? updates.avatarUrl.trim() : null;
    }
    try {
      await updateDoc(doc(database, 'message_threads', threadId), patch);
    } catch {
      throw new Error('Modification du groupe refusée ou impossible.');
    }
  },

  /** Ajoute un membre et enregistre son rôle réel (pour la catégorisation à l'affichage). */
  async addGroupMember(
    threadId: string,
    member: { uid: string; displayName: string; role: UserRole },
  ): Promise<void> {
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');
    try {
      await updateDoc(doc(database, 'message_threads', threadId), {
        participant_ids: arrayUnion(member.uid),
        [`participant_names.${member.uid}`]: member.displayName,
        [`participant_roles.${member.uid}`]: member.role,
        unread_by: arrayUnion(member.uid),
        updated_at: serverTimestamp(),
      });
    } catch {
      throw new Error('Ajout du membre refusé ou impossible.');
    }
  },

  async removeGroupMember(threadId: string, uid: string): Promise<void> {
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');
    try {
      await updateDoc(doc(database, 'message_threads', threadId), {
        participant_ids: arrayRemove(uid),
        unread_by: arrayRemove(uid),
        admin_uids: arrayRemove(uid),
        updated_at: serverTimestamp(),
      });
    } catch {
      throw new Error('Retrait du membre refusé ou impossible.');
    }
  },

  async promoteGroupAdmin(threadId: string, uid: string): Promise<void> {
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');
    await updateDoc(doc(database, 'message_threads', threadId), {
      admin_uids: arrayUnion(uid),
      updated_at: serverTimestamp(),
    });
  },

  /** Lit l'état de gestion d'un groupe : sert à appliquer `evaluateGroupMembershipAction`. */
  async getGroupMembership(
    threadId: string,
  ): Promise<{ participantIds: string[]; adminUids: string[]; createdBy: string } | null> {
    const database = getDb();
    if (!database) return null;
    const snap = await getDoc(doc(database, 'message_threads', threadId));
    if (!snap.exists()) return null;
    const data = snap.data() as Record<string, unknown>;
    return {
      participantIds: (data.participant_ids as string[]) ?? [],
      adminUids: (data.admin_uids as string[]) ?? [],
      createdBy: String(data.created_by ?? ''),
    };
  },

  async sendGroupMessage(threadId: string, senderUid: string, body: string, sender?: User): Promise<void> {
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');
    await assertMinorMessagingAllowed(sender);
    assertDocumentsSubmitted(sender);
    const text = validateMessageBody(body);
    const threadRef = doc(database, 'message_threads', threadId);
    const snap = await getDoc(threadRef);
    if (!snap.exists()) throw new Error('Conversation introuvable.');
    const participantIds = (snap.data().participant_ids as string[]) ?? [];
    const unreadTargets = participantIds.filter((id) => id !== senderUid);

    await addDoc(collection(database, 'messages'), {
      thread_id: threadId,
      sender_id: senderUid,
      receiver_id: 'group',
      body: text,
      created_at: serverTimestamp(),
    });

    await updateDoc(threadRef, {
      last_message: text,
      updated_at: serverTimestamp(),
      unread_by: unreadTargets,
    });
  },

  subscribeThreads(
    currentUid: string,
    onUpdate: (threads: MessageThread[]) => void,
    max = 40
  ): Unsubscribe | null {
    if (!isFirebaseConfigured() || !currentUid) return null;
    const database = getDb();
    if (!database) return null;

    const q = query(
      collection(database, 'message_threads'),
      where('participant_ids', 'array-contains', currentUid),
      orderBy('updated_at', 'desc'),
      limit(max)
    );

    return onSnapshot(
      q,
      (snap) => {
        const threads = snap.docs.map((d) =>
          messageThreadFromFirestore(
            d.id,
            d.data() as Record<string, unknown>,
            currentUid
          )
        );
        onUpdate(threads);
      },
      (error) => console.error('[messagesService] subscribeThreads:', error)
    );
  },

  async toggleReaction(
    messageId: string,
    emoji: string,
    uid: string,
  ): Promise<void> {

    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');
    const ref = doc(database, 'messages', messageId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return;
    const data = snap.data() as Record<string, unknown>;
    const reactions = (data.reactions as Record<string, string[]> | undefined) ?? {};
    const existing = reactions[emoji] ?? [];
    const hasReacted = existing.includes(uid);
    const nextList = hasReacted
      ? existing.filter((id) => id !== uid)
      : [...existing, uid];

    await updateDoc(ref, {
      [`reactions.${emoji}`]: nextList.length > 0 ? nextList : arrayRemove(uid),
    });
  },

  subscribeMessages(
    threadId: string,
    onUpdate: (messages: ChatMessage[]) => void,
    max = 80
  ): Unsubscribe | null {
    if (!isFirebaseConfigured()) return null;
    const database = getDb();
    if (!database) return null;

    const q = query(
      collection(database, 'messages'),
      where('thread_id', '==', threadId),
      orderBy('created_at', 'asc'),
      limit(max)
    );

    return onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) =>
          chatMessageFromFirestore(d.id, d.data() as Record<string, unknown>)
        );
        onUpdate(list);
      },
      (error) => console.error('[messagesService] subscribeMessages:', error)
    );
  },
};

