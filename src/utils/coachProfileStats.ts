import type { TeamEvent } from '../models/TeamEvent';
import type { User } from '../models/User';

export interface CoachProfileStats {
  sessionsCreated: number;
  matchesManaged: number;
  matchesWithSheets: number;
  rosterSize: number;
  recentActivity: { label: string; date: Date }[];
}

function isMatchEvent(e: TeamEvent): boolean {
  return (
    e.event_type === 'friendly' ||
    e.event_type === 'competition' ||
    e.event_type === 'tournament'
  );
}

/** Stats coach réelles — jamais de chiffres inventés. */
export function buildCoachProfileStats(
  events: TeamEvent[],
  members: User[],
  coachUid: string,
): CoachProfileStats {
  const organized = events.filter((e) => e.organizer_uid === coachUid);
  const sessions = organized.filter((e) => e.event_type === 'training').length;
  const matches = organized.filter((e) => isMatchEvent(e)).length;
  const withSheets = events.filter(
    (e) => e.player_match_stats && Object.keys(e.player_match_stats).length > 0,
  ).length;

  const recent = [...events]
    .sort((a, b) => b.starts_at.getTime() - a.starts_at.getTime())
    .slice(0, 5)
    .map((e) => ({
      label: e.title,
      date: e.starts_at,
    }));

  return {
    sessionsCreated: sessions || events.filter((e) => e.event_type === 'training').length,
    matchesManaged: matches || events.filter((e) => isMatchEvent(e)).length,
    matchesWithSheets: withSheets,
    rosterSize: members.length,
    recentActivity: recent,
  };
}
