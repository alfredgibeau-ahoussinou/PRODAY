import type {
  ExternalCompetitionId,
  ExternalFixture,
  ExternalFixtureStatus,
  ExternalScoresProvider,
  ExternalScoresProviderState,
  ExternalTeamHit,
  ListTeamFixturesOptions,
  ListUpcomingFixturesOptions,
} from './externalScores.types';
import { inferBroadcastFromApiPayload } from '../utils/supporterBroadcast';
import {
  mapApiFootballEvent,
  mapApiFootballLineup,
  type ApiFootballEventRow,
  type ApiFootballLineupRow,
} from '../utils/supporterMatchDetail';

const DEFAULT_BASE_URL = 'https://v3.football.api-sports.io';
const LEAGUE_CACHE_TTL_MS = 60_000;
const LIVE_CACHE_TTL_MS = 30_000;
const UPCOMING_CACHE_TTL_MS = 5 * 60_000;
const TEAM_UPCOMING_CACHE_TTL_MS = 5 * 60_000;
const TEAM_LIVE_CACHE_TTL_MS = 30_000;
const TEAM_RECENT_CACHE_TTL_MS = 120_000;

/** Ligue majeures — extensible via env ou proxy Firebase. */
export const LEAGUE_IDS: Record<ExternalCompetitionId, number | null> = {
  ligue1: 61,
  d1f: 64,
  pl: 39,
  laliga: 140,
  seriea: 135,
  bundesliga: 78,
  ucl: 2,
  uel: 3,
  ligue2: 62,
  world_cup: 1,
  other: null,
};

const LEAGUE_ID_TO_COMPETITION = new Map<number, ExternalCompetitionId>(
  (Object.entries(LEAGUE_IDS) as [ExternalCompetitionId, number | null][])
    .filter(([, id]) => id != null)
    .map(([slug, id]) => [id as number, slug]),
);

interface ApiFootballFixtureRow {
  fixture: {
    id: number;
    date: string;
    status: { short: string; elapsed?: number | null };
    venue?: { name?: string | null; city?: string | null };
  };
  league: { id: number; name: string };
  teams: {
    home: { id?: number; name: string };
    away: { id?: number; name: string };
  };
  goals: { home: number | null; away: number | null };
  broadcasts?: Array<{ name?: string | null; channel?: string | null; url?: string | null }>;
  tv?: Array<{ name?: string | null; url?: string | null }>;
}

interface CacheEntry {
  expiresAt: number;
  fixtures: ExternalFixture[];
}

const cache = new Map<string, CacheEntry>();

function readApiKey(): string | undefined {
  const key = process.env.EXPO_PUBLIC_EXTERNAL_SCORES_API_KEY?.trim();
  return key || undefined;
}

function readBaseUrl(): string {
  return process.env.EXPO_PUBLIC_EXTERNAL_SCORES_API_URL?.trim() || DEFAULT_BASE_URL;
}

function mapStatus(short: string): ExternalFixtureStatus {
  if (['1H', '2H', 'HT', 'ET', 'P', 'LIVE', 'BT'].includes(short)) return 'live';
  if (['FT', 'AET', 'PEN'].includes(short)) return 'finished';
  return 'scheduled';
}

function resolveCompetition(leagueId: number): ExternalCompetitionId {
  return LEAGUE_ID_TO_COMPETITION.get(leagueId) ?? 'other';
}

function cloneFixtures(fixtures: ExternalFixture[]): ExternalFixture[] {
  return fixtures.map((fixture) => ({
    ...fixture,
    starts_at: new Date(fixture.starts_at),
  }));
}

function readCached(key: string): ExternalFixture[] | null {
  const cached = cache.get(key);
  if (!cached || cached.expiresAt <= Date.now()) return null;
  return cloneFixtures(cached.fixtures);
}

function writeCache(key: string, fixtures: ExternalFixture[], ttlMs: number): void {
  cache.set(key, {
    expiresAt: Date.now() + ttlMs,
    fixtures: fixtures.map((fixture) => ({
      ...fixture,
      starts_at: new Date(fixture.starts_at),
    })),
  });
}

function formatApiDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function mapApiFootballFixture(row: ApiFootballFixtureRow): ExternalFixture {
  const competition = resolveCompetition(row.league.id);
  const status = mapStatus(row.fixture.status.short);
  const broadcast = inferBroadcastFromApiPayload(row);
  return {
    id: `api_${row.fixture.id}`,
    competition,
    competition_label: row.league.name,
    league_id: row.league.id,
    api_fixture_id: row.fixture.id,
    home_team: row.teams.home.name,
    away_team: row.teams.away.name,
    home_team_id: row.teams.home.id,
    away_team_id: row.teams.away.id,
    starts_at: new Date(row.fixture.date),
    status,
    score_home: row.goals.home ?? undefined,
    score_away: row.goals.away ?? undefined,
    minute: status === 'live' ? row.fixture.status.elapsed ?? undefined : undefined,
    venue: row.fixture.venue?.city ?? row.fixture.venue?.name ?? undefined,
    broadcast_listed: broadcast.listed || undefined,
    broadcast_label: broadcast.label,
    broadcast_url: broadcast.officialUrl,
  };
}

async function fetchApiRows(
  url: string,
  apiKey: string,
  cacheKey: string,
  cacheTtlMs: number,
): Promise<ExternalFixture[]> {
  const cached = readCached(cacheKey);
  if (cached) return cached;

  const response = await fetch(url, {
    headers: { 'x-apisports-key': apiKey },
  });

  if (response.status === 429) {
    const stale = cache.get(cacheKey);
    if (stale) {
      lastHealthy = true;
      lastMessage = 'Quota API — affichage du dernier cache.';
      return cloneFixtures(stale.fixtures);
    }
    throw new Error('Quota API scores monde dépassé. Réessayez dans quelques minutes.');
  }

  if (!response.ok) {
    throw new Error(`API scores monde indisponible (${response.status}).`);
  }

  const payload = (await response.json()) as {
    response?: ApiFootballFixtureRow[];
    errors?: Record<string, string>;
  };

  if (payload.errors && Object.keys(payload.errors).length > 0) {
    const message = Object.values(payload.errors).join(' · ');
    throw new Error(message || 'Erreur API scores monde.');
  }

  const fixtures = (payload.response ?? []).map(mapApiFootballFixture);
  writeCache(cacheKey, fixtures, cacheTtlMs);
  return fixtures;
}

async function fetchLeagueFixtures(
  competition: ExternalCompetitionId,
  apiKey: string,
): Promise<ExternalFixture[]> {
  const leagueId = LEAGUE_IDS[competition];
  if (leagueId == null) return [];

  const cacheKey = `league:${competition}`;
  const season = new Date().getFullYear();
  const url = `${readBaseUrl()}/fixtures?league=${leagueId}&season=${season}&timezone=Europe/Paris`;
  return fetchApiRows(url, apiKey, cacheKey, LEAGUE_CACHE_TTL_MS);
}

async function fetchLiveAll(apiKey: string): Promise<ExternalFixture[]> {
  const cacheKey = 'live:all';
  const url = `${readBaseUrl()}/fixtures?live=all`;
  return fetchApiRows(url, apiKey, cacheKey, LIVE_CACHE_TTL_MS);
}

async function fetchUpcomingByLeagues(
  apiKey: string,
  options?: ListUpcomingFixturesOptions,
): Promise<ExternalFixture[]> {
  const days = options?.days ?? 14;
  const leagueIds =
    options?.leagueIds ??
    (Object.values(LEAGUE_IDS).filter((id): id is number => id != null) as number[]);

  const from = new Date();
  const to = new Date(from);
  to.setDate(from.getDate() + days);
  const fromStr = formatApiDate(from);
  const toStr = formatApiDate(to);
  const season = from.getFullYear();

  const batches = await Promise.all(
    leagueIds.map(async (leagueId) => {
      const cacheKey = `upcoming:${leagueId}:${fromStr}:${toStr}`;
      const url = `${readBaseUrl()}/fixtures?league=${leagueId}&season=${season}&from=${fromStr}&to=${toStr}&timezone=Europe/Paris`;
      try {
        return await fetchApiRows(url, apiKey, cacheKey, UPCOMING_CACHE_TTL_MS);
      } catch {
        const stale = readCached(cacheKey);
        return stale ?? [];
      }
    }),
  );

  const now = Date.now();
  return batches
    .flat()
    .filter((fixture) => fixture.status === 'scheduled' && fixture.starts_at.getTime() >= now)
    .sort((a, b) => a.starts_at.getTime() - b.starts_at.getTime());
}

async function fetchTeamFixtures(
  teamId: number,
  apiKey: string,
  options?: ListTeamFixturesOptions,
): Promise<ExternalFixture[]> {
  const status = options?.status ?? 'scheduled';

  if (status === 'live') {
    const cacheKey = `team:${teamId}:live`;
    const url = `${readBaseUrl()}/fixtures?team=${teamId}&live=all`;
    const fixtures = await fetchApiRows(url, apiKey, cacheKey, TEAM_LIVE_CACHE_TTL_MS);
    return fixtures.filter((fixture) => fixture.status === 'live');
  }

  if (status === 'finished') {
    const last = options?.next ?? 5;
    const cacheKey = `team:${teamId}:last:${last}`;
    const url = `${readBaseUrl()}/fixtures?team=${teamId}&last=${last}&status=FT`;
    const fixtures = await fetchApiRows(url, apiKey, cacheKey, TEAM_RECENT_CACHE_TTL_MS);
    return fixtures.filter((fixture) => fixture.status === 'finished');
  }

  const next = options?.next ?? 15;
  const cacheKey = `team:${teamId}:next:${next}`;
  const url = `${readBaseUrl()}/fixtures?team=${teamId}&next=${next}&timezone=Europe/Paris`;
  let fixtures = await fetchApiRows(url, apiKey, cacheKey, TEAM_UPCOMING_CACHE_TTL_MS);

  const days = options?.days;
  if (days != null) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() + days);
    fixtures = fixtures.filter(
      (fixture) =>
        fixture.status === 'scheduled' &&
        fixture.starts_at.getTime() >= Date.now() &&
        fixture.starts_at <= cutoff,
    );
  } else {
    fixtures = fixtures.filter(
      (fixture) => fixture.status === 'scheduled' && fixture.starts_at.getTime() >= Date.now(),
    );
  }

  return fixtures.sort((a, b) => a.starts_at.getTime() - b.starts_at.getTime());
}

let lastSyncAt: Date | null = null;
let lastHealthy = false;
let lastMessage: string | undefined;

const LINEUPS_CACHE_TTL_MS = 120_000;
const EVENTS_CACHE_TTL_MS = 30_000;
const STATS_CACHE_TTL_MS = 5 * 60_000;
const TEAMS_CACHE_TTL_MS = 5 * 60_000;
const RECENT_CACHE_TTL_MS = 120_000;

const jsonCache = new Map<string, { expiresAt: number; value: unknown }>();

function readJsonCache<T>(key: string): T | null {
  const cached = jsonCache.get(key);
  if (!cached || cached.expiresAt <= Date.now()) return null;
  return cached.value as T;
}

function writeJsonCache<T>(key: string, value: T, ttlMs: number): void {
  jsonCache.set(key, { expiresAt: Date.now() + ttlMs, value });
}

function parseNumericFixtureId(fixtureId: string): number | null {
  const raw = fixtureId.startsWith('api_') ? fixtureId.slice(4) : fixtureId;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

async function fetchJson<T>(url: string, apiKey: string): Promise<T> {
  const response = await fetch(url, {
    headers: { 'x-apisports-key': apiKey },
  });
  if (!response.ok) {
    throw new Error(`API scores monde indisponible (${response.status}).`);
  }
  return (await response.json()) as T;
}

export function createApiFootballProvider(): ExternalScoresProvider {
  return {
    source: 'api_football',
    async listFixtures(competition?: ExternalCompetitionId): Promise<ExternalFixture[]> {
      const apiKey = readApiKey();
      if (!apiKey) {
        lastHealthy = false;
        lastMessage = 'Clé API scores monde absente.';
        return [];
      }

      try {
        const competitions: ExternalCompetitionId[] = competition
          ? [competition]
          : (Object.keys(LEAGUE_IDS).filter(
              (id) => LEAGUE_IDS[id as ExternalCompetitionId] != null,
            ) as ExternalCompetitionId[]);
        const batches = await Promise.all(
          competitions.map((id) => fetchLeagueFixtures(id, apiKey)),
        );
        lastSyncAt = new Date();
        lastHealthy = true;
        lastMessage = undefined;
        return batches
          .flat()
          .sort((a, b) => a.starts_at.getTime() - b.starts_at.getTime());
      } catch (error) {
        lastSyncAt = new Date();
        lastHealthy = false;
        lastMessage = error instanceof Error ? error.message : 'Erreur API scores monde.';
        throw error;
      }
    },
    async listLiveFixtures(): Promise<ExternalFixture[]> {
      const apiKey = readApiKey();
      if (!apiKey) {
        lastHealthy = false;
        lastMessage = 'Clé API scores monde absente.';
        return [];
      }

      try {
        const fixtures = await fetchLiveAll(apiKey);
        lastSyncAt = new Date();
        lastHealthy = true;
        lastMessage = undefined;
        return fixtures.sort((a, b) => a.starts_at.getTime() - b.starts_at.getTime());
      } catch (error) {
        lastSyncAt = new Date();
        lastHealthy = false;
        lastMessage = error instanceof Error ? error.message : 'Erreur API scores monde.';
        const stale = readCached('live:all');
        if (stale) return stale;
        throw error;
      }
    },
    async listUpcomingFixtures(options?: ListUpcomingFixturesOptions): Promise<ExternalFixture[]> {
      const apiKey = readApiKey();
      if (!apiKey) {
        lastHealthy = false;
        lastMessage = 'Clé API scores monde absente.';
        return [];
      }

      try {
        const fixtures = await fetchUpcomingByLeagues(apiKey, options);
        lastSyncAt = new Date();
        lastHealthy = true;
        lastMessage = undefined;
        return fixtures;
      } catch (error) {
        lastSyncAt = new Date();
        lastHealthy = false;
        lastMessage = error instanceof Error ? error.message : 'Erreur API scores monde.';
        throw error;
      }
    },
    async listTeamFixtures(
      teamId: number,
      options?: ListTeamFixturesOptions,
    ): Promise<ExternalFixture[]> {
      const apiKey = readApiKey();
      if (!apiKey) {
        lastHealthy = false;
        lastMessage = 'Clé API scores monde absente.';
        return [];
      }

      try {
        const fixtures = await fetchTeamFixtures(teamId, apiKey, options);
        lastSyncAt = new Date();
        lastHealthy = true;
        lastMessage = undefined;
        return fixtures;
      } catch (error) {
        lastSyncAt = new Date();
        lastHealthy = false;
        lastMessage = error instanceof Error ? error.message : 'Erreur API scores monde.';
        const status = options?.status ?? 'scheduled';
        const cacheKey =
          status === 'live'
            ? `team:${teamId}:live`
            : status === 'finished'
              ? `team:${teamId}:last:${options?.next ?? 5}`
              : `team:${teamId}:next:${options?.next ?? 15}`;
        const stale = readCached(cacheKey);
        if (stale) return stale;
        throw error;
      }
    },
    async listRecentFinishedFixtures(): Promise<ExternalFixture[]> {
      const apiKey = readApiKey();
      if (!apiKey) return [];
      const cacheKey = 'recent:finished';
      const cached = readCached(cacheKey);
      if (cached) return cached.filter((fixture) => fixture.status === 'finished');
      try {
        const url = `${readBaseUrl()}/fixtures?last=24&status=FT`;
        const fixtures = await fetchApiRows(url, apiKey, cacheKey, RECENT_CACHE_TTL_MS);
        return fixtures.filter((fixture) => fixture.status === 'finished');
      } catch {
        return [];
      }
    },
    async getFixtureLineups(fixtureId: string) {
      const apiKey = readApiKey();
      const numericId = parseNumericFixtureId(fixtureId);
      if (!apiKey || numericId == null) return { lineups: [] };
      const cacheKey = `lineups:${numericId}`;
      const cached = readJsonCache<{ lineups: NonNullable<ReturnType<typeof mapApiFootballLineup>>[] }>(
        cacheKey,
      );
      if (cached) return { lineups: cached.lineups };
      try {
        const payload = await fetchJson<{ response?: ApiFootballLineupRow[] }>(
          `${readBaseUrl()}/fixtures/lineups?fixture=${numericId}`,
          apiKey,
        );
        const lineups = (payload.response ?? [])
          .map(mapApiFootballLineup)
          .filter((row): row is NonNullable<typeof row> => Boolean(row));
        writeJsonCache(cacheKey, { lineups }, LINEUPS_CACHE_TTL_MS);
        return { lineups };
      } catch {
        return { lineups: [] };
      }
    },
    async getFixtureEvents(fixtureId: string) {
      const apiKey = readApiKey();
      const numericId = parseNumericFixtureId(fixtureId);
      if (!apiKey || numericId == null) return { events: [] };
      const cacheKey = `events:${numericId}`;
      const cached = readJsonCache<{ events: NonNullable<ReturnType<typeof mapApiFootballEvent>>[] }>(
        cacheKey,
      );
      if (cached) return { events: cached.events };
      try {
        const payload = await fetchJson<{ response?: ApiFootballEventRow[] }>(
          `${readBaseUrl()}/fixtures/events?fixture=${numericId}`,
          apiKey,
        );
        const events = (payload.response ?? [])
          .map((row, index) => mapApiFootballEvent(row, index))
          .filter((row): row is NonNullable<typeof row> => Boolean(row));
        writeJsonCache(cacheKey, { events }, EVENTS_CACHE_TTL_MS);
        return { events };
      } catch {
        return { events: [] };
      }
    },
    async getFixtureStatistics(fixtureId: string) {
      const apiKey = readApiKey();
      const numericId = parseNumericFixtureId(fixtureId);
      if (!apiKey || numericId == null) return { statistics: null };
      const cacheKey = `stats:${numericId}`;
      const cached = readJsonCache<{ statistics: Record<string, Record<string, string | number>> | null }>(
        cacheKey,
      );
      if (cached) return { statistics: cached.statistics as import('./footballData/types').FootballMatchStatistics | null };
      try {
        const payload = await fetchJson<{
          response?: Array<{
            team?: { name?: string };
            statistics?: Array<{ type?: string; value?: string | number | null }>;
          }>;
        }>(`${readBaseUrl()}/fixtures/statistics?fixture=${numericId}`, apiKey);
        const rows = payload.response ?? [];
        if (rows.length < 2) {
          writeJsonCache(cacheKey, { statistics: null }, STATS_CACHE_TTL_MS);
          return { statistics: null };
        }
        const mapRow = (row: (typeof rows)[0]) => {
          const stats: Record<string, string | number> = {};
          for (const entry of row.statistics ?? []) {
            if (entry.type && entry.value != null) stats[entry.type] = entry.value;
          }
          return stats;
        };
        const statistics = { home: mapRow(rows[0]), away: mapRow(rows[1]) };
        writeJsonCache(cacheKey, { statistics }, STATS_CACHE_TTL_MS);
        return { statistics };
      } catch {
        return { statistics: null };
      }
    },
    async searchTeams(query: string): Promise<ExternalTeamHit[]> {
      const apiKey = readApiKey();
      const q = query.trim();
      if (!apiKey || q.length < 2) return [];
      const cacheKey = `teams:${q.toLowerCase()}`;
      const cached = readJsonCache<ExternalTeamHit[]>(cacheKey);
      if (cached) return cached;
      try {
        const payload = await fetchJson<{
          response?: Array<{ team?: { id?: number; name?: string; country?: string } }>;
        }>(`${readBaseUrl()}/teams?search=${encodeURIComponent(q)}`, apiKey);
        const hits = (payload.response ?? []).flatMap((row): ExternalTeamHit[] => {
          const name = row.team?.name?.trim();
          if (!name) return [];
          return [
            {
              id:
                row.team?.id != null
                  ? `wt:id:${row.team.id}`
                  : `wt:name:${name.toLowerCase()}`,
              apiTeamId: row.team?.id,
              name,
              country: row.team?.country,
            },
          ];
        });
        const sliced = hits.slice(0, 12);
        writeJsonCache(cacheKey, sliced, TEAMS_CACHE_TTL_MS);
        return sliced;
      } catch {
        return [];
      }
    },
    async getState(): Promise<ExternalScoresProviderState> {
      return {
        source: 'api_football',
        last_sync_at: lastSyncAt ?? new Date(),
        healthy: lastHealthy,
        message: lastMessage,
      };
    },
  };
}

/** Vide le cache (tests). */
export function resetApiFootballCache(): void {
  cache.clear();
  jsonCache.clear();
  lastSyncAt = null;
  lastHealthy = false;
  lastMessage = undefined;
}

export function hasExternalScoresApiKey(): boolean {
  return Boolean(readApiKey());
}
