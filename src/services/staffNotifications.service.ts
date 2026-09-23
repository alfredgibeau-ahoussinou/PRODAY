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
  | 'rsvp_reminder_log'
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
  /** Métadonnées libres (journal des relances : auteur, noms…) — jamais rendues telles quelles. */
  meta?: Record<string, unknown>;
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
    meta?: Record<string, unknown>;
    /** Trace d'historique : `true` évite d'alourdir le compteur « Nouveau ». */
    markAsRead?: boolean;
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
          meta: input.meta ?? null,
          /** Journal : déjà lu à la création — l'historique n'est pas une alerte. */
          read_at: input.markAsRead ? serverTimestamp() : null,
          created_at: serverTimestamp(),
        });
        n += 1;
      } catch {
        // best-effort par destinataire
      }
    }
    return n;
  },

  /**
   * Historique des relances — les traces `rsvp_reminder_log` adressées au
   * staff, triées par date décroissante. Requête **filtrée côté base** sur le
   * type : l'historique n'est pas un filtrage client de l'inbox.
   */
  async listReminderLogs(uid: string, max = 60): Promise<StaffNotification[]> {
    if (!isFirebaseConfigured()) return [];
    const database = getDb();
    if (!database) return [];
    try {
      const q = query(
        collection(database, 'staff_notifications'),
        where('recipient_uid', '==', uid),
        where('type', '==', 'rsvp_reminder_log'),
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
          meta: (data.meta as Record<string, unknown> | null) ?? undefined,
          read_at: data.read_at ? toDate(data.read_at) : null,
          created_at: toDate(data.created_at),
        };
      });
    } catch {
      return [];
    }
  },

  /**
   * Traces de relance **d'un événement** — égalité seule (`event_id` + `type`),
   * sans `orderBy` : requêtable sans index composite. Le client trie par
   * `created_at` desc, ce qui suffit à trouver la relance la plus récente.
   * @param max fenêtre de lecture (par défaut 40) — assez pour les relances
   *   récentes ; au-delà, le garde-fou 24 h de toute façon ne s'applique plus.
   */
  async listReminderLogsForEvent(eventId: string, max = 40): Promise<StaffNotification[]> {
    if (!isFirebaseConfigured()) return [];
    const database = getDb();
    if (!database) return [];
    try {
      const q = query(
        collection(database, 'staff_notifications'),
        where('event_id', '==', eventId),
        where('type', '==', 'rsvp_reminder_log'),
        limit(max),
      );
      const snap = await getDocs(q);
      return snap.docs
        .map((d) => {
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
            meta: (data.meta as Record<string, unknown> | null) ?? undefined,
            read_at: data.read_at ? toDate(data.read_at) : null,
            created_at: toDate(data.created_at),
          };
        })
        .sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
    } catch {
      return [];
    }
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
          meta: (data.meta as Record<string, unknown> | null) ?? undefined,
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

  /** Marque comme lues les alertes non lues fournies (best-effort). */
  async markManyRead(ids: string[]): Promise<number> {
    const unique = [...new Set(ids.filter(Boolean))];
    let n = 0;
    for (const id of unique) {
      try {
        await this.markRead(id);
        n += 1;
      } catch {
        // best-effort
      }
    }
    return n;
  },
};
