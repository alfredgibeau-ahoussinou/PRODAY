import type { TeamEvent } from '../models/TeamEvent';
import type { CreatePlayerActivityInput } from '../models/PlayerActivity';

/** Joueur considéré présent / ayant joué — données team_events réelles uniquement. */
export function playerPlayedInTeamEvent(event: TeamEvent, uid: string): boolean {
  const mark = event.attendance_marks?.[uid];
  if (mark === 'present' || mark === 'late') return true;

  const inLineup = event.lineup?.slots.some((s) => s.uid === uid) ?? false;
  const eventDone =
    Boolean(event.match_report_finalized_at) ||
    event.live_state?.status === 'finished' ||
    (event.starts_at.getTime() < Date.now() - 2 * 60 * 60 * 1000 && inLineup);

  if (inLineup && eventDone) return true;

  if (event.rsvps[uid] === 'yes' && event.starts_at.getTime() <= Date.now()) {
    return event.event_type === 'friendly' || event.event_type === 'training';
  }

  return false;
}

export function teamEventDurationMin(event: TeamEvent): number {
  if (event.ends_at) {
    const mins = Math.round((event.ends_at.getTime() - event.starts_at.getTime()) / 60000);
    if (mins > 0) return mins;
  }
  return event.event_type === 'training' ? 90 : 90;
}

/** Mappe un événement équipe vers une activité match liée. */
export function buildActivityFromTeamEvent(
  event: TeamEvent,
  playerUid: string
): CreatePlayerActivityInput | null {
  if (!playerPlayedInTeamEvent(event, playerUid)) return null;

  const sheet = event.player_match_stats?.[playerUid];
  const notes = event.title?.trim() || undefined;

  return {
    player_uid: playerUid,
    type: 'match',
    date: event.starts_at,
    duration_min: sheet?.minutes_played ?? teamEventDurationMin(event),
    goals: sheet?.goals,
    assists: sheet?.assists,
    rating_self: sheet?.rating,
    notes,
    source: 'team_event',
    team_event_id: event.id,
  };
}
