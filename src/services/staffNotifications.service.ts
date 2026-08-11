import {
  addDoc,
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  doc,
  where,
  Timestamp,
} from 'firebase/firestore';
import { getDb } from '../lib/firebase';
import { isFirebaseConfigured } from '../config/firebase';

export type StaffNotificationType =
  | 'player_late'
  | 'parent_pickup_late'
  | 'friendly_invite'
  | 'internal_move'
  | 'generic';

export type StaffNotification = {
  id: string;
  recipient_uid: string;
  type: StaffNotificationType;
  title: string;
  body: string;
  event_id?: string;
  club_id?: string;
  player_uid?: string;
  read_at: Date | null;
  created_at: Date;
};

function toDate(v: unknown): Date {
  if (v instanceof Timestamp) return v.toDate();
  if (v instanceof Date) return v;
  return new Date();
}

/**
 * Inbox staff (coach / club) — remplace le faux “coach prévenu” local-only.
 */
export const staffNotificationsService = {
  async notifyRecipients(input: {
    recipient_uids: string[];
    type: StaffNotificationType;
    title: string;
    body: string;
    event_id?: string;
    club_id?: string;
    player_uid?: string;
  }): Promise<number> {
    if (!isFirebaseConfigured()) return 0;
    const database = getDb();
    if (!database) return 0;
    const unique = [...new Set(input.recipient_uids.filter(Boolean))];
    let n = 0;
    for (const uid of unique) {
      try {
        await addDoc(collection(database, 'staff_notifications'), {
          recipient_uid: uid,
          type: input.type,
          title: input.title,
          body: input.body,
          event_id: input.event_id ?? null,
          club_id: input.club_id ?? null,
          player_uid: input.player_uid ?? null,
          read_at: null,
          created_at: serverTimestamp(),
        });
        n += 1;
      } catch {
        // best-effort par destinataire
      }
    }
    return n;
  },

  async listForUser(uid: string, max = 40): Promise<StaffNotification[]> {
    if (!isFirebaseConfigured()) return [];
    const database = getDb();
    if (!database) return [];
    try {
      const q = query(
        collection(database, 'staff_notifications'),
        where('recipient_uid', '==', uid),
        orderBy('created_at', 'desc'),
        limit(max),
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => {
        const data = d.data() as Record<string, unknown>;
        return {
          id: d.id,
          recipient_uid: String(data.recipient_uid ?? ''),
          type: (data.type as StaffNotificationType) ?? 'generic',
          title: String(data.title ?? ''),
          body: String(data.body ?? ''),
          event_id: data.event_id ? String(data.event_id) : undefined,
          club_id: data.club_id ? String(data.club_id) : undefined,
          player_uid: data.player_uid ? String(data.player_uid) : undefined,
          read_at: data.read_at ? toDate(data.read_at) : null,
          created_at: toDate(data.created_at),
        };
      });
    } catch {
      return [];
    }
  },

  async markRead(id: string): Promise<void> {
    const database = getDb();
    if (!database) return;
    await updateDoc(doc(database, 'staff_notifications', id), {
      read_at: serverTimestamp(),
    });
  },
};
