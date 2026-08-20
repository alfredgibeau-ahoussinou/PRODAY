import { externalScoresService } from '../externalScores.service';
import type { ExternalFixture } from '../externalScores.types';
import type { ExternalFixtureLineup } from '../../utils/supporterMatchDetail';
import { parseProdayEventId, parseWorldFixtureApiId } from '../../utils/supporterMatchDetail';
import { teamEventsService } from '../teamEvents.service';
import {
  externalFixtureToMatchItem,
  teamEventToMatchItem,
  type SupporterMatchViewItem,
} from '../../utils/supporterMatchFilters';
import { listCompetitionsForCountry } from '../../content/supporterCompetitionsCatalog';
import type {
  FootballCompetitionEntry,
  FootballDataProvider,
  FootballMatchDetail,
  FootballMatchStatistics,
  FootballTeamHit,
} from './types';

const STATS_CACHE_TTL_MS = 5 * 60_000;
const statsCache = new Map<string, { expiresAt: number; data: FootballMatchStatistics | null }>();

async function fetchApiStatistics(fixtureKey: string): Promise<FootballMatchStatistics | null> {
  const cached = statsCache.get(fixtureKey);
  if (cached && cached.expiresAt > Date.now()) return cached.data;

  const apiId = parseWorldFixtureApiId(fixtureKey);
  if (apiId == null) {
    statsCache.set(fixtureKey, { expiresAt: Date.now() + STATS_CACHE_TTL_MS, data: null });
    return null;
  }

  try {
    const stats = await externalScoresService.getFixtureStatistics(`api_${apiId}`);
    statsCache.set(fixtureKey, { expiresAt: Date.now() + STATS_CACHE_TTL_MS, data: stats });
    return stats;
  } catch {
    statsCache.set(fixtureKey, { expiresAt: Date.now() + STATS_CACHE_TTL_MS, data: null });
    return null;
  }
}

function resolveWorldItem(fixture: ExternalFixture): SupporterMatchViewItem {
  return externalFixtureToMatchItem(fixture);
}

export class ExternalFootballDataProvider implements FootballDataProvider {
  readonly name = 'external';

  async listLiveFixtures(): Promise<ExternalFixture[]> {
    return externalScoresService.listLiveFixtures();
  }

  async listUpcomingFixtures(days = 14, leagueIds?: number[]): Promise<ExternalFixture[]> {
    return externalScoresService.listUpcomingFixtures({ days, leagueIds });
  }

  async searchTeams(query: string): Promise<FootballTeamHit[]> {
    const hits = await externalScoresService.searchTeams(query);
    return hits.map((h) => ({
      id: h.id,
      name: h.name,
      apiTeamId: h.apiTeamId,
      country: h.country,
      source: 'world' as const,
    }));
  }

  async getMatchDetail(matchId: string): Promise<FootballMatchDetail | null> {
    const apiId = parseWorldFixtureApiId(matchId);
    if (apiId == null) return null;

    const fixtureKey = `api_${apiId}`;
    const [lineupRes, eventRes, statistics] = await Promise.all([
      externalScoresService.getFixtureLineups(fixtureKey),
      externalScoresService.getFixtureEvents(fixtureKey),
      this.getFixtureStatistics(fixtureKey),
    ]);

    const live = await this.listLiveFixtures();
    const upcoming = await this.listUpcomingFixtures(30);
    const fixture =
      live.find((f) => f.api_fixture_id === apiId || f.id === `api_${apiId}`) ??
      upcoming.find((f) => f.api_fixture_id === apiId || f.id === `api_${apiId}`);

    if (!fixture) return null;

    return {
      item: resolveWorldItem(fixture),
      source: 'world',
      lineups: lineupRes.lineups,
      events: eventRes.events,
      statistics,
      prodayEvent: null,
    };
  }

  async getFixtureStatistics(fixtureId: string): Promise<FootballMatchStatistics | null> {
    return fetchApiStatistics(fixtureId);
  }

  async listCompetitionsByCountry(countryCode?: string): Promise<FootballCompetitionEntry[]> {
    return listCompetitionsForCountry(countryCode);
  }

  async getProviderState() {
    return externalScoresService.getProviderState();
  }
}

export class ProDayFootballDataProvider implements FootballDataProvider {
  readonly name = 'proday';

  constructor(
    private readonly calendarEvents: import('../../models/TeamEvent').TeamEvent[],
    private readonly tournaments: import('../../models/Tournament').Tournament[],
  ) {}

  async listLiveFixtures(): Promise<ExternalFixture[]> {
    return [];
  }

  async listUpcomingFixtures(): Promise<ExternalFixture[]> {
    return [];
  }

  async searchTeams(query: string): Promise<FootballTeamHit[]> {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const seen = new Set<string>();
    const hits: FootballTeamHit[] = [];
    for (const ev of this.calendarEvents) {
      const name = ev.club_name ?? ev.live_state?.opponent_name ?? ev.title ?? '';
      if (!name.toLowerCase().includes(q) || seen.has(name)) continue;
      seen.add(name);
      hits.push({ id: `club:${ev.club_id ?? name}`, name, source: 'proday' });
    }
    return hits.slice(0, 12);
  }

  async getMatchDetail(matchId: string): Promise<FootballMatchDetail | null> {
    const prodayId = parseProdayEventId(matchId);
    if (!prodayId) return null;

    const event = await teamEventsService.getById(prodayId);
    if (!event) return null;

    const lineups: ExternalFixtureLineup[] = event.lineup
      ? [{
          teamName: event.club_name ?? 'ProDay',
          formation: event.lineup.formation ?? '4-4-2',
          lineup: event.lineup,
        }]
      : [];

    return {
      item: teamEventToMatchItem(event),
      source: 'proday',
      lineups,
      events: event.live_actions ?? [],
      statistics: null,
      prodayEvent: event,
    };
  }

  async getFixtureStatistics(): Promise<FootballMatchStatistics | null> {
    return null;
  }

  async listCompetitionsByCountry(): Promise<FootballCompetitionEntry[]> {
    return listCompetitionsForCountry('FR');
  }

  async getProviderState() {
    return {
      source: 'mock' as const,
      last_sync_at: new Date(),
      healthy: true,
      message: 'ProDay amateur',
    };
  }
}

/** Réinitialise le cache stats (tests). */
export function resetFootballStatsCache(): void {
  statsCache.clear();
}
