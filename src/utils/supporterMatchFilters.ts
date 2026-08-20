import type { ExternalFixture } from '../services/externalScores.service';
import type { Follow } from '../models/Follow';
import type { TeamEvent } from '../models/TeamEvent';
import type { Tournament } from '../models/Tournament';
import type { ExternalCompetitionId } from '../services/externalScores.types';
import type {
  SupporterCompetitionFilter,
  SupporterGenderFilter,
  SupporterMatchFilters,
  SupporterScopeFilter,
  SupporterSourceFilter,
} from '../services/supporterPreferences.service';
import { inferMatchStatus, resolveLiveState } from './matchLive';
import { formatCalendarDate } from './seasonCalendar';
import { extractProdayOfficialWatchUrl } from './supporterBroadcast';
import {
  buildWorldFollowIndex,
  matchItemTouchesFollows,
  worldFollowTargetForTeam,
} from './supporterWorldFollows';

/** Heure de coup d’envoi tabulaire (21:00). */
export function formatKickoffClock(date: Date): string {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return '--:--';
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

export type SupporterGenderScope = 'men' | 'women' | 'mixed' | 'unspecified';

export type SupporterMatchStatus = 'live' | 'finished' | 'upcoming';

export interface SupporterFollowContext {
  clubIds: Set<string>;
  tournamentIds: Set<string>;
  playerIds: Set<string>;
}

export interface SupporterMatchViewItem {
  id: string;
  source: 'proday' | 'world';
  status: SupporterMatchStatus;
  genderScope: SupporterGenderScope;
  homeLabel: string;
  awayLabel: string;
  scoreHome?: number;
  scoreAway?: number;
  minute?: number;
  startsAt: Date;
  scorers?: string[];
  clubId?: string;
  tournamentId?: string;
  competitionSlug?: ExternalCompetitionId;
  competitionLabel?: string;
  followTarget?: { type: 'club' | 'tournament'; id: string; label: string };
  homeFollowTarget?: { type: 'club'; id: string; label: string };
  awayFollowTarget?: { type: 'club'; id: string; label: string };
  homeTeamId?: number;
  awayTeamId?: number;
  worldFixtureId?: string;
  broadcastListed?: boolean;
  broadcastLabel?: string;
  watchUrl?: string;
  meta?: string;
  timeLabel?: string;
}

const FEMININE_HINTS = /\b(f|filles?|féminin|femmes?|d1f|arkema|uwcl)\b/i;
const MIXED_HINTS = /\b(mixte|mixed|x)\b/i;

export function inferGenderFromCategories(categories: string[] | undefined): SupporterGenderScope {
  const joined = (categories ?? []).join(' ').toLowerCase();
  if (MIXED_HINTS.test(joined)) return 'mixed';
  if (FEMININE_HINTS.test(joined)) return 'women';
  if (/\b(garçons?|masculin|hommes?|seniors h|u\d+\s*m)\b/i.test(joined)) return 'men';
  return 'unspecified';
}

export function inferGenderFromExternalFixture(fixture: ExternalFixture): SupporterGenderScope {
  if (fixture.competition === 'd1f') return 'women';
  if (['ligue1', 'pl', 'laliga', 'seriea', 'bundesliga', 'ligue2', 'ucl', 'uel'].includes(fixture.competition)) {
    return 'men';
  }
  return inferGenderFromCategories([fixture.competition_label]);
}

function mapLiveStatus(status: string): SupporterMatchStatus {
  if (status === 'live' || status === 'halftime') return 'live';
  if (status === 'finished') return 'finished';
  return 'upcoming';
}

function extractScorersFromEvent(event: TeamEvent): string[] | undefined {
  const goals = (event.live_actions ?? []).filter((action) => action.type === 'goal');
  if (goals.length === 0) return undefined;
  return goals.map((goal) => `${goal.player_name} ${goal.minute}'`);
}

export function teamEventToMatchItem(event: TeamEvent): SupporterMatchViewItem {
  const live = resolveLiveState(event);
  const status = mapLiveStatus(live.status);
  const opponent = live.opponent_name ?? 'Adversaire';
  const home = live.home_label ?? event.club_name ?? event.title;

  return {
    id: `proday-event-${event.id}`,
    source: 'proday',
    status,
    genderScope: inferGenderFromCategories(event.categories),
    homeLabel: home,
    awayLabel: opponent,
    scoreHome: status === 'upcoming' ? undefined : live.home_score,
    scoreAway: status === 'upcoming' ? undefined : live.away_score,
    minute: status === 'live' ? live.minute : undefined,
    startsAt: event.starts_at,
    scorers: extractScorersFromEvent(event),
    clubId: event.club_id,
    tournamentId: event.tournament_id,
    followTarget: event.club_id
      ? { type: 'club', id: event.club_id, label: event.club_name ?? event.club_id }
      : event.tournament_id
        ? { type: 'tournament', id: event.tournament_id, label: event.title }
        : undefined,
    meta: [event.city, event.club_name].filter(Boolean).join(' · ') || undefined,
    timeLabel:
      status === 'upcoming'
        ? formatKickoffClock(event.starts_at)
        : status === 'live' && live.minute != null
          ? `${live.minute}'`
          : undefined,
    watchUrl: extractProdayOfficialWatchUrl({
      public_watch_url: event.public_watch_url,
      description: event.description,
    }),
    broadcastListed: Boolean(
      extractProdayOfficialWatchUrl({
        public_watch_url: event.public_watch_url,
        description: event.description,
      }),
    ),
  };
}

export function externalFixtureToMatchItem(fixture: ExternalFixture): SupporterMatchViewItem {
  const status =
    fixture.status === 'live'
      ? 'live'
      : fixture.status === 'finished'
        ? 'finished'
        : 'upcoming';

  const homeFollow = worldFollowTargetForTeam({
    apiTeamId: fixture.home_team_id,
    name: fixture.home_team,
  });
  const awayFollow = worldFollowTargetForTeam({
    apiTeamId: fixture.away_team_id,
    name: fixture.away_team,
  });

  return {
    id: `world-fixture-${fixture.id}`,
    source: 'world',
    status,
    genderScope: inferGenderFromExternalFixture(fixture),
    homeLabel: fixture.home_team,
    awayLabel: fixture.away_team,
    scoreHome: fixture.score_home,
    scoreAway: fixture.score_away,
    minute: fixture.minute,
    startsAt: fixture.starts_at,
    clubId: undefined,
    competitionSlug: fixture.competition,
    competitionLabel: fixture.competition_label,
    homeFollowTarget: homeFollow,
    awayFollowTarget: awayFollow,
    homeTeamId: fixture.home_team_id,
    awayTeamId: fixture.away_team_id,
    worldFixtureId: fixture.id,
    broadcastListed: fixture.broadcast_listed,
    broadcastLabel: fixture.broadcast_label,
    watchUrl: fixture.broadcast_url,
    meta: [fixture.competition_label, fixture.venue].filter(Boolean).join(' · ') || undefined,
    timeLabel:
      status === 'live' && fixture.minute != null
        ? `${fixture.minute}'`
        : status === 'upcoming'
          ? formatKickoffClock(fixture.starts_at)
          : status === 'finished'
            ? formatCalendarDate(fixture.starts_at)
            : undefined,
  };
}

export function buildFollowContext(follows: Follow[]): SupporterFollowContext {
  return {
    clubIds: new Set(
      follows.filter((f) => f.target_type === 'club').map((f) => f.target_id)
    ),
    tournamentIds: new Set(
      follows.filter((f) => f.target_type === 'tournament').map((f) => f.target_id)
    ),
    playerIds: new Set(
      follows.filter((f) => f.target_type === 'player').map((f) => f.target_id)
    ),
  };
}

function matchesGender(scope: SupporterGenderScope, filter: SupporterGenderFilter): boolean {
  if (filter === 'all') return true;
  if (scope === 'unspecified') return true;
  return scope === filter;
}

function matchesSource(source: 'proday' | 'world', filter: SupporterSourceFilter): boolean {
  if (filter === 'all') return true;
  return source === filter;
}

function matchesScope(
  item: SupporterMatchViewItem,
  filter: SupporterScopeFilter,
  ctx: SupporterFollowContext,
  follows: Follow[],
): boolean {
  if (filter === 'all') return true;
  const worldIndex = buildWorldFollowIndex(follows);
  return matchItemTouchesFollows(item, ctx, worldIndex);
}

function matchesCompetition(
  item: SupporterMatchViewItem,
  filter: SupporterCompetitionFilter,
): boolean {
  if (filter === 'all') return true;
  if (item.source !== 'world') return true;
  return item.competitionSlug === filter;
}

export function filterMatchItems(
  items: SupporterMatchViewItem[],
  filters: SupporterMatchFilters,
  ctx: SupporterFollowContext,
  follows: Follow[] = [],
): SupporterMatchViewItem[] {
  return items.filter(
    (item) =>
      matchesGender(item.genderScope, filters.gender) &&
      matchesSource(item.source, filters.source) &&
      matchesScope(item, filters.scope, ctx, follows) &&
      matchesCompetition(item, filters.competition ?? 'all')
  );
}

export function filterTournaments(
  tournaments: Tournament[],
  filters: SupporterMatchFilters,
  ctx: SupporterFollowContext
): Tournament[] {
  return tournaments.filter((tournament) => {
    const genderScope = inferGenderFromCategories(tournament.categories);
    if (!matchesGender(genderScope, filters.gender)) return false;
    if (filters.source === 'world') return false;
    if (filters.scope === 'follows' && !ctx.tournamentIds.has(tournament.id)) return false;
    return true;
  });
}

export function filterTournamentsBySearch(
  tournaments: Tournament[],
  cityQuery: string,
  dateFilter: 'all' | 'week' | 'month'
): Tournament[] {
  const city = cityQuery.trim().toLowerCase();
  const now = new Date();
  const weekEnd = new Date(now);
  weekEnd.setDate(now.getDate() + 7);
  const monthEnd = new Date(now);
  monthEnd.setMonth(now.getMonth() + 1);

  return tournaments.filter((tournament) => {
    if (city && !tournament.city.toLowerCase().includes(city)) return false;
    if (dateFilter === 'week' && tournament.starts_at > weekEnd) return false;
    if (dateFilter === 'month' && tournament.starts_at > monthEnd) return false;
    return true;
  });
}

export function isEventLive(event: TeamEvent): boolean {
  return mapLiveStatus(inferMatchStatus(event)) === 'live';
}
