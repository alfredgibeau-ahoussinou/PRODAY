import {
  createApiFootballProvider,
  hasExternalScoresApiKey,
} from './externalScoresApiFootball.provider';
import type {
  ExternalCompetitionId,
  ExternalFixture,
  ExternalScoresProvider,
  ExternalScoresProviderState,
} from './externalScores.types';

export type {
  ExternalCompetitionId,
  ExternalFixture,
  ExternalFixtureStatus,
  ExternalScoresProvider,
  ExternalScoresProviderState,
  ExternalScoresSource,
} from './externalScores.types';

/** Fixtures de démo — uniquement si EXPO_PUBLIC_EXTERNAL_SCORES_MOCK=1 (dev). */
const MOCK_FIXTURES: ExternalFixture[] = [
  {
    id: 'ligue1_psg_om',
    competition: 'ligue1',
    competition_label: 'Ligue 1',
    home_team: 'Paris SG',
    away_team: 'Marseille',
    starts_at: new Date('2026-07-01T19:00:00.000Z'),
    status: 'live',
    score_home: 2,
    score_away: 1,
    minute: 63,
    venue: 'Paris',
  },
  {
    id: 'ligue1_losc_lens',
    competition: 'ligue1',
    competition_label: 'Ligue 1',
    home_team: 'Lille',
    away_team: 'Lens',
    starts_at: new Date('2026-07-01T21:00:00.000Z'),
    status: 'scheduled',
    venue: 'Lille',
  },
  {
    id: 'd1f_ol_psg',
    competition: 'd1f',
    competition_label: 'D1 Arkema',
    home_team: 'Lyon',
    away_team: 'Paris FC',
    starts_at: new Date('2026-07-01T16:30:00.000Z'),
    status: 'finished',
    score_home: 3,
    score_away: 0,
    venue: 'Décines',
  },
  {
    id: 'd1f_mhsc_hac',
    competition: 'd1f',
    competition_label: 'D1 Arkema',
    home_team: 'Montpellier',
    away_team: 'Le Havre',
    starts_at: new Date('2026-07-02T16:00:00.000Z'),
    status: 'scheduled',
    venue: 'Montpellier',
  },
];

function cloneFixture(fixture: ExternalFixture): ExternalFixture {
  return {
    ...fixture,
    starts_at: new Date(fixture.starts_at),
  };
}

const mockExternalScoresProvider: ExternalScoresProvider = {
  source: 'mock',
  async listFixtures(competition?: ExternalCompetitionId): Promise<ExternalFixture[]> {
    const rows = competition
      ? MOCK_FIXTURES.filter((fixture) => fixture.competition === competition)
      : MOCK_FIXTURES;
    return rows.map(cloneFixture).sort((a, b) => a.starts_at.getTime() - b.starts_at.getTime());
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
  source: 'api_stub',
  async listFixtures(): Promise<ExternalFixture[]> {
    return [];
  },
  async getState(): Promise<ExternalScoresProviderState> {
    return {
      source: 'api_stub',
      last_sync_at: new Date(),
      healthy: false,
      message: 'Connecteur scores monde non configuré.',
    };
  },
};

function shouldUseMockProvider(): boolean {
  return process.env.EXPO_PUBLIC_EXTERNAL_SCORES_MOCK === '1';
}

let cachedProvider: ExternalScoresProvider | null = null;

function resolveExternalScoresProvider(): ExternalScoresProvider {
  if (cachedProvider) return cachedProvider;

  if (shouldUseMockProvider()) {
    cachedProvider = mockExternalScoresProvider;
    return cachedProvider;
  }

  if (hasExternalScoresApiKey()) {
    cachedProvider = createApiFootballProvider();
    return cachedProvider;
  }

  cachedProvider = apiStubProvider;
  return cachedProvider;
}

/** Réinitialise le provider résolu (tests). */
export function resetExternalScoresProviderCache(): void {
  cachedProvider = null;
}

export const externalScoresService = {
  async listFixtures(competition?: ExternalCompetitionId): Promise<ExternalFixture[]> {
    const provider = resolveExternalScoresProvider();
    try {
      const fixtures = await provider.listFixtures(competition);
      return fixtures.sort((a, b) => a.starts_at.getTime() - b.starts_at.getTime());
    } catch (error) {
      if (shouldUseMockProvider()) {
        return mockExternalScoresProvider.listFixtures(competition);
      }
      // eslint-disable-next-line no-console
      console.warn('[externalScores] provider error:', error);
      return [];
    }
  },

  async getProviderState(): Promise<ExternalScoresProviderState> {
    return resolveExternalScoresProvider().getState();
  },
};
