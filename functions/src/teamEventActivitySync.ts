import { onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';

const db = admin.firestore();
const ACTIVITIES_COL = 'player_activities';

type AttendanceMark = 'present' | 'late' | 'excused' | 'absent';
type RsvpStatus = 'pending' | 'yes' | 'no' | 'maybe';

interface TeamEventDoc {
  title?: string;
  event_type?: string;
  starts_at?: admin.firestore.Timestamp;
  ends_at?: admin.firestore.Timestamp;
  invitee_uids?: string[];
  rsvps?: Record<string, RsvpStatus>;
  attendance_marks?: Record<string, AttendanceMark>;
  lineup?: {
    formation?: string;
    slots?: Array<{ uid: string }>;
  };
  player_match_stats?: Record<
    string,
    { minutes_played?: number; goals?: number; assists?: number; rating?: number }
  >;
  match_report_finalized_at?: admin.firestore.Timestamp;
  live_state?: { status?: string };
  organizer_uid?: string;
}

interface ActivityInput {
  player_uid: string;
  type: 'match';
  date: Date;
  duration_min: number;
  goals?: number;
  assists?: number;
  rating_self?: number;
  notes?: string;
  source: 'team_event';
  team_event_id: string;
}

function toDate(value: unknown): Date {
  if (value instanceof admin.firestore.Timestamp) return value.toDate();
  if (value instanceof Date) return value;
  return new Date();
}

function playerPlayedInTeamEvent(event: TeamEventDoc, uid: string): boolean {
  const mark = event.attendance_marks?.[uid];
  if (mark === 'present' || mark === 'late') return true;

  const inLineup = event.lineup?.slots?.some((s) => s.uid === uid) ?? false;
  const startsAt = toDate(event.starts_at);
  const eventDone =
    Boolean(event.match_report_finalized_at) ||
    event.live_state?.status === 'finished' ||
    (startsAt.getTime() < Date.now() - 2 * 60 * 60 * 1000 && inLineup);

  if (inLineup && eventDone) return true;

  if (event.rsvps?.[uid] === 'yes' && startsAt.getTime() <= Date.now()) {
    return event.event_type === 'friendly' || event.event_type === 'training';
  }

  return false;
}

function teamEventDurationMin(event: TeamEventDoc): number {
  const startsAt = toDate(event.starts_at);
  if (event.ends_at) {
    const mins = Math.round((toDate(event.ends_at).getTime() - startsAt.getTime()) / 60000);
    if (mins > 0) return mins;
  }
  return 90;
}

function buildActivityFromTeamEvent(eventId: string, event: TeamEventDoc, playerUid: string): ActivityInput | null {
  if (!playerPlayedInTeamEvent(event, playerUid)) return null;

  const sheet = event.player_match_stats?.[playerUid];
  const notes = event.title?.trim() || undefined;

  return {
    player_uid: playerUid,
    type: 'match',
    date: toDate(event.starts_at),
    duration_min: sheet?.minutes_played ?? teamEventDurationMin(event),
    goals: sheet?.goals,
    assists: sheet?.assists,
    rating_self: sheet?.rating,
    notes,
    source: 'team_event',
    team_event_id: eventId,
  };
}

function collectCandidatePlayerUids(event: TeamEventDoc): string[] {
  const uids = new Set<string>();
  for (const uid of event.invitee_uids ?? []) uids.add(uid);
  for (const uid of Object.keys(event.attendance_marks ?? {})) uids.add(uid);
  for (const uid of Object.keys(event.player_match_stats ?? {})) uids.add(uid);
  for (const slot of event.lineup?.slots ?? []) {
    if (slot.uid) uids.add(slot.uid);
  }
  return [...uids];
}

function activityDocPayload(input: ActivityInput): Record<string, unknown> {
  return {
    player_uid: input.player_uid,
    type: input.type,
    date: admin.firestore.Timestamp.fromDate(input.date),
    duration_min: input.duration_min,
    goals: input.goals ?? null,
    assists: input.assists ?? null,
    rating_self: input.rating_self ?? null,
    notes: input.notes?.trim() || null,
    video_url: null,
    source: input.source,
    team_event_id: input.team_event_id,
    updated_at: admin.firestore.FieldValue.serverTimestamp(),
  };
}

async function findActivityByTeamEvent(playerUid: string, teamEventId: string) {
  const snap = await db
    .collection(ACTIVITIES_COL)
    .where('player_uid', '==', playerUid)
    .where('team_event_id', '==', teamEventId)
    .limit(1)
    .get();
  return snap.docs[0] ?? null;
}

/** Crée ou met à jour les player_activities pour tous les joueurs concernés par un team_event. */
export async function syncTeamEventActivitiesForEvent(
  eventId: string,
  event: TeamEventDoc
): Promise<{ synced: number; skipped: number }> {
  let synced = 0;
  let skipped = 0;

  for (const playerUid of collectCandidatePlayerUids(event)) {
    const input = buildActivityFromTeamEvent(eventId, event, playerUid);
    if (!input) {
      skipped += 1;
      continue;
    }

    const existing = await findActivityByTeamEvent(playerUid, eventId);
    const payload = activityDocPayload(input);

    if (existing) {
      await existing.ref.update(payload);
    } else {
      await db.collection(ACTIVITIES_COL).add({
        ...payload,
        created_at: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
    synced += 1;
  }

  return { synced, skipped };
}

function teamEventStaffRelevantChange(before: TeamEventDoc, after: TeamEventDoc): boolean {
  const keys: (keyof TeamEventDoc)[] = [
    'attendance_marks',
    'lineup',
    'player_match_stats',
    'match_report_finalized_at',
    'live_state',
    'rsvps',
    'starts_at',
    'ends_at',
  ];
  return keys.some((key) => JSON.stringify(before[key] ?? null) !== JSON.stringify(after[key] ?? null));
}

const firestoreTriggerOptions = {
  document: 'team_events/{eventId}',
  region: 'europe-west1',
} as const;

/** Staff met à jour présence / compo → sync player_activities côté serveur (Gen2, europe-west1). */
export const onTeamEventUpdated = onDocumentUpdated(firestoreTriggerOptions, async (event) => {
  const before = event.data?.before.data() as TeamEventDoc | undefined;
  const after = event.data?.after.data() as TeamEventDoc | undefined;
  if (!before || !after) return;

  if (!teamEventStaffRelevantChange(before, after)) return;

  const result = await syncTeamEventActivitiesForEvent(event.params.eventId, after);
  console.log('[onTeamEventUpdated]', event.params.eventId, result);
});

/** Callable — relance sync après sauvegarde coach si le trigger n'est pas déployé. */
export const syncTeamEventActivities = onCall({ region: 'europe-west1' }, async (request) => {
  if (!request.auth?.uid) {
    throw new HttpsError('unauthenticated', 'Connexion requise');
  }

  const { eventId } = request.data as { eventId?: string };
  if (!eventId?.trim()) {
    throw new HttpsError('invalid-argument', 'eventId requis');
  }

  const eventRef = db.doc(`team_events/${eventId.trim()}`);
  const eventSnap = await eventRef.get();
  if (!eventSnap.exists) {
    throw new HttpsError('not-found', 'Événement introuvable');
  }

  const event = eventSnap.data() as TeamEventDoc;
  const callerUid = request.auth.uid;
  const isAdmin = request.auth.token?.admin === true;
  const isOrganizer = event.organizer_uid === callerUid;

  let isClubStaff = false;
  if (!isAdmin && !isOrganizer) {
    const callerSnap = await db.doc(`users/${callerUid}`).get();
    const caller = callerSnap.data() ?? {};
    const role = String(caller.role ?? '');
    isClubStaff = ['coach', 'agent', 'organizer'].includes(role);
    if (!isClubStaff) {
      throw new HttpsError('permission-denied', 'Staff ou organisateur requis');
    }
  }

  return syncTeamEventActivitiesForEvent(eventSnap.id, event);
});
