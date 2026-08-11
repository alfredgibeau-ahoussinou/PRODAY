import type {
  ExternalCompetitionId,
  ExternalFixture,
  ExternalFixtureStatus,
  ExternalScoresProvider,
  ExternalScoresProviderState,
} from './externalScores.types';

const DEFAULT_BASE_URL = 'https://v3.football.api-sports.io';
const CACHE_TTL_MS = 60_000;

const LEAGUE_IDS: Record<ExternalCompetitionId, number> = {
  ligue1: 61,
  d1f: 64,
};

const LEAGUE_LABELS: Record<ExternalCompetitionId, string> = {
  ligue1: 'Ligue 1',
  d1f: 'D1 Arkema',
};

interface ApiFootballFixtureRow {
  fixture: {
    id: number;
    date: string;
    status: { short: string; elapsed?: number | null };
    venue?: { name?: string | null; city?: string | null };
  };
  league: { id: number; name: string };
  teams: {
    home: { name: string };
    away: { name: string };
  };
  goals: { home: number | null; away: number | null };
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

export function mapApiFootballFixture(
  row: ApiFootballFixtureRow,
  competition: ExternalCompetitionId,
): ExternalFixture {
  const status = mapStatus(row.fixture.status.short);
  return {
    id: `api_${row.fixture.id}`,
    competition,
    competition_label: LEAGUE_LABELS[competition],
    home_team: row.teams.home.name,
    away_team: row.teams.away.name,
    starts_at: new Date(row.fixture.date),
    status,
    score_home: row.goals.home ?? undefined,
    score_away: row.goals.away ?? undefined,
    minute: status === 'live' ? row.fixture.status.elapsed ?? undefined : undefined,
    venue: row.fixture.venue?.city ?? row.fixture.venue?.name ?? undefined,
  };
}

async function fetchLeagueFixtures(
  competition: ExternalCompetitionId,
  apiKey: string,
): Promise<ExternalFixture[]> {
  const cacheKey = competition;
  const cached = cache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.fixtures.map((fixture) => ({
      ...fixture,
      starts_at: new Date(fixture.starts_at),
    }));
  }

  const season = new Date().getFullYear();
  const url = `${readBaseUrl()}/fixtures?league=${LEAGUE_IDS[competition]}&season=${season}&timezone=Europe/Paris`;

  const response = await fetch(url, {
    headers: {
      'x-apisports-key': apiKey,
    },
  });

  if (response.status === 429) {
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

  const fixtures = (payload.response ?? []).map((row) => mapApiFootballFixture(row, competition));
  cache.set(cacheKey, {
    expiresAt: Date.now() + CACHE_TTL_MS,
    fixtures,
  });
  return fixtures;
}

let lastSyncAt: Date | null = null;
let lastHealthy = false;
let lastMessage: string | undefined;

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
          : (Object.keys(LEAGUE_IDS) as ExternalCompetitionId[]);
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
  lastSyncAt = null;
  lastHealthy = false;
  lastMessage = undefined;
}

export function hasExternalScoresApiKey(): boolean {
  return Boolean(readApiKey());
}
