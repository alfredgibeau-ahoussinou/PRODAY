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
  teamEventToMatchItem,
  type SupporterMatchViewItem,
} from '../utils/supporterMatchFilters';
import { isProdayEventLiveNow } from '../utils/supporterLiveMatches';
import type { SupporterMatchFilters } from './supporterPreferences.service';

export type SupporterMatchHubSection = 'live' | 'proday' | 'world' | 'follows';

export interface SupporterMatchHubSections {
  live: SupporterMatchViewItem[];
  proday: SupporterMatchViewItem[];
  world: SupporterMatchViewItem[];
  follows: SupporterMatchViewItem[];
}

export interface SupporterMatchHubResult {
  sections: SupporterMatchHubSections;
  tournaments: Tournament[];
  liveCount: number;
  providerState: ExternalScoresProviderState;
}

export interface FetchSupporterMatchHubParams {
  calendarEvents: TeamEvent[];
  tournaments: Tournament[];
  follows: Follow[];
  filters: SupporterMatchFilters;
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

/** Agrège live monde + PRODAY, calendrier à venir et état provider. */
export async function fetchSupporterMatchHub(
  params: FetchSupporterMatchHubParams,
): Promise<SupporterMatchHubResult> {
  const { calendarEvents, tournaments, follows, filters } = params;
  const followContext = buildFollowContext(follows);

  const [liveWorld, upcomingWorld, upcomingProday, providerState] = await Promise.all([
    externalScoresService.listLiveFixtures().catch(() => []),
    externalScoresService.listUpcomingFixtures({ days: 7 }).catch(() => []),
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

  const sections: SupporterMatchHubSections = {
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
    providerState,
  };
}

/** Regroupe les matchs monde par compétition (label API). */
export function groupWorldItemsByCompetition(
  items: SupporterMatchViewItem[],
): { competition: string; items: SupporterMatchViewItem[] }[] {
  const map = new Map<string, SupporterMatchViewItem[]>();
  for (const item of items) {
    const key = item.competitionLabel ?? item.meta?.split(' · ')[0] ?? 'Compétition';
    const bucket = map.get(key) ?? [];
    bucket.push(item);
    map.set(key, bucket);
  }
  return Array.from(map.entries()).map(([competition, rows]) => ({
    competition,
    items: rows,
  }));
}
