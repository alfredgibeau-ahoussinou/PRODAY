import type { Follow } from '../models/Follow';
import type { TeamEvent } from '../models/TeamEvent';
import type { Tournament } from '../models/Tournament';
import type { ExternalFixture } from './externalScores.types';
import { externalScoresService } from './externalScores.service';
import type { ExternalScoresProviderState } from './externalScores.types';
import { teamEventsService } from './teamEvents.service';
import {
  buildFollowContext,
  externalFixtureToMatchItem,
  filterMatchItems,
  filterTournaments,
  teamEventToMatchItem,
  type SupporterMatchViewItem,
} from '../utils/supporterMatchFilters';
import { isListedBroadcastItem } from '../utils/supporterBroadcast';
import {
  buildWorldFollowIndex,
  collectFollowedWorldTeamIds,
  hasClubOrWorldTeamFollows,
  matchItemTouchesFollows,
} from '../utils/supporterWorldFollows';
import { isProdayEventLiveNow } from '../utils/supporterLiveMatches';
import type { SupporterMatchFilters } from './supporterPreferences.service';

export type SupporterMatchHubSection =
  | 'upcoming'
  | 'live'
  | 'proday'
  | 'world'
  | 'follows'
  | 'broadcasts';

export const DEFAULT_SUPPORTER_MATCHS_CHAPTER: SupporterMatchHubSection = 'upcoming';

/** Fenêtre monde pour le chapitre À venir. */
export const SUPPORTER_UPCOMING_WORLD_DAYS = 14;

const MAX_FOLLOWED_TEAM_FETCH = 8;

export const SUPPORTER_HERO_KICKOFF_COUNT = 3;

export interface SupporterMatchHubSections {
  upcoming: SupporterMatchViewItem[];
  live: SupporterMatchViewItem[];
  recent: SupporterMatchViewItem[];
  proday: SupporterMatchViewItem[];
  world: SupporterMatchViewItem[];
  follows: SupporterMatchViewItem[];
  broadcasts: SupporterMatchViewItem[];
}

export interface SupporterMatchHubResult {
  sections: SupporterMatchHubSections;
  tournaments: Tournament[];
  liveCount: number;
  upcomingCount: number;
  heroKickoffs: SupporterMatchViewItem[];
  providerState: ExternalScoresProviderState;
}

export interface FetchSupporterMatchHubParams {
  calendarEvents: TeamEvent[];
  tournaments: Tournament[];
  follows: Follow[];
  filters: SupporterMatchFilters;
}

export type UpcomingDateKind = 'today' | 'tomorrow' | 'later';

export interface UpcomingCompetitionGroup {
  competition: string;
  items: SupporterMatchViewItem[];
}

export interface UpcomingDateGroup {
  dateKey: string;
  kind: UpcomingDateKind;
  date: Date;
  competitions: UpcomingCompetitionGroup[];
}

function dedupeEvents(events: TeamEvent[]): TeamEvent[] {
  const seen = new Set<string>();
  return events.filter((event) => {
    if (seen.has(event.id)) return false;
    seen.add(event.id);
    return true;
  });
}

function buildProdayUpcomingItems(events: TeamEvent[]): SupporterMatchViewItem[] {
  const now = Date.now();
  return events
    .filter((event) => event.starts_at.getTime() >= now && !isProdayEventLiveNow(event))
    .map(teamEventToMatchItem)
    .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
}

function buildFollowedMatchItems(
  events: TeamEvent[],
  ctx: ReturnType<typeof buildFollowContext>,
): SupporterMatchViewItem[] {
  return events
    .filter(
      (event) =>
        (event.club_id && ctx.clubIds.has(event.club_id)) ||
        (event.tournament_id && ctx.tournamentIds.has(event.tournament_id)),
    )
    .map(teamEventToMatchItem)
    .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
}

function dedupeMatchItems(items: SupporterMatchViewItem[]): SupporterMatchViewItem[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

function dedupeExternalFixtures(fixtures: ExternalFixture[]): ExternalFixture[] {
  const seen = new Set<string>();
  return fixtures.filter((fixture) => {
    if (seen.has(fixture.id)) return false;
    seen.add(fixture.id);
    return true;
  });
}

async function fetchFixturesForFollowedTeams(
  teamIds: number[],
  status: 'scheduled' | 'live' | 'finished',
): Promise<ExternalFixture[]> {
  if (teamIds.length === 0) return [];

  const options =
    status === 'scheduled'
      ? { status: 'scheduled' as const, next: 15, days: SUPPORTER_UPCOMING_WORLD_DAYS }
      : status === 'live'
        ? { status: 'live' as const }
        : { status: 'finished' as const, next: 5 };

  const batches = await Promise.all(
    teamIds.map((teamId) =>
      externalScoresService.listTeamFixtures(teamId, options).catch(() => [] as ExternalFixture[]),
    ),
  );

  return dedupeExternalFixtures(batches.flat()).filter((fixture) => fixture.status === status);
}

function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function localDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseLocalDateKey(key: string): Date {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function dateKind(date: Date, now: Date): UpcomingDateKind {
  const start = startOfLocalDay(now).getTime();
  const target = startOfLocalDay(date).getTime();
  const dayMs = 24 * 60 * 60 * 1000;
  if (target === start) return 'today';
  if (target === start + dayMs) return 'tomorrow';
  return 'later';
}

function competitionKey(item: SupporterMatchViewItem): string {
  if (item.source === 'proday') {
    return item.competitionLabel ?? 'ProDay';
  }
  return item.competitionLabel ?? item.meta?.split(' · ')[0] ?? 'Compétition';
}

/** Agrège live monde + PRODAY, calendrier à venir et état provider. */
export async function fetchSupporterMatchHub(
  params: FetchSupporterMatchHubParams,
): Promise<SupporterMatchHubResult> {
  const { calendarEvents, tournaments, follows, filters } = params;
  const followContext = buildFollowContext(follows);
  const followedTeamIds = collectFollowedWorldTeamIds(follows, MAX_FOLLOWED_TEAM_FETCH);
  const hasFollows = hasClubOrWorldTeamFollows(follows);

  const [liveWorldResult, upcomingWorldResult, recentWorld, upcomingProday, teamUpcoming, teamLive] =
    await Promise.all([
      externalScoresService
        .listLiveFixtures()
        .then((fixtures) => ({ fixtures, failed: false as const }))
        .catch(() => ({ fixtures: [] as ExternalFixture[], failed: true as const })),
      externalScoresService
        .listUpcomingFixtures({ days: SUPPORTER_UPCOMING_WORLD_DAYS })
        .then((fixtures) => ({ fixtures, failed: false as const }))
        .catch(() => ({ fixtures: [] as ExternalFixture[], failed: true as const })),
      externalScoresService.listRecentFinishedFixtures().catch(() => [] as ExternalFixture[]),
      teamEventsService.listUpcoming(60).catch(() => [] as TeamEvent[]),
      hasFollows
        ? fetchFixturesForFollowedTeams(followedTeamIds, 'scheduled')
        : Promise.resolve([] as ExternalFixture[]),
      hasFollows
        ? fetchFixturesForFollowedTeams(followedTeamIds, 'live')
        : Promise.resolve([] as ExternalFixture[]),
    ]);

  const liveWorld = liveWorldResult.fixtures;
  const upcomingWorld = upcomingWorldResult.fixtures;

  /** getState après les listes pour refléter healthy / message réels. */
  let providerState = await externalScoresService.getProviderState().catch(() => ({
    source: 'demo' as const,
    last_sync_at: new Date(),
    healthy: false,
    message: 'Impossible de charger les scores',
  }));

  const worldEmpty = upcomingWorld.length === 0;
  const scoresFailed =
    liveWorldResult.failed ||
    upcomingWorldResult.failed ||
    (worldEmpty && (providerState.source === 'merged' || providerState.source === 'api_football' || providerState.source === 'football_data'));

  if (scoresFailed && worldEmpty) {
    providerState = {
      ...providerState,
      healthy: false,
      message: providerState.message ?? 'Impossible de charger les scores',
      last_sync_at: providerState.last_sync_at ?? new Date(),
    };
  }

  const mergedEvents = dedupeEvents([...upcomingProday, ...calendarEvents]);
  const worldIndex = buildWorldFollowIndex(follows);

  const mergedUpcomingWorld = dedupeExternalFixtures([...teamUpcoming, ...upcomingWorld]);
  const mergedLiveWorld = dedupeExternalFixtures([...teamLive, ...liveWorld]);

  const worldLive = mergedLiveWorld
    .filter((fixture) => fixture.status === 'live')
    .map(externalFixtureToMatchItem);
  const prodayLive = mergedEvents
    .filter(isProdayEventLiveNow)
    .map(teamEventToMatchItem)
    .filter((item) => item.status === 'live');

  const liveRaw: SupporterMatchViewItem[] = dedupeMatchItems([...worldLive, ...prodayLive]);

  const recentRaw = recentWorld
    .filter((fixture) => fixture.status === 'finished')
    .map(externalFixtureToMatchItem);
  const prodayRaw = buildProdayUpcomingItems(mergedEvents);
  const worldRaw = mergedUpcomingWorld.map(externalFixtureToMatchItem);
  const followsRaw = buildFollowedMatchItems(mergedEvents, followContext);

  const followedWorldUpcoming = worldRaw.filter((item) =>
    matchItemTouchesFollows(item, followContext, worldIndex),
  );

  const followedProdayUpcoming = prodayRaw.filter((item) =>
    matchItemTouchesFollows(item, followContext, worldIndex),
  );
  const upcomingFollowed = hasFollows
    ? dedupeMatchItems([...followedProdayUpcoming, ...followedWorldUpcoming]).sort(
        (a, b) => a.startsAt.getTime() - b.startsAt.getTime(),
      )
    : [];

  /** Sans clubs suivis : calendrier monde pour ne jamais laisser « Prochains matchs » vide. */
  const upcomingBase =
    upcomingFollowed.length > 0
      ? upcomingFollowed
      : [...worldRaw].sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());

  const broadcastsRaw = dedupeMatchItems([
    ...liveRaw,
    ...recentRaw,
    ...prodayRaw,
    ...worldRaw,
    ...followsRaw,
  ]).filter(isListedBroadcastItem);

  const liveFilters: SupporterMatchFilters = {
    gender: filters.gender,
    source: 'all',
    scope: 'all',
    competition: 'all',
  };

  const sections: SupporterMatchHubSections = {
    upcoming: filterMatchItems(upcomingBase, filters, followContext, follows),
    live: filterMatchItems(liveRaw, liveFilters, followContext, follows),
    recent: filterMatchItems(recentRaw, filters, followContext, follows),
    proday: filterMatchItems(prodayRaw, filters, followContext, follows),
    world: filterMatchItems(worldRaw, filters, followContext, follows),
    follows: filterMatchItems(
      dedupeMatchItems([...followsRaw, ...followedWorldUpcoming]),
      filters,
      followContext,
      follows,
    ),
    broadcasts: filterMatchItems(broadcastsRaw, filters, followContext, follows),
  };

  const filteredTournaments = filterTournaments(tournaments, filters, followContext);

  /** Accueil « À ne pas manquer » = coups d’envoi monde (même sans clubs suivis). */
  const heroKickoffs = sections.world.slice(0, SUPPORTER_HERO_KICKOFF_COUNT);

  return {
    sections,
    tournaments: filteredTournaments,
    liveCount: sections.live.length,
    upcomingCount: sections.upcoming.length,
    heroKickoffs,
    providerState,
  };
}

/** Regroupe les matchs monde par compétition (label API). */
export function groupWorldItemsByCompetition(
  items: SupporterMatchViewItem[],
): UpcomingCompetitionGroup[] {
  const map = new Map<string, SupporterMatchViewItem[]>();
  for (const item of items) {
    const key = competitionKey(item);
    const bucket = map.get(key) ?? [];
    bucket.push(item);
    map.set(key, bucket);
  }
  return Array.from(map.entries()).map(([competition, rows]) => ({
    competition,
    items: rows,
  }));
}

/** Date (Aujourd’hui / Demain / jour) puis compétition. */
export function groupUpcomingByDateThenCompetition(
  items: SupporterMatchViewItem[],
  now: Date = new Date(),
): UpcomingDateGroup[] {
  const sorted = [...items].sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
  const byDate = new Map<string, SupporterMatchViewItem[]>();
  for (const item of sorted) {
    const key = localDateKey(item.startsAt);
    const bucket = byDate.get(key) ?? [];
    bucket.push(item);
    byDate.set(key, bucket);
  }

  return Array.from(byDate.entries()).map(([dateKey, rows]) => {
    const date = parseLocalDateKey(dateKey);
    return {
      dateKey,
      kind: dateKind(date, now),
      date,
      competitions: groupWorldItemsByCompetition(rows),
    };
  });
}
