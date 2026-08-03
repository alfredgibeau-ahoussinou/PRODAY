import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  updateDoc,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import { getDb } from '../lib/firebase';
import { isFirebaseConfigured } from '../config/firebase';
import {
  chatMessageFromFirestore,
  messageThreadFromFirestore,
  userFromFirestore,
  type ChatMessage,
  type MessageThread,
} from '../lib/firestoreMappers';
import type { User } from '../models/User';
import {
  DEFAULT_PARENTAL_SETTINGS,
  type ParentalEmergencyContact,
  type ParentalPrivacySettings,
} from '../models/ParentalSettings';
import { parentalGuardianService, type LinkedMinorProfile } from './parentalGuardian.service';
import { teamEventsService } from './teamEvents.service';
import type { TeamEvent } from '../models/TeamEvent';
import type { CarpoolLiveTripDoc } from '../models/CarpoolLiveTrip';
import { carpoolLiveTripService } from './carpoolLiveTrip.service';
import { callFunction } from '../lib/firebaseFunctions';
import { normalizeGuardianEmail } from '../utils/guardianEmail';
import { resolveRuntimeMinutesUsed } from '../utils/parentalScreenTime';

export type ParentChildBundle = LinkedMinorProfile & {
  profile: User;
};

function mapBundle(user: User): ParentChildBundle {
  const settings = {
    ...DEFAULT_PARENTAL_SETTINGS,
    ...user.parental_settings,
    is_minor: true as const,
  };
  return {
    uid: user.uid,
    display_name: user.display_name,
    settings,
    runtime: user.parental_runtime,
    minutesUsedToday: resolveRuntimeMinutesUsed(user.parental_runtime),
    alerts: [],
    profile: user,
  };
}

async function loadChildUser(uid: string): Promise<User | null> {
  const database = getDb();
  if (!database) return null;
  const snap = await getDoc(doc(database, 'users', uid));
  if (!snap.exists()) return null;
  return userFromFirestore(snap.id, snap.data() as Record<string, unknown>);
}

export const parentPortalService = {
  isParentRole(role?: string | null): boolean {
    return role === 'parent';
  },

  async provisionParentAccount(childUid?: string): Promise<{
    parentUid: string;
    created: boolean;
    emailSent: boolean;
    linked: boolean;
  }> {
    return callFunction('provisionParentAccount', childUid ? { childUid } : {});
  },

  async listLinkedChildren(parent: User): Promise<ParentChildBundle[]> {
    const byUid = new Map<string, ParentChildBundle>();

    for (const childUid of parent.parent_of ?? []) {
      const user = await loadChildUser(childUid);
      if (!user?.parental_settings?.is_minor) continue;
      byUid.set(user.uid, mapBundle(user));
    }

    const email = normalizeGuardianEmail(parent.email);
    if (email) {
      const viaEmail = await parentalGuardianService.listLinkedMinors(email);
      for (const child of viaEmail) {
        const user = await loadChildUser(child.uid);
        if (!user) continue;
        byUid.set(child.uid, {
          ...child,
          profile: user,
        });
      }
    }

    return Array.from(byUid.values());
  },

  async listChildThreads(childUid: string, max = 40): Promise<MessageThread[]> {
    if (!isFirebaseConfigured() || !childUid) return [];
    const database = getDb();
    if (!database) return [];
    try {
      const q = query(
        collection(database, 'message_threads'),
        where('participant_ids', 'array-contains', childUid),
        orderBy('updated_at', 'desc'),
        limit(max),
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) =>
        messageThreadFromFirestore(d.id, d.data() as Record<string, unknown>, childUid),
      );
    } catch (error) {
      console.error('[parentPortalService] listChildThreads:', error);
      return [];
    }
  },

  async listChildMessages(threadId: string, max = 80): Promise<ChatMessage[]> {
    if (!isFirebaseConfigured() || !threadId) return [];
    const database = getDb();
    if (!database) return [];
    try {
      const q = query(
        collection(database, 'messages'),
        where('thread_id', '==', threadId),
        orderBy('created_at', 'desc'),
        limit(max),
      );
      const snap = await getDocs(q);
      return snap.docs
        .map((d) => chatMessageFromFirestore(d.id, d.data() as Record<string, unknown>))
        .reverse();
    } catch (error) {
      console.error('[parentPortalService] listChildMessages:', error);
      return [];
    }
  },

  async setContactApproval(
    childUid: string,
    guardianEmail: string,
    contactUid: string,
    approved: boolean,
    contactMeta?: { name?: string; role?: string },
  ): Promise<void> {
    const children = await parentalGuardianService.listLinkedMinors(guardianEmail);
    const child = children.find((c) => c.uid === childUid);
    if (!child) throw new Error('Enfant introuvable.');
    const contacts = (child.settings.approved_contacts ?? []).map((c) =>
      c.uid === contactUid ? { ...c, approved } : c,
    );
    if (!contacts.some((c) => c.uid === contactUid)) {
      contacts.push({
        uid: contactUid,
        name: contactMeta?.name ?? 'Contact',
        role: contactMeta?.role ?? 'unknown',
        approved,
      });
    }
    await parentalGuardianService.updateChildScreenTime(childUid, guardianEmail, {
      approved_contacts: contacts,
      messaging_restricted: true,
      contacts_filter_enabled: true,
    });
  },

  async resolveMessageRequest(
    requestId: string,
    status: 'accepted' | 'refused',
  ): Promise<void> {
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');
    await updateDoc(doc(database, 'message_requests', requestId), {
      status,
      resolved_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    });
    const reqSnap = await getDoc(doc(database, 'message_requests', requestId));
    const threadId = reqSnap.data()?.thread_id as string | undefined;
    if (threadId) {
      await updateDoc(doc(database, 'message_threads', threadId), {
        request_status: status,
        thread_kind: status === 'accepted' ? 'standard' : 'message_request',
        updated_at: serverTimestamp(),
      });
    }
  },

  async listChildEvents(childUid: string): Promise<TeamEvent[]> {
    return teamEventsService.listForUser(childUid);
  },

  async listActiveCarpoolTripsForChild(childUid: string): Promise<CarpoolLiveTripDoc[]> {
    if (!isFirebaseConfigured() || !childUid) return [];
    const database = getDb();
    if (!database) return [];
    try {
      const q = query(
        collection(database, 'carpool_trip_live'),
        where('participant_uids', 'array-contains', childUid),
        where('active', '==', true),
        limit(10),
      );
      const snap = await getDocs(q);
      const trips: CarpoolLiveTripDoc[] = [];
      for (const d of snap.docs) {
        const trip = await carpoolLiveTripService.get(d.id);
        if (trip) trips.push(trip);
      }
      return trips;
    } catch (error) {
      console.error('[parentPortalService] listActiveCarpoolTripsForChild:', error);
      return [];
    }
  },

  async updateEmergencyContacts(
    childUid: string,
    guardianEmail: string,
    emergency_contacts: ParentalEmergencyContact[],
  ): Promise<void> {
    await parentalGuardianService.updateChildScreenTime(childUid, guardianEmail, {
      emergency_contacts,
    });
  },

  async updatePrivacy(
    childUid: string,
    guardianEmail: string,
    privacy: ParentalPrivacySettings,
  ): Promise<void> {
    await parentalGuardianService.updateChildScreenTime(childUid, guardianEmail, {
      privacy,
    });
  },

  async updateMessagingRestriction(
    childUid: string,
    guardianEmail: string,
    messaging_restricted: boolean,
  ): Promise<void> {
    await parentalGuardianService.updateChildScreenTime(childUid, guardianEmail, {
      messaging_restricted,
      contacts_filter_enabled: true,
    });
  },
};
