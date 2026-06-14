import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  arrayUnion,
} from 'firebase/firestore';
import { getDb } from '../lib/firebase';
import { isFirebaseConfigured } from '../config/firebase';
import type { TeamEvent } from '../models/TeamEvent';
import { userRsvp } from '../models/TeamEvent';
import { isTeamThread, teamThreadId } from '../utils/teamChatIds';

export { teamThreadId, isTeamThread } from '../utils/teamChatIds';

function teamParticipantIds(event: TeamEvent): string[] {
  const ids = new Set<string>([event.organizer_uid, ...event.invitee_uids]);
  for (const [uid, status] of Object.entries(event.rsvps)) {
    if (status === 'yes') ids.add(uid);
  }
  return [...ids];
}

function teamParticipantNames(event: TeamEvent): Record<string, string> {
  const names: Record<string, string> = {
    [event.organizer_uid]: event.organizer_name,
  };
  for (const uid of event.invitee_uids) {
    if (!names[uid]) names[uid] = 'Joueur';
  }
  return names;
}

/** Groupe équipe auto — pattern WhatsApp/Discord à la RSVP. */
export const teamChatService = {
  teamThreadId,
  isTeamThread,

  async ensureTeamThread(event: TeamEvent): Promise<string | null> {
    if (!isFirebaseConfigured()) return null;
    const database = getDb();
    if (!database) return null;

    const id = teamThreadId(event.id);
    const ref = doc(database, 'message_threads', id);
    const snap = await getDoc(ref);
    const participantIds = teamParticipantIds(event);
    const participantNames = teamParticipantNames(event);

    if (!snap.exists()) {
      await setDoc(ref, {
        participant_ids: participantIds,
        participant_names: participantNames,
        thread_kind: 'team_group',
        thread_title: `Équipe · ${event.title}`,
        event_id: event.id,
        last_message: 'Groupe créé pour l’événement',
        updated_at: serverTimestamp(),
        unread_by: [],
      });
      return id;
    }

    await updateDoc(ref, {
      participant_ids: participantIds,
      participant_names: { ...(snap.data().participant_names ?? {}), ...participantNames },
      thread_title: `Équipe · ${event.title}`,
      updated_at: serverTimestamp(),
    });
    return id;
  },

  async syncOnRsvp(eventId: string, uid: string, status: string): Promise<void> {
    if (status !== 'yes') return;
    const { teamEventsService } = await import('./teamEvents.service');
    const event = await teamEventsService.getById(eventId);
    if (!event) return;
    if (userRsvp(event, uid) !== 'yes' && status === 'yes') {
      event.rsvps = { ...event.rsvps, [uid]: 'yes' };
    }
    await this.ensureTeamThread(event);
  },
};
