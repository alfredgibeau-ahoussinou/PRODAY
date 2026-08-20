import {
  createApiFootballProvider,
  hasExternalScoresApiKey,
} from './externalScoresApiFootball.provider';
import {
  createFootballDataProvider,
  hasFootballDataToken,
} from './externalScoresFootballData.provider';
import type {
  ExternalCompetitionId,
  ExternalFixture,
  ExternalScoresProvider,
  ExternalScoresProviderState,
  ExternalTeamHit,
  ListTeamFixturesOptions,
  ListUpcomingFixturesOptions,
} from './externalScores.types';
import type { LiveMatchAction } from '../models/TeamEvent';
import type { ExternalFixtureLineup } from '../utils/supporterMatchDetail';
import {
  mergeTeamSearchHits,
  resolvePopularClubApiIdByName,
  searchCuratedPopularClubs,
} from '../content/supporterPopularClubs';
import {
  buildSupporterDemoFixtures,
  listDemoTeamFixtures,
} from '../content/supporterDemoFixtures';

export type {
  ExternalCompetitionId,
  ExternalFixture,
  ExternalFixtureStatus,
  ExternalScoresProvider,
  ExternalScoresProviderState,
  ExternalScoresSource,
  ExternalTeamHit,
  ListTeamFixturesOptions,
  ListUpcomingFixturesOptions,
} from './externalScores.types';

const MOCK_NOW = new Date('2026-07-01T18:00:00.000Z');

function enrichFixtureTeamIds(
  fixture: Omit<ExternalFixture, 'home_team_id' | 'away_team_id'> & {
    home_team_id?: number;
    away_team_id?: number;
  },
): ExternalFixture {
  return {
    ...fixture,
    home_team_id:
      fixture.home_team_id ?? resolvePopularClubApiIdByName(fixture.home_team),
    away_team_id:
      fixture.away_team_id ?? resolvePopularClubApiIdByName(fixture.away_team),
  };
}

/** Fixtures de démo — uniquement si EXPO_PUBLIC_EXTERNAL_SCORES_MOCK=1 (dev). */
const MOCK_FIXTURES: ExternalFixture[] = [
  enrichFixtureTeamIds({
    id: 'ligue1_psg_om',
    competition: 'ligue1',
    competition_label: 'Ligue 1',
    league_id: 61,
    home_team: 'Paris SG',
    away_team: 'Marseille',
    starts_at: new Date('2026-07-01T19:00:00.000Z'),
    status: 'live',
    score_home: 2,
    score_away: 1,
    minute: 63,
    venue: 'Paris',
  }),
  enrichFixtureTeamIds({
    id: 'pl_arsenal_chelsea',
    competition: 'pl',
    competition_label: 'Premier League',
    league_id: 39,
    home_team: 'Arsenal',
    away_team: 'Chelsea',
    starts_at: new Date('2026-07-01T17:30:00.000Z'),
    status: 'live',
    score_home: 1,
    score_away: 1,
    minute: 52,
    venue: 'London',
  }),
  enrichFixtureTeamIds({
    id: 'laliga_barca_madrid',
    competition: 'laliga',
    competition_label: 'La Liga',
    league_id: 140,
    home_team: 'Barcelone',
    away_team: 'Real Madrid',
    starts_at: new Date('2026-07-01T20:00:00.000Z'),
    status: 'live',
    score_home: 0,
    score_away: 0,
    minute: 12,
    venue: 'Barcelone',
  }),
  enrichFixtureTeamIds({
    id: 'ligue1_losc_lens',
    competition: 'ligue1',
    competition_label: 'Ligue 1',
    league_id: 61,
    home_team: 'Lille',
    away_team: 'Lens',
    starts_at: new Date('2026-07-03T21:00:00.000Z'),
    status: 'scheduled',
    venue: 'Lille',
  }),
  enrichFixtureTeamIds({
    id: 'pl_liverpool_city',
    competition: 'pl',
    competition_label: 'Premier League',
    league_id: 39,
    home_team: 'Liverpool',
    away_team: 'Man City',
    starts_at: new Date('2026-07-05T16:30:00.000Z'),
    status: 'scheduled',
    venue: 'Liverpool',
  }),
  enrichFixtureTeamIds({
    id: 'd1f_ol_psg',
    competition: 'd1f',
    competition_label: 'D1 Arkema',
    league_id: 64,
    home_team: 'Lyon',
    away_team: 'Paris FC',
    starts_at: new Date('2026-07-01T16:30:00.000Z'),
    status: 'finished',
    score_home: 3,
    score_away: 0,
    venue: 'Décines',
    broadcast_listed: true,
    broadcast_label: 'France 2',
  }),
  enrichFixtureTeamIds({
    id: 'd1f_mhsc_hac',
    competition: 'd1f',
    competition_label: 'D1 Arkema',
    league_id: 64,
    home_team: 'Montpellier',
    away_team: 'Le Havre',
    starts_at: new Date('2026-07-02T16:00:00.000Z'),
    status: 'scheduled',
    venue: 'Montpellier',
  }),
  enrichFixtureTeamIds({
    id: 'ucl_final',
    competition: 'ucl',
    competition_label: 'UEFA Champions League',
    league_id: 2,
    home_team: 'Inter',
    away_team: 'Bayern',
    starts_at: new Date('2026-07-06T21:00:00.000Z'),
    status: 'scheduled',
    venue: 'Munich',
  }),
  enrichFixtureTeamIds({
    id: 'ligue1_psg_ol',
    competition: 'ligue1',
    competition_label: 'Ligue 1',
    league_id: 61,
    home_team: 'Paris SG',
    away_team: 'Lyon',
    starts_at: new Date('2026-07-04T19:00:00.000Z'),
    status: 'scheduled',
    venue: 'Paris',
  }),
  enrichFixtureTeamIds({
    id: 'seriea_juv_mil',
    competition: 'seriea',
    competition_label: 'Serie A',
    league_id: 135,
    home_team: 'Juventus',
    away_team: 'Milan',
    starts_at: new Date('2026-07-08T18:45:00.000Z'),
    status: 'scheduled',
    venue: 'Turin',
  }),
  enrichFixtureTeamIds({
    id: 'bundesliga_bay_dor',
    competition: 'bundesliga',
    competition_label: 'Bundesliga',
    league_id: 78,
    home_team: 'Bayern',
    away_team: 'Dortmund',
    starts_at: new Date('2026-07-09T18:30:00.000Z'),
    status: 'scheduled',
    venue: 'Munich',
  }),
  enrichFixtureTeamIds({
    id: 'ligue1_monaco_nice',
    competition: 'ligue1',
    competition_label: 'Ligue 1',
    league_id: 61,
    home_team: 'Monaco',
    away_team: 'Nice',
    starts_at: new Date('2026-07-11T19:00:00.000Z'),
    status: 'scheduled',
    venue: 'Monaco',
  }),
  enrichFixtureTeamIds({
    id: 'uel_roma_lev',
    competition: 'uel',
    competition_label: 'UEFA Europa League',
    league_id: 3,
    home_team: 'Roma',
    away_team: 'Leverkusen',
    starts_at: new Date('2026-07-13T19:00:00.000Z'),
    status: 'scheduled',
    venue: 'Rome',
  }),
  enrichFixtureTeamIds({
    id: 'ligue2_tfc_rcs',
    competition: 'ligue2',
    competition_label: 'Ligue 2',
    league_id: 62,
    home_team: 'Toulouse',
    away_team: 'Strasbourg',
    starts_at: new Date('2026-07-14T18:00:00.000Z'),
    status: 'scheduled',
    venue: 'Toulouse',
  }),
  enrichFixtureTeamIds({
    id: 'ucl_psg_real',
    competition: 'ucl',
    competition_label: 'UEFA Champions League',
    league_id: 2,
    home_team: 'Paris SG',
    away_team: 'Real Madrid',
    starts_at: new Date('2026-07-07T21:00:00.000Z'),
    status: 'scheduled',
    venue: 'Paris',
  }),
  enrichFixtureTeamIds({
    id: 'ligue1_om_psg',
    competition: 'ligue1',
    competition_label: 'Ligue 1',
    league_id: 61,
    home_team: 'Marseille',
    away_team: 'Paris SG',
    starts_at: new Date('2026-07-10T20:45:00.000Z'),
    status: 'scheduled',
    venue: 'Marseille',
  }),
  enrichFixtureTeamIds({
    id: 'laliga_real_barca',
    competition: 'laliga',
    competition_label: 'La Liga',
    league_id: 140,
    home_team: 'Real Madrid',
    away_team: 'Barcelone',
    starts_at: new Date('2026-07-12T21:00:00.000Z'),
    status: 'scheduled',
    venue: 'Madrid',
  }),
  enrichFixtureTeamIds({
    id: 'ucl_barca_bayern',
    competition: 'ucl',
    competition_label: 'UEFA Champions League',
    league_id: 2,
    home_team: 'Barcelone',
    away_team: 'Bayern',
    starts_at: new Date('2026-07-08T21:00:00.000Z'),
    status: 'scheduled',
    venue: 'Barcelone',
  }),
  enrichFixtureTeamIds({
    id: 'ligue1_psg_monaco',
    competition: 'ligue1',
    competition_label: 'Ligue 1',
    league_id: 61,
    home_team: 'Paris SG',
    away_team: 'Monaco',
    starts_at: new Date('2026-07-02T17:00:00.000Z'),
    status: 'scheduled',
    venue: 'Paris',
  }),
  enrichFixtureTeamIds({
    id: 'ligue1_om_nice',
    competition: 'ligue1',
    competition_label: 'Ligue 1',
    league_id: 61,
    home_team: 'Marseille',
    away_team: 'Nice',
    starts_at: new Date('2026-07-05T19:00:00.000Z'),
    status: 'scheduled',
    venue: 'Marseille',
  }),
];

function cloneFixture(fixture: ExternalFixture): ExternalFixture {
  return {
    ...fixture,
    starts_at: new Date(fixture.starts_at),
  };
}

function filterMockTeamFixtures(
  teamId: number,
  options?: ListTeamFixturesOptions,
): ExternalFixture[] {
  const status = options?.status ?? 'scheduled';
  const days = options?.days ?? 14;
  const next = options?.next ?? 15;
  const cutoff = new Date(MOCK_NOW);
  cutoff.setDate(cutoff.getDate() + days);

  return MOCK_FIXTURES.filter((fixture) => {
    const touchesTeam =
      fixture.home_team_id === teamId || fixture.away_team_id === teamId;
    if (!touchesTeam) return false;
    if (fixture.status !== status) return false;
    if (status === 'scheduled' && fixture.starts_at > cutoff) return false;
    return true;
  })
    .slice(0, next)
    .map(cloneFixture)
    .sort((a, b) => a.starts_at.getTime() - b.starts_at.getTime());
}

function uniqueMockTeams(): ExternalTeamHit[] {
  const seen = new Map<string, ExternalTeamHit>();
  for (const fixture of MOCK_FIXTURES) {
    for (const name of [fixture.home_team, fixture.away_team]) {
      const key = name.toLowerCase();
      if (!seen.has(key)) {
        seen.set(key, { id: `wt:name:${key}`, name });
      }
    }
  }
  return Array.from(seen.values());
}

function filterMockByCompetition(
  fixtures: ExternalFixture[],
  competition?: ExternalCompetitionId,
): ExternalFixture[] {
  if (!competition) return fixtures;
  return fixtures.filter((fixture) => fixture.competition === competition);
}

const mockExternalScoresProvider: ExternalScoresProvider = {
  source: 'mock',
  async listFixtures(competition?: ExternalCompetitionId): Promise<ExternalFixture[]> {
    const rows = filterMockByCompetition(MOCK_FIXTURES, competition);
    return rows.map(cloneFixture).sort((a, b) => a.starts_at.getTime() - b.starts_at.getTime());
  },
  async listLiveFixtures(): Promise<ExternalFixture[]> {
    return MOCK_FIXTURES.filter((f) => f.status === 'live')
      .map(cloneFixture)
      .sort((a, b) => a.starts_at.getTime() - b.starts_at.getTime());
  },
  async listUpcomingFixtures(options?: ListUpcomingFixturesOptions): Promise<ExternalFixture[]> {
    const days = options?.days ?? 14;
    const cutoff = new Date(MOCK_NOW);
    cutoff.setDate(cutoff.getDate() + days);
    const leagueSet =
      options?.leagueIds != null ? new Set(options.leagueIds) : null;

    return MOCK_FIXTURES.filter((fixture) => {
      if (fixture.status !== 'scheduled') return false;
      if (fixture.starts_at > cutoff) return false;
      if (leagueSet && fixture.league_id != null && !leagueSet.has(fixture.league_id)) {
        return false;
      }
      return true;
    })
      .map(cloneFixture)
      .sort((a, b) => a.starts_at.getTime() - b.starts_at.getTime());
  },
  async listTeamFixtures(teamId: number, options?: ListTeamFixturesOptions): Promise<ExternalFixture[]> {
    return filterMockTeamFixtures(teamId, options);
  },
  async listRecentFinishedFixtures(): Promise<ExternalFixture[]> {
    return MOCK_FIXTURES.filter((f) => f.status === 'finished')
      .map(cloneFixture)
      .sort((a, b) => b.starts_at.getTime() - a.starts_at.getTime());
  },
  async getFixtureLineups() {
    return { lineups: [] as ExternalFixtureLineup[] };
  },
  async getFixtureEvents() {
    return { events: [] as LiveMatchAction[] };
  },
  async getFixtureStatistics() {
    return { statistics: null };
  },
  async searchTeams(query: string): Promise<ExternalTeamHit[]> {
    const curated = searchCuratedPopularClubs(query, 12);
    const q = query.trim().toLowerCase();
    if (q.length < 2) return curated;
    const mockExtras = uniqueMockTeams().filter((team) =>
      team.name.toLowerCase().includes(q),
    );
    return mergeTeamSearchHits(curated, mockExtras, 12);
  },
  async getState(): Promise<ExternalScoresProviderState> {
    return {
      source: 'mock',
      last_sync_at: new Date(),
      healthy: true,
      message: 'Mode démo développeur',
    };
  },
};

const apiStubProvider: ExternalScoresProvider = {
  source: 'demo',
  async listFixtures(competition?: ExternalCompetitionId): Promise<ExternalFixture[]> {
    const rows = buildSupporterDemoFixtures();
    const filtered = competition
      ? rows.filter((fixture) => fixture.competition === competition)
      : rows;
    return filtered.map(cloneFixture).sort((a, b) => a.starts_at.getTime() - b.starts_at.getTime());
  },
  async listLiveFixtures(): Promise<ExternalFixture[]> {
    return buildSupporterDemoFixtures()
      .filter((f) => f.status === 'live')
      .map(cloneFixture)
      .sort((a, b) => a.starts_at.getTime() - b.starts_at.getTime());
  },
  async listUpcomingFixtures(options?: ListUpcomingFixturesOptions): Promise<ExternalFixture[]> {
    const days = options?.days ?? 14;
    const now = new Date();
    const cutoff = new Date(now);
    cutoff.setDate(cutoff.getDate() + days);
    const leagueSet =
      options?.leagueIds != null ? new Set(options.leagueIds) : null;

    return buildSupporterDemoFixtures(now)
      .filter((fixture) => {
        if (fixture.status !== 'scheduled') return false;
        if (fixture.starts_at.getTime() < now.getTime()) return false;
        if (fixture.starts_at > cutoff) return false;
        if (leagueSet && fixture.league_id != null && !leagueSet.has(fixture.league_id)) {
          return false;
        }
        return true;
      })
      .map(cloneFixture)
      .sort((a, b) => a.starts_at.getTime() - b.starts_at.getTime());
  },
  async listTeamFixtures(teamId: number, options?: ListTeamFixturesOptions): Promise<ExternalFixture[]> {
    return listDemoTeamFixtures(teamId, options);
  },
  async listRecentFinishedFixtures(): Promise<ExternalFixture[]> {
    return buildSupporterDemoFixtures()
      .filter((f) => f.status === 'finished')
      .map(cloneFixture)
      .sort((a, b) => b.starts_at.getTime() - a.starts_at.getTime());
  },
  async getFixtureLineups() {
    return { lineups: [] };
  },
  async getFixtureEvents() {
    return { events: [] };
  },
  async getFixtureStatistics() {
    return { statistics: null };
  },
  async searchTeams(query: string): Promise<ExternalTeamHit[]> {
    return searchCuratedPopularClubs(query, 12);
  },
  async getState(): Promise<ExternalScoresProviderState> {
    return {
      source: 'demo',
      last_sync_at: new Date(),
      healthy: true,
      message:
        'Scores démo — EXPO_PUBLIC_EXTERNAL_SCORES_API_KEY (API-Football) ou EXPO_PUBLIC_FOOTBALL_DATA_TOKEN (gratuit)',
    };
  },
};

function shouldUseMockProvider(): boolean {
  return process.env.EXPO_PUBLIC_EXTERNAL_SCORES_MOCK === '1';
}

let cachedProvider: ExternalScoresProvider | null = null;

/**
 * Ordre :
 * 1. mock forcé (EXPO_PUBLIC_EXTERNAL_SCORES_MOCK=1)
 * 2. API-Football si clé payante / freemium api-sports
 * 3. football-data.org si token gratuit
 * 4. démo riche (jamais de vide Accueil)
 */
export function resolveExternalScoresProvider(): ExternalScoresProvider {
  if (cachedProvider) return cachedProvider;

  if (shouldUseMockProvider()) {
    cachedProvider = mockExternalScoresProvider;
    return cachedProvider;
  }

  if (hasExternalScoresApiKey()) {
    cachedProvider = createApiFootballProvider();
    return cachedProvider;
  }

  if (hasFootballDataToken()) {
    cachedProvider = createFootballDataProvider();
    return cachedProvider;
  }

  cachedProvider = apiStubProvider;
  return cachedProvider;
}

/** Réinitialise le provider résolu (tests). */
export function resetExternalScoresProviderCache(): void {
  cachedProvider = null;
}

async function withProviderFallback<T>(
  fn: (provider: ExternalScoresProvider) => Promise<T>,
  fallback: () => Promise<T>,
): Promise<T> {
  const provider = resolveExternalScoresProvider();
  try {
    return await fn(provider);
  } catch (error) {
    if (shouldUseMockProvider() || provider.source === 'demo') {
      return fallback();
    }
    // eslint-disable-next-line no-console
    console.warn('[externalScores] provider error, fallback démo:', error);
    try {
      return await fallback();
    } catch {
      if (Array.isArray(await Promise.resolve([] as unknown as T))) {
        return [] as T;
      }
      return [] as T;
    }
  }
}

export const externalScoresService = {
  async listFixtures(competition?: ExternalCompetitionId): Promise<ExternalFixture[]> {
    return withProviderFallback(
      async (provider) => {
        const fixtures = await provider.listFixtures(competition);
        return fixtures.sort((a, b) => a.starts_at.getTime() - b.starts_at.getTime());
      },
      () =>
        shouldUseMockProvider()
          ? mockExternalScoresProvider.listFixtures(competition)
          : apiStubProvider.listFixtures(competition),
    );
  },

  async listLiveFixtures(): Promise<ExternalFixture[]> {
    return withProviderFallback(
      (provider) => provider.listLiveFixtures(),
      () => apiStubProvider.listLiveFixtures(),
    );
  },

  async listUpcomingFixtures(options?: ListUpcomingFixturesOptions): Promise<ExternalFixture[]> {
    return withProviderFallback(
      (provider) => provider.listUpcomingFixtures(options),
      () => apiStubProvider.listUpcomingFixtures(options),
    );
  },

  async listTeamFixtures(
    teamId: number,
    options?: ListTeamFixturesOptions,
  ): Promise<ExternalFixture[]> {
    return withProviderFallback(
      async (provider) => {
        if (provider.listTeamFixtures) {
          return provider.listTeamFixtures(teamId, options);
        }
        return apiStubProvider.listTeamFixtures!(teamId, options);
      },
      () => apiStubProvider.listTeamFixtures!(teamId, options),
    );
  },

  async getProviderState(): Promise<ExternalScoresProviderState> {
    return resolveExternalScoresProvider().getState();
  },

  async listRecentFinishedFixtures(): Promise<ExternalFixture[]> {
    return withProviderFallback(
      async (provider) => provider.listRecentFinishedFixtures?.() ?? [],
      () => mockExternalScoresProvider.listRecentFinishedFixtures?.() ?? Promise.resolve([]),
    );
  },

  async getFixtureLineups(fixtureId: string) {
    return withProviderFallback(
      async (provider) => provider.getFixtureLineups?.(fixtureId) ?? { lineups: [] },
      async () => ({ lineups: [] as ExternalFixtureLineup[] }),
    );
  },

  async getFixtureEvents(fixtureId: string) {
    return withProviderFallback(
      async (provider) => provider.getFixtureEvents?.(fixtureId) ?? { events: [] },
      async () => ({ events: [] as LiveMatchAction[] }),
    );
  },

  async getFixtureStatistics(fixtureId: string) {
    return withProviderFallback(
      async (provider) => {
        const res = await provider.getFixtureStatistics?.(fixtureId);
        return res?.statistics ?? null;
      },
      async () => null,
    );
  },

  async searchTeams(query: string): Promise<ExternalTeamHit[]> {
    const curated = searchCuratedPopularClubs(query, 12);
    const remote = await withProviderFallback(
      async (provider) => provider.searchTeams?.(query) ?? [],
      () => mockExternalScoresProvider.searchTeams?.(query) ?? Promise.resolve([]),
    );
    return mergeTeamSearchHits(curated, remote, 12);
  },
};
