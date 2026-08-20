import type { Follow } from '../models/Follow';
import type { TeamEvent } from '../models/TeamEvent';
import type { Tournament } from '../models/Tournament';
import { externalScoresService } from './externalScores.service';
import type { ExternalScoresProviderState } from './externalScores.types';
import { teamEventsService } from './teamEvents.service';
import {
  buildFollowContext,
  externalFixtureToMatchItem,
  filterMatchItems,
  filterTournaments,
  formatKickoffClock,
  inferGenderFromCategories,
  teamEventToMatchItem,
  type SupporterMatchViewItem,
} from '../utils/supporterMatchFilters';
import { isProdayEventLiveNow } from '../utils/supporterLiveMatches';
import type { SupporterMatchFilters } from './supporterPreferences.service';

export type SupporterMatchHubSection = 'upcoming' | 'live' | 'proday' | 'world' | 'follows';

export const DEFAULT_SUPPORTER_MATCHS_CHAPTER: SupporterMatchHubSection = 'upcoming';

/** Fenêtre monde pour le chapitre À venir. */
export const SUPPORTER_UPCOMING_WORLD_DAYS = 14;

export const SUPPORTER_HERO_KICKOFF_COUNT = 3;

export interface SupporterMatchHubSections {
  upcoming: SupporterMatchViewItem[];
  live: SupporterMatchViewItem[];
  proday: SupporterMatchViewItem[];
  world: SupporterMatchViewItem[];
  follows: SupporterMatchViewItem[];
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

function tournamentToMatchItem(tournament: Tournament): SupporterMatchViewItem {
  return {
    id: `tournament-${tournament.id}`,
    source: 'proday',
    status: 'upcoming',
    genderScope: inferGenderFromCategories(tournament.categories),
    homeLabel: tournament.title,
    awayLabel: tournament.city,
    startsAt: tournament.starts_at,
    tournamentId: tournament.id,
    followTarget: {
      type: 'tournament',
      id: tournament.id,
      label: tournament.title,
    },
    competitionLabel: 'ProDay',
    meta: tournament.categories.join(' · ') || undefined,
    timeLabel: formatKickoffClock(tournament.starts_at),
  };
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

  const [liveWorld, upcomingWorld, upcomingProday, providerState] = await Promise.all([
    externalScoresService.listLiveFixtures().catch(() => []),
    externalScoresService
      .listUpcomingFixtures({ days: SUPPORTER_UPCOMING_WORLD_DAYS })
      .catch(() => []),
    teamEventsService.listUpcoming(60).catch(() => [] as TeamEvent[]),
    externalScoresService.getProviderState(),
  ]);

  const mergedEvents = dedupeEvents([...upcomingProday, ...calendarEvents]);

  const worldLive = liveWorld
    .filter((fixture) => fixture.status === 'live')
    .map(externalFixtureToMatchItem);
  const prodayLive = mergedEvents
    .filter(isProdayEventLiveNow)
    .map(teamEventToMatchItem)
    .filter((item) => item.status === 'live');

  const liveRaw: SupporterMatchViewItem[] = [...worldLive, ...prodayLive];
  const prodayRaw = buildProdayUpcomingItems(mergedEvents);
  const worldRaw = upcomingWorld.map(externalFixtureToMatchItem);
  const followsRaw = buildFollowedMatchItems(mergedEvents, followContext);
  const tournamentItems = tournaments
    .filter((tournament) => tournament.starts_at.getTime() >= Date.now())
    .map(tournamentToMatchItem);

  const upcomingRaw = dedupeMatchItems([...prodayRaw, ...worldRaw, ...tournamentItems]).sort(
    (a, b) => a.startsAt.getTime() - b.startsAt.getTime(),
  );

  const sections: SupporterMatchHubSections = {
    upcoming: filterMatchItems(upcomingRaw, filters, followContext),
    live: filterMatchItems(liveRaw, filters, followContext),
    proday: filterMatchItems(prodayRaw, filters, followContext),
    world: filterMatchItems(worldRaw, filters, followContext),
    follows: filterMatchItems(followsRaw, filters, followContext),
  };

  const filteredTournaments = filterTournaments(tournaments, filters, followContext);

  return {
    sections,
    tournaments: filteredTournaments,
    liveCount: sections.live.length,
    upcomingCount: sections.upcoming.length,
    heroKickoffs: sections.upcoming.slice(0, SUPPORTER_HERO_KICKOFF_COUNT),
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
