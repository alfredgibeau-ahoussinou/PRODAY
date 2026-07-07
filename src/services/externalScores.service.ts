export type ExternalCompetitionId = 'ligue1' | 'd1f';

export type ExternalFixtureStatus = 'scheduled' | 'live' | 'finished';

export interface ExternalFixture {
  id: string;
  competition: ExternalCompetitionId;
  competition_label: string;
  home_team: string;
  away_team: string;
  starts_at: Date;
  status: ExternalFixtureStatus;
  score_home?: number;
  score_away?: number;
  minute?: number;
  venue?: string;
}

export interface ExternalScoresProviderState {
  source: 'mock' | 'api_stub';
  last_sync_at: Date;
  healthy: boolean;
  message?: string;
}

export interface ExternalScoresProvider {
  readonly source: ExternalScoresProviderState['source'];
  listFixtures(competition?: ExternalCompetitionId): Promise<ExternalFixture[]>;
  getState(): Promise<ExternalScoresProviderState>;
}

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

async function fetchExternalApiFixtures(
  _competition?: ExternalCompetitionId
): Promise<ExternalFixture[]> {
  // Stub production-ready: brancher API-Football (ou équivalent) ici.
  // eslint-disable-next-line no-console
  console.info(
    '[externalScores] API provider not configured. Set EXPO_PUBLIC_EXTERNAL_SCORES_MOCK=1 for local demo fixtures.'
  );
  return [];
}

const apiStubProvider: ExternalScoresProvider = {
  source: 'api_stub',
  async listFixtures(competition?: ExternalCompetitionId): Promise<ExternalFixture[]> {
    try {
      const fixtures = await fetchExternalApiFixtures(competition);
      return fixtures.sort((a, b) => a.starts_at.getTime() - b.starts_at.getTime());
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('[externalScores] provider error:', error);
      return [];
    }
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

function resolveExternalScoresProvider(): ExternalScoresProvider {
  return shouldUseMockProvider() ? mockExternalScoresProvider : apiStubProvider;
}

export const externalScoresService = {
  async listFixtures(competition?: ExternalCompetitionId): Promise<ExternalFixture[]> {
    return resolveExternalScoresProvider().listFixtures(competition);
  },

  async getProviderState(): Promise<ExternalScoresProviderState> {
    return resolveExternalScoresProvider().getState();
  },
};
