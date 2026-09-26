import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { getDb } from '../lib/firebase';
import { isFirebaseConfigured } from '../config/firebase';
import type {
  PlayerFeedbackRequest,
  CreateFeedbackRequestInput,
  FeedbackRequestStatus,
} from '../models/PlayerFeedback';
import { messagesService } from './messages.service';
import { staffNotificationsService } from './staffNotifications.service';

const COL = 'player_feedback_requests';

function toDate(v: unknown): Date {
  if (v instanceof Timestamp) return v.toDate();
  if (v instanceof Date) return v;
  return new Date();
}

function mapDoc(id: string, data: Record<string, unknown>): PlayerFeedbackRequest {
  return {
    id,
    kind: (data.kind as PlayerFeedbackRequest['kind']) ?? 'event_feedback',
    player_uid: String(data.player_uid ?? ''),
    player_name: String(data.player_name ?? ''),
    coach_uid: String(data.coach_uid ?? ''),
    coach_name: String(data.coach_name ?? ''),
    club_id: data.club_id ? String(data.club_id) : undefined,
    team_id: data.team_id ? String(data.team_id) : undefined,
    event_id: data.event_id ? String(data.event_id) : undefined,
    event_title: data.event_title ? String(data.event_title) : undefined,
    event_date: data.event_date ? toDate(data.event_date) : undefined,
    skill_topic: data.skill_topic ? String(data.skill_topic) : undefined,
    question: String(data.question ?? ''),
    status: (data.status as FeedbackRequestStatus) ?? 'pending',
    thread_id: data.thread_id ? String(data.thread_id) : undefined,
    coach_response: data.coach_response ? String(data.coach_response) : undefined,
    coach_responded_at: data.coach_responded_at ? toDate(data.coach_responded_at) : undefined,
    closed_at: data.closed_at ? toDate(data.closed_at) : undefined,
    idempotency_key: data.idempotency_key ? String(data.idempotency_key) : undefined,
    created_at: toDate(data.created_at),
    updated_at: toDate(data.updated_at),
  };
}

const pendingRequestsRegistry = new Set<string>();

export const playerFeedbackService = {
  /**
   * Crée une demande de feedback ou d'entraînement spécifique avec dédoublonnage.
   */
  async submitFeedbackRequest(input: CreateFeedbackRequestInput): Promise<PlayerFeedbackRequest> {
    return this.createRequest(input);
  },

  async createRequest(input: CreateFeedbackRequestInput): Promise<PlayerFeedbackRequest> {
    if (!input.coach_uid?.trim() || !input.question?.trim()) {
      throw new Error('Le coach et la question sont obligatoires.');
    }

    const duplicateKey = `${input.player_uid}_${input.event_id ?? input.skill_topic ?? ''}_${input.question.trim()}`;
    if (pendingRequestsRegistry.has(duplicateKey)) {
      throw new Error('Une demande de feedback identique est déjà en attente.');
    }
    pendingRequestsRegistry.add(duplicateKey);

    const database = getDb();
    const now = new Date();

    // Dédoublonnage via idempotency_key si renseignée
    if (input.idempotency_key && database && isFirebaseConfigured()) {
      try {
        const existing = await getDocs(
          query(
            collection(database, COL),
            where('idempotency_key', '==', input.idempotency_key),
            limit(1),
          ),
        );
        if (!existing.empty) {
          const docSnap = existing.docs[0];
          return mapDoc(docSnap.id, docSnap.data() as Record<string, unknown>);
        }
      } catch {
        // En cas d'échec de la vérification, on poursuit
      }
    }

    // Créer ou récupérer le fil de messagerie coach-joueur pour centraliser l'échange
    let threadId: string | undefined;
    try {
      threadId = await messagesService.getOrCreateThread(
        input.player_uid,
        input.player_name,
        input.coach_uid,
        input.coach_name,
        { currentRole: 'player', otherRole: 'coach' },
      );
    } catch {
      // Best-effort
    }

    const payload: Record<string, unknown> = {
      kind: input.kind,
      player_uid: input.player_uid,
      player_name: input.player_name,
      coach_uid: input.coach_uid,
      coach_name: input.coach_name,
      club_id: input.club_id ?? null,
      team_id: input.team_id ?? null,
      event_id: input.event_id ?? null,
      event_title: input.event_title ?? null,
      event_date: input.event_date ? Timestamp.fromDate(input.event_date) : null,
      skill_topic: input.skill_topic ?? null,
      question: input.question.trim(),
      status: 'pending',
      thread_id: threadId ?? null,
      idempotency_key: input.idempotency_key ?? null,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    };

    let id = `fb_${Date.now()}`;
    if (database && isFirebaseConfigured()) {
      const ref = await addDoc(collection(database, COL), payload);
      id = ref.id;
    }

    // Envoyer le message d'introduction dans le fil de messagerie
    if (threadId) {
      try {
        const msgPrefix =
          input.kind === 'event_feedback'
            ? `[Question Match/Séance : ${input.event_title ?? 'Événement'}]`
            : `[Demande d'Entraînement Spécifique : ${input.skill_topic ?? 'Compétence'}]`;
        await messagesService.sendMessage(
          threadId,
          input.player_uid,
          input.player_name,
          `${msgPrefix}\n${input.question.trim()}`,
        );
      } catch {
        // Message optionnel
      }
    }

    // Notification au coach
    try {
      const notifTitle =
        input.kind === 'event_feedback'
          ? `Feedback demandé : ${input.player_name}`
          : `Demande de travail : ${input.player_name}`;
      await staffNotificationsService.notifyRecipients({
        recipient_uids: [input.coach_uid],
        type: 'generic',
        title: notifTitle,
        body: input.question.slice(0, 100),
        club_id: input.club_id,
        player_uid: input.player_uid,
      });
    } catch {
      // Best-effort
    }

    return {
      id,
      kind: input.kind,
      player_uid: input.player_uid,
      player_name: input.player_name,
      coach_uid: input.coach_uid,
      coach_name: input.coach_name,
      club_id: input.club_id,
      team_id: input.team_id,
      event_id: input.event_id,
      event_title: input.event_title,
      event_date: input.event_date,
      skill_topic: input.skill_topic,
      question: input.question.trim(),
      status: 'pending',
      thread_id: threadId,
      idempotency_key: input.idempotency_key,
      created_at: now,
      updated_at: now,
    };
  },

  /**
   * Liste les demandes pour un joueur.
   */
  async listForPlayer(playerUid: string, max = 30): Promise<PlayerFeedbackRequest[]> {
    const database = getDb();
    if (!database || !isFirebaseConfigured() || !playerUid) return [];
    try {
      const q = query(
        collection(database, COL),
        where('player_uid', '==', playerUid),
        orderBy('created_at', 'desc'),
        limit(max),
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => mapDoc(d.id, d.data() as Record<string, unknown>));
    } catch {
      // Fallback sans index composite
      const snap = await getDocs(
        query(collection(database, COL), where('player_uid', '==', playerUid), limit(max)),
      );
      return snap.docs
        .map((d) => mapDoc(d.id, d.data() as Record<string, unknown>))
        .sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
    }
  },

  /**
   * Liste les demandes reçues par un coach.
   */
  async listForCoach(coachUid: string, max = 30): Promise<PlayerFeedbackRequest[]> {
    const database = getDb();
    if (!database || !isFirebaseConfigured() || !coachUid) return [];
    try {
      const q = query(
        collection(database, COL),
        where('coach_uid', '==', coachUid),
        orderBy('created_at', 'desc'),
        limit(max),
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => mapDoc(d.id, d.data() as Record<string, unknown>));
    } catch {
      const snap = await getDocs(
        query(collection(database, COL), where('coach_uid', '==', coachUid), limit(max)),
      );
      return snap.docs
        .map((d) => mapDoc(d.id, d.data() as Record<string, unknown>))
        .sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
    }
  },

  /**
   * Réponse du coach ou clôture.
   */
  async respondToRequest(
    requestId: string,
    coachResponse: string,
    markClosed = false,
  ): Promise<void> {
    const database = getDb();
    if (!database || !isFirebaseConfigured()) return;
    const ref = doc(database, COL, requestId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return;

    await updateDoc(ref, {
      coach_response: coachResponse.trim(),
      coach_responded_at: serverTimestamp(),
      status: markClosed ? 'closed' : 'answered',
      closed_at: markClosed ? serverTimestamp() : null,
      updated_at: serverTimestamp(),
    });
  },

  /**
   * Clôture formelle d'une demande.
   */
  async closeRequest(requestId: string): Promise<void> {
    const database = getDb();
    if (!database || !isFirebaseConfigured()) return;
    await updateDoc(doc(database, COL, requestId), {
      status: 'closed',
      closed_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    });
  },
};
