import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { getDb } from '../lib/firebase';
import { isFirebaseConfigured } from '../config/firebase';
import {
  applicationFromFirestore,
  teamEventFromFirestore,
} from '../lib/firestoreMappers';
import { messagesService } from './messages.service';
import { recruitmentService } from './recruitment.service';
import type { ParentalContact } from '../models/ParentalSettings';

export interface ParentalActivitySummary {
  messagesCount: number;
  applicationsCount: number;
  eventsCount: number;
  contacts: ParentalContact[];
  recent: { title: string; meta: string; safe: boolean }[];
}

export const parentalActivityService = {
  async getSummary(childUid: string): Promise<ParentalActivitySummary> {
    if (!isFirebaseConfigured()) {
      return {
        messagesCount: 0,
        applicationsCount: 0,
        eventsCount: 0,
        contacts: [],
        recent: [],
      };
    }

    const database = getDb();
    if (!database) {
      return {
        messagesCount: 0,
        applicationsCount: 0,
        eventsCount: 0,
        contacts: [],
        recent: [],
      };
    }

    const [threads, applications, events] = await Promise.all([
      messagesService.listThreads(childUid),
      recruitmentService.listMyApplications(childUid),
      loadTeamEventsForChild(childUid),
    ]);

    const contactMap = new Map<string, ParentalContact>();
    for (const t of threads) {
      const otherUid = t.other_user_id;
      contactMap.set(otherUid, {
        uid: otherUid,
        name: t.participant_name ?? 'Contact ProDay',
        role: 'Messagerie',
        approved: true,
      });
    }

    const recent: ParentalActivitySummary['recent'] = [];

    for (const t of threads.slice(0, 3)) {
      recent.push({
        title: `Conversation · ${t.participant_name ?? 'Contact'}`,
        meta: t.updated_at ? formatRelative(t.updated_at) : 'Messagerie ProDay',
        safe: true,
      });
    }

    for (const app of applications.slice(0, 2)) {
      recent.push({
        title: `Candidature Mercato`,
        meta: `${app.status} · ${formatRelative(app.created_at)}`,
        safe: true,
      });
    }

    for (const ev of events.slice(0, 2)) {
      recent.push({
        title: ev.title,
        meta: `${ev.event_type === 'detection' ? 'Détection' : 'Événement'} · ${formatRelative(ev.starts_at)}`,
        safe: true,
      });
    }

    return {
      messagesCount: threads.length,
      applicationsCount: applications.length,
      eventsCount: events.length,
      contacts: Array.from(contactMap.values()),
      recent,
    };
  },
};

function formatRelative(d: Date): string {
  const diff = Date.now() - d.getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Aujourd'hui";
  if (days === 1) return 'Hier';
  if (days < 7) return `Il y a ${days} j`;
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

async function loadTeamEventsForChild(childUid: string) {
  const database = getDb();
  if (!database) return [];
  try {
    const snap = await getDocs(
      query(
        collection(database, 'team_events'),
        where('invitee_uids', 'array-contains', childUid),
        limit(12)
      )
    );
    return snap.docs.map((d) =>
      teamEventFromFirestore(d.id, d.data() as Record<string, unknown>)
    );
  } catch {
    const snap = await getDocs(collection(database, 'team_events'));
    return snap.docs
      .map((d) => teamEventFromFirestore(d.id, d.data() as Record<string, unknown>))
      .filter((e) => e.invitee_uids?.includes(childUid))
      .slice(0, 12);
  }
}
