/**
 * Helpers purs Match day Club — hero, score, présence (testables).
 */
import type { ClubTeamRow } from '../../../utils/clubStructureView';
import {
  countRsvpYes,
  EVENT_TYPE_LABELS,
  getPendingInviteeUids,
  isCoachMatchEvent,
  type MatchLiveStatus,
  type TeamEvent,
} from '../../../models/TeamEvent';
import { MATCH_LIVE_STATUS_LABELS, resolveLiveState } from '../../../utils/matchLive';
import type { MatchHubChapterId } from '../../../content/matchHubChapters';

export type ClubMatchPresenceSummary = {
  invited: number;
  confirmed: number;
  pending: number;
  label: string;
};

export type ClubMatchCardModel = {
  id: string;
  title: string;
  homeLabel: string;
  awayLabel: string;
  homeScore: number | null;
  awayScore: number | null;
  showScore: boolean;
  clockLabel: string;
  dayLabel: string;
  teamLabel?: string;
  locationLabel?: string;
  typeLabel: string;
  status: MatchLiveStatus;
  statusLabel: string;
  presence: ClubMatchPresenceSummary;
  isToday: boolean;
  isLive: boolean;
};

function asDate(value: Date | string | undefined): Date | null {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

export function isSameCalendarDay(a: Date, b: Date): boolean {
  return a >= startOfDay(b) && a <= endOfDay(b);
}

export function formatMatchClock(d: Date): string {
  return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

export function formatMatchDay(d: Date): string {
  return d.toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

export function sortClubMatches(events: TeamEvent[]): TeamEvent[] {
  return events
    .filter(isCoachMatchEvent)
    .slice()
    .sort((a, b) => {
      const at = asDate(a.starts_at)?.getTime() ?? 0;
      const bt = asDate(b.starts_at)?.getTime() ?? 0;
      return at - bt;
    });
}

/** Match du jour / prochain / live — une seule priorité hero. */
export function resolveClubMatchHero(matches: TeamEvent[], now = new Date()): TeamEvent | null {
  if (matches.length === 0) return null;

  const live = matches.find((m) => {
    const status = resolveLiveState(m).status;
    return status === 'live' || status === 'halftime';
  });
  if (live) return live;

  const upcomingToday = matches.find((m) => {
    const start = asDate(m.starts_at);
    if (!start) return false;
    return isSameCalendarDay(start, now) && start.getTime() >= now.getTime() - 30 * 60 * 1000;
  });
  if (upcomingToday) return upcomingToday;

  const nextFuture = matches.find((m) => {
    const start = asDate(m.starts_at);
    return start != null && start.getTime() >= now.getTime() - 30 * 60 * 1000;
  });
  if (nextFuture) return nextFuture;

  const todayAny = matches.find((m) => {
    const start = asDate(m.starts_at);
    return start != null && isSameCalendarDay(start, now);
  });
  if (todayAny) return todayAny;

  return matches[matches.length - 1] ?? null;
}

export function summarizeMatchPresence(event: TeamEvent): ClubMatchPresenceSummary {
  const invited = event.invitee_uids?.length ?? 0;
  const pending = getPendingInviteeUids(event).length;
  const confirmed = countRsvpYes(event);
  if (invited <= 0) {
    return {
      invited: 0,
      confirmed: 0,
      pending: 0,
      label: 'Pas encore de convocations',
    };
  }
  if (pending > 0) {
    return {
      invited,
      confirmed,
      pending,
      label: `${pending} réponse${pending > 1 ? 's' : ''} en attente · ${confirmed}/${invited} OK`,
    };
  }
  return {
    invited,
    confirmed,
    pending: 0,
    label: `${confirmed}/${invited} présents confirmés`,
  };
}

export function resolveMatchTeamLabel(
  event: TeamEvent,
  teamRows: ClubTeamRow[],
): string | undefined {
  const teamId = event.team_id?.trim();
  if (!teamId) return undefined;
  return teamRows.find((row) => row.teamId === teamId)?.name?.trim() || undefined;
}

export function buildClubMatchCardModel(
  event: TeamEvent,
  teamRows: ClubTeamRow[],
  now = new Date(),
): ClubMatchCardModel {
  const live = resolveLiveState(event);
  const starts = asDate(event.starts_at);
  const title = event.title?.trim() || 'Match';
  const homeLabel = live.home_label?.trim() || event.club_name?.trim() || 'Domicile';
  const liveAway = live.opponent_name?.trim();
  const awayLabel =
    (liveAway && liveAway !== 'Adversaire' ? liveAway : undefined) ||
    parseAwayFromTitle(title) ||
    liveAway ||
    'Adversaire';
  const status = live.status;
  const showScore = status === 'live' || status === 'halftime' || status === 'finished';
  const teamLabel = resolveMatchTeamLabel(event, teamRows);
  const locationLabel = event.location_label?.trim() || event.city?.trim() || undefined;

  return {
    id: event.id,
    title,
    homeLabel,
    awayLabel,
    homeScore: showScore ? live.home_score : null,
    awayScore: showScore ? live.away_score : null,
    showScore,
    clockLabel: starts ? formatMatchClock(starts) : 'Horaire à confirmer',
    dayLabel: starts ? formatMatchDay(starts) : 'Date à confirmer',
    teamLabel,
    locationLabel,
    typeLabel: EVENT_TYPE_LABELS[event.event_type] ?? 'Match',
    status,
    statusLabel: MATCH_LIVE_STATUS_LABELS[status],
    presence: summarizeMatchPresence(event),
    isToday: starts ? isSameCalendarDay(starts, now) : false,
    isLive: status === 'live' || status === 'halftime',
  };
}

function parseAwayFromTitle(title: string): string | undefined {
  const parts = title.split(/\s+vs\.?\s+|\s+[–—-]\s+/i);
  const away = parts[1]?.trim();
  return away || undefined;
}

export type ClubMatchHubAction = {
  id: MatchHubChapterId;
  label: string;
};

/** CTAs honnêtes vers chapitres MatchEventHub existants. */
export function resolveMatchHubActions(model: ClubMatchCardModel): ClubMatchHubAction[] {
  const actions: ClubMatchHubAction[] = [
    { id: 'apercu', label: model.isLive ? 'Ouvrir' : 'Détail' },
  ];
  if (model.presence.invited > 0 || model.presence.pending > 0) {
    actions.push({ id: 'effectif', label: 'Convocations' });
  }
  actions.push({ id: 'composition', label: 'Compo' });
  if (model.isLive || model.status === 'finished' || model.isToday) {
    actions.push({ id: 'live', label: model.isLive ? 'Live' : 'Score' });
  }
  return actions.slice(0, 4);
}
