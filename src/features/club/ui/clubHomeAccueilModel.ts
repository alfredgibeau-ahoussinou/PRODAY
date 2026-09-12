/**
 * Helpers purs Accueil Club — priorité, méta équipes, CTAs (testables).
 */
import type { ClubTeamRow } from '../../../utils/clubStructureView';
import {
  getPendingInviteeUids,
  isCoachMatchEvent,
  isCoachTrainingEvent,
  type TeamEvent,
} from '../../../models/TeamEvent';
export type ClubHomePriority =
  | { kind: 'match'; event: TeamEvent }
  | { kind: 'training'; event: TeamEvent }
  | { kind: 'calm' };

export type ClubHomeTeamCard = {
  id?: string;
  teamId?: string;
  name: string;
  metaPrimary: string;
  metaSecondary: string;
  hasCoach: boolean;
  coachesLabel: string;
  onPress: () => void;
};

export function greetingForHour(h: number): string {
  if (h < 12) return 'Bonjour';
  if (h < 18) return 'Bon après-midi';
  return 'Bonsoir';
}

export function formatClubHomeMetaLine(players: number, coaches: number, teams: number): string {
  return [
    `${players} joueur${players > 1 ? 's' : ''}`,
    `${coaches} coach${coaches > 1 ? 's' : ''}`,
    `${teams} équipe${teams > 1 ? 's' : ''}`,
  ].join(' · ');
}

export function upcomingClubEvents(
  events: TeamEvent[],
  predicate: (e: TeamEvent) => boolean,
): TeamEvent[] {
  const now = Date.now();
  return events
    .filter((e) => predicate(e) && e.starts_at && new Date(e.starts_at).getTime() >= now - 30 * 60 * 1000)
    .sort((a, b) => new Date(a.starts_at!).getTime() - new Date(b.starts_at!).getTime());
}

export function resolveClubHomePriority(input: {
  todayMatches: TeamEvent[];
  todayTrainings: TeamEvent[];
  events: TeamEvent[];
}): ClubHomePriority {
  const nextMatch =
    input.todayMatches.find((e) => e.starts_at && new Date(e.starts_at).getTime() >= Date.now() - 30 * 60 * 1000) ??
    upcomingClubEvents(input.events, isCoachMatchEvent)[0] ??
    input.todayMatches[0];
  const nextTraining =
    input.todayTrainings.find((e) => e.starts_at && new Date(e.starts_at).getTime() >= Date.now() - 30 * 60 * 1000) ??
    upcomingClubEvents(input.events, isCoachTrainingEvent)[0] ??
    input.todayTrainings[0];

  if (nextMatch?.starts_at && nextTraining?.starts_at) {
    const mt = new Date(nextMatch.starts_at).getTime();
    const tt = new Date(nextTraining.starts_at).getTime();
    return mt <= tt
      ? { kind: 'match', event: nextMatch }
      : { kind: 'training', event: nextTraining };
  }
  if (nextMatch) return { kind: 'match', event: nextMatch };
  if (nextTraining) return { kind: 'training', event: nextTraining };
  return { kind: 'calm' };
}

function endOfNextWeek(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 8);
  d.setHours(23, 59, 59, 999);
  return d;
}

export function resolveClubPresenceAlert(events: TeamEvent[]): {
  pendingCount: number;
  eventLabel?: string;
  nav: 'matches' | 'trainings' | 'calendar';
} {
  const now = Date.now();
  const horizon = endOfNextWeek().getTime();
  const upcoming = events
    .filter((e) => {
      if (!e.starts_at) return false;
      const t = new Date(e.starts_at).getTime();
      return t >= now - 30 * 60 * 1000 && t <= horizon;
    })
    .sort((a, b) => new Date(a.starts_at!).getTime() - new Date(b.starts_at!).getTime());

  let pendingCount = 0;
  let firstWithPending: TeamEvent | undefined;
  for (const event of upcoming) {
    const pending = getPendingInviteeUids(event).length;
    if (pending <= 0) continue;
    pendingCount += pending;
    if (!firstWithPending) firstWithPending = event;
  }

  if (!firstWithPending) {
    return { pendingCount: 0, nav: 'calendar' };
  }

  const nav = isCoachMatchEvent(firstWithPending)
    ? 'matches'
    : isCoachTrainingEvent(firstWithPending)
      ? 'trainings'
      : 'calendar';

  return {
    pendingCount,
    eventLabel: firstWithPending.title?.trim() || undefined,
    nav,
  };
}

export function resolvePriorityTeamLabel(
  priority: ClubHomePriority,
  teamRows: ClubTeamRow[],
): string | undefined {
  if (priority.kind === 'calm') return undefined;
  const teamId = priority.event.team_id?.trim();
  if (!teamId) return undefined;
  return teamRows.find((row) => row.teamId === teamId)?.name?.trim() || undefined;
}

export function resolvePriorityLocationLabel(priority: ClubHomePriority): string | undefined {
  if (priority.kind === 'calm') return undefined;
  const loc = priority.event.location_label?.trim();
  if (loc) return loc;
  if (priority.kind === 'match') {
    const fromLive = priority.event.live_state?.opponent_name?.trim();
    if (fromLive && fromLive !== 'Adversaire') return `vs ${fromLive}`;
    const title = priority.event.title?.trim() ?? '';
    const parts = title.split(/\s+vs\.?\s+|\s+[–—-]\s+/i);
    const away = parts[1]?.trim();
    if (away) return `vs ${away}`;
  }
  return undefined;
}

export function buildClubHomeTeamCards(
  rows: ClubTeamRow[],
  max: number,
  openTeam: (teamId: string) => void,
): ClubHomeTeamCard[] {
  return rows.slice(0, max).map((row) => {
    const hasCoach = row.coachNames.length > 0;
    const metaPrimary = [row.category, row.genderLabel].filter(Boolean).join(' · ');
    const metaSecondary = `${row.licensedCount} licencié${row.licensedCount > 1 ? 's' : ''}`;
    return {
      id: row.teamId,
      name: row.name,
      metaPrimary,
      metaSecondary,
      coachesLabel: hasCoach ? row.coachNames.slice(0, 2).join(', ') : 'Sans coach',
      hasCoach,
      onPress: () => openTeam(row.teamId),
    };
  });
}
