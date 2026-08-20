import { externalScoresService } from '../externalScores.service';
import type { ExternalFixture } from '../externalScores.types';
import type { ExternalFixtureLineup } from '../../utils/supporterMatchDetail';
import {
  extractWorldFixtureKey,
  parseProdayEventId,
  parseWorldFixtureRef,
} from '../../utils/supporterMatchDetail';
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

/**
 * Normalise un id fixture vers la clé provider (`api_123` / `fd_456`)
 * ou l’id Match Center (`world-fixture-api_123`).
 */
export function normalizeWorldFixtureKey(fixtureId: string): string {
  const trimmed = fixtureId.trim();
  const ref = parseWorldFixtureRef(trimmed);
  if (ref) return ref.fixtureKey;
  return extractWorldFixtureKey(trimmed);
}

export function toWorldMatchCenterId(fixtureId: string): string {
  const key = normalizeWorldFixtureKey(fixtureId);
  if (key.startsWith('world-fixture-') || key.startsWith('proday-event-')) return key;
  return `world-fixture-${key}`;
}

async function fetchApiStatistics(fixtureKey: string): Promise<FootballMatchStatistics | null> {
  const cached = statsCache.get(fixtureKey);
  if (cached && cached.expiresAt > Date.now()) return cached.data;

  try {
    const stats = await externalScoresService.getFixtureStatistics(fixtureKey);
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

function mergeSeedIntoItem(
  item: SupporterMatchViewItem,
  seed?: SupporterMatchViewItem | null,
): SupporterMatchViewItem {
  if (!seed) return item;
  return {
    ...seed,
    ...item,
    scoreHome: item.scoreHome ?? seed.scoreHome,
    scoreAway: item.scoreAway ?? seed.scoreAway,
    minute: item.minute ?? seed.minute,
    competitionLabel: item.competitionLabel ?? seed.competitionLabel,
    meta: item.meta ?? seed.meta,
    startsAt: item.startsAt ?? seed.startsAt,
  };
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

  async getMatchDetail(
    matchId: string,
    seedItem?: SupporterMatchViewItem | null,
  ): Promise<FootballMatchDetail | null> {
    const fixtureKey = normalizeWorldFixtureKey(matchId);
    const ref = parseWorldFixtureRef(matchId) ?? parseWorldFixtureRef(fixtureKey);
    const numericId = ref?.numericId;

    const [byId, lineupRes, eventRes, statistics] = await Promise.all([
      externalScoresService.getFixtureById(fixtureKey),
      externalScoresService.getFixtureLineups(fixtureKey),
      externalScoresService.getFixtureEvents(fixtureKey),
      this.getFixtureStatistics(fixtureKey),
    ]);

    let fixture = byId;
    if (!fixture) {
      const [live, upcoming, recent] = await Promise.all([
        this.listLiveFixtures().catch(() => [] as ExternalFixture[]),
        this.listUpcomingFixtures(30).catch(() => [] as ExternalFixture[]),
        externalScoresService.listRecentFinishedFixtures().catch(() => [] as ExternalFixture[]),
      ]);
      const matchFixture = (f: ExternalFixture) =>
        f.id === fixtureKey ||
        (numericId != null && f.api_fixture_id === numericId) ||
        (seedItem?.worldFixtureId != null && f.id === seedItem.worldFixtureId);
      fixture =
        live.find(matchFixture) ??
        upcoming.find(matchFixture) ??
        recent.find(matchFixture) ??
        null;
    }

    if (!fixture && !seedItem) return null;

    const item = fixture
      ? mergeSeedIntoItem(resolveWorldItem(fixture), seedItem)
      : seedItem!;

    return {
      item,
      source: 'world',
      lineups: lineupRes.lineups,
      events: eventRes.events,
      statistics,
      prodayEvent: null,
    };
  }

  async getFixtureStatistics(fixtureId: string): Promise<FootballMatchStatistics | null> {
    return fetchApiStatistics(normalizeWorldFixtureKey(fixtureId));
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

/**
 * Fusion ProDay (priorité détail) → external (API-Football / football-data).
 * Les écrans Football Hub passent uniquement par cette couche / la facade.
 */
export class MergedFootballProvider implements FootballDataProvider {
  readonly name = 'merged';

  constructor(
    private readonly proday: ProDayFootballDataProvider,
    private readonly external: ExternalFootballDataProvider = new ExternalFootballDataProvider(),
  ) {}

  async listLiveFixtures(): Promise<ExternalFixture[]> {
    return this.external.listLiveFixtures();
  }

  async listUpcomingFixtures(days = 14, leagueIds?: number[]): Promise<ExternalFixture[]> {
    return this.external.listUpcomingFixtures(days, leagueIds);
  }

  async getFixtures(opts?: { live?: boolean; days?: number; leagueIds?: number[] }) {
    if (opts?.live) return this.listLiveFixtures();
    return this.listUpcomingFixtures(opts?.days ?? 14, opts?.leagueIds);
  }

  async getFixture(fixtureId: string): Promise<ExternalFixture | null> {
    return externalScoresService.getFixtureById(normalizeWorldFixtureKey(fixtureId));
  }

  async searchTeams(query: string): Promise<FootballTeamHit[]> {
    const [world, proday] = await Promise.all([
      this.external.searchTeams(query),
      this.proday.searchTeams(query),
    ]);
    const seen = new Set<string>();
    return [...proday, ...world].filter((h) => {
      const key = h.name.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  async getTeams(query: string) {
    return this.searchTeams(query);
  }

  async getTeam(teamId: string): Promise<FootballTeamHit | null> {
    const hits = await this.searchTeams(teamId);
    return hits.find((h) => h.id === teamId || h.name.toLowerCase() === teamId.toLowerCase()) ?? null;
  }

  async getCompetitions(countryCode?: string) {
    return this.listCompetitionsByCountry(countryCode);
  }

  async getStandings() {
    return null;
  }

  async getLineups(fixtureId: string) {
    const prodayId = parseProdayEventId(fixtureId);
    if (prodayId) {
      const detail = await this.proday.getMatchDetail(`proday-event-${prodayId}`);
      return detail?.lineups ?? [];
    }
    const res = await externalScoresService.getFixtureLineups(normalizeWorldFixtureKey(fixtureId));
    return res.lineups;
  }

  async getEvents(fixtureId: string) {
    const prodayId = parseProdayEventId(fixtureId);
    if (prodayId) {
      const detail = await this.proday.getMatchDetail(`proday-event-${prodayId}`);
      return detail?.events ?? [];
    }
    const res = await externalScoresService.getFixtureEvents(normalizeWorldFixtureKey(fixtureId));
    return res.events;
  }

  async getStatistics(fixtureId: string) {
    return this.getFixtureStatistics(normalizeWorldFixtureKey(fixtureId));
  }

  async getPlayers() {
    return [];
  }

  async getMatchDetail(
    matchId: string,
    seedItem?: SupporterMatchViewItem | null,
  ): Promise<FootballMatchDetail | null> {
    return (
      (await this.proday.getMatchDetail(matchId)) ??
      (await this.external.getMatchDetail(matchId, seedItem))
    );
  }

  async getFixtureStatistics(fixtureId: string) {
    return this.external.getFixtureStatistics(fixtureId);
  }

  async listCompetitionsByCountry(countryCode?: string) {
    return this.external.listCompetitionsByCountry(countryCode);
  }

  async getProviderState() {
    return this.external.getProviderState();
  }
}

/** Réinitialise le cache stats (tests). */
export function resetFootballStatsCache(): void {
  statsCache.clear();
}
