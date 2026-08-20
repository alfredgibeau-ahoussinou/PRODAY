import {
  mapFootballDataMatch,
  hasFootballDataToken,
  resetFootballDataCache,
  createFootballDataProvider,
} from '../services/externalScoresFootballData.provider';
import {
  resolveExternalScoresProvider,
  resetExternalScoresProviderCache,
} from '../services/externalScores.service';
import { buildSupporterDemoFixtures } from '../content/supporterDemoFixtures';
import { fetchSupporterMatchHub } from '../services/supporterMatchHub.service';
import { teamEventsService } from '../services/teamEvents.service';

jest.mock('../services/teamEvents.service', () => ({
  teamEventsService: {
    listUpcoming: jest.fn(),
  },
}));

describe('football-data.org provider', () => {
  const prevApi = process.env.EXPO_PUBLIC_EXTERNAL_SCORES_API_KEY;
  const prevFd = process.env.EXPO_PUBLIC_FOOTBALL_DATA_TOKEN;
  const prevMock = process.env.EXPO_PUBLIC_EXTERNAL_SCORES_MOCK;

  beforeEach(() => {
    delete process.env.EXPO_PUBLIC_EXTERNAL_SCORES_API_KEY;
    delete process.env.EXPO_PUBLIC_FOOTBALL_DATA_TOKEN;
    delete process.env.EXPO_PUBLIC_EXTERNAL_SCORES_MOCK;
    resetExternalScoresProviderCache();
    resetFootballDataCache();
  });

  afterAll(() => {
    if (prevApi == null) delete process.env.EXPO_PUBLIC_EXTERNAL_SCORES_API_KEY;
    else process.env.EXPO_PUBLIC_EXTERNAL_SCORES_API_KEY = prevApi;
    if (prevFd == null) delete process.env.EXPO_PUBLIC_FOOTBALL_DATA_TOKEN;
    else process.env.EXPO_PUBLIC_FOOTBALL_DATA_TOKEN = prevFd;
    if (prevMock == null) delete process.env.EXPO_PUBLIC_EXTERNAL_SCORES_MOCK;
    else process.env.EXPO_PUBLIC_EXTERNAL_SCORES_MOCK = prevMock;
    resetExternalScoresProviderCache();
    resetFootballDataCache();
  });

  it('mappe une fixture football-data.org vers ExternalFixture', () => {
    const fixture = mapFootballDataMatch({
      id: 456789,
      utcDate: '2026-08-20T19:00:00Z',
      status: 'IN_PLAY',
      minute: 41,
      venue: 'Parc des Princes',
      homeTeam: { id: 524, name: 'Paris Saint-Germain FC', shortName: 'PSG' },
      awayTeam: { id: 516, name: 'Olympique de Marseille', shortName: 'OM' },
      score: { fullTime: { home: 1, away: 0 } },
      competition: { id: 2015, name: 'Ligue 1', code: 'FL1' },
    });

    expect(fixture).toMatchObject({
      id: 'fd_456789',
      competition: 'ligue1',
      competition_label: 'Ligue 1',
      league_id: 61,
      home_team: 'PSG',
      away_team: 'OM',
      status: 'live',
      score_home: 1,
      score_away: 0,
      minute: 41,
      home_team_id: 85,
      away_team_id: 81,
    });
  });

  it('mappe PL / CL / PD', () => {
    const pl = mapFootballDataMatch({
      id: 1,
      utcDate: '2026-08-21T15:00:00Z',
      status: 'TIMED',
      homeTeam: { name: 'Arsenal FC', shortName: 'Arsenal' },
      awayTeam: { name: 'Chelsea FC', shortName: 'Chelsea' },
      competition: { code: 'PL', name: 'Premier League' },
    });
    expect(pl.competition).toBe('pl');
    expect(pl.status).toBe('scheduled');

    const cl = mapFootballDataMatch({
      id: 2,
      utcDate: '2026-08-21T19:00:00Z',
      status: 'SCHEDULED',
      homeTeam: { name: 'Real Madrid' },
      awayTeam: { name: 'FC Bayern München', shortName: 'Bayern' },
      competition: { code: 'CL', name: 'UEFA Champions League' },
    });
    expect(cl.competition).toBe('ucl');
    expect(cl.league_id).toBe(2);
  });

  it('détecte le token free', () => {
    expect(hasFootballDataToken()).toBe(false);
    process.env.EXPO_PUBLIC_FOOTBALL_DATA_TOKEN = 'free-token';
    expect(hasFootballDataToken()).toBe(true);
  });

  it('résout api-football avant football-data puis démo', () => {
    process.env.EXPO_PUBLIC_EXTERNAL_SCORES_API_KEY = 'paid-key';
    process.env.EXPO_PUBLIC_FOOTBALL_DATA_TOKEN = 'free-token';
    resetExternalScoresProviderCache();
    expect(resolveExternalScoresProvider().source).toBe('api_football');

    delete process.env.EXPO_PUBLIC_EXTERNAL_SCORES_API_KEY;
    resetExternalScoresProviderCache();
    expect(resolveExternalScoresProvider().source).toBe('football_data');

    delete process.env.EXPO_PUBLIC_FOOTBALL_DATA_TOKEN;
    resetExternalScoresProviderCache();
    expect(resolveExternalScoresProvider().source).toBe('demo');
  });

  it('provider football_data expose getState', async () => {
    process.env.EXPO_PUBLIC_FOOTBALL_DATA_TOKEN = 'tok';
    const provider = createFootballDataProvider();
    const state = await provider.getState();
    expect(state.source).toBe('football_data');
    expect(state.healthy).toBe(true);
  });
});

describe('démo Accueil jamais vide', () => {
  const prevApi = process.env.EXPO_PUBLIC_EXTERNAL_SCORES_API_KEY;
  const prevFd = process.env.EXPO_PUBLIC_FOOTBALL_DATA_TOKEN;
  const prevMock = process.env.EXPO_PUBLIC_EXTERNAL_SCORES_MOCK;

  beforeEach(() => {
    delete process.env.EXPO_PUBLIC_EXTERNAL_SCORES_API_KEY;
    delete process.env.EXPO_PUBLIC_FOOTBALL_DATA_TOKEN;
    delete process.env.EXPO_PUBLIC_EXTERNAL_SCORES_MOCK;
    resetExternalScoresProviderCache();
    (teamEventsService.listUpcoming as jest.Mock).mockResolvedValue([]);
  });

  afterAll(() => {
    if (prevApi == null) delete process.env.EXPO_PUBLIC_EXTERNAL_SCORES_API_KEY;
    else process.env.EXPO_PUBLIC_EXTERNAL_SCORES_API_KEY = prevApi;
    if (prevFd == null) delete process.env.EXPO_PUBLIC_FOOTBALL_DATA_TOKEN;
    else process.env.EXPO_PUBLIC_FOOTBALL_DATA_TOKEN = prevFd;
    if (prevMock == null) delete process.env.EXPO_PUBLIC_EXTERNAL_SCORES_MOCK;
    else process.env.EXPO_PUBLIC_EXTERNAL_SCORES_MOCK = prevMock;
    resetExternalScoresProviderCache();
  });

  it('buildSupporterDemoFixtures inclut live PSG / Real / Barça', () => {
    const fixtures = buildSupporterDemoFixtures();
    const live = fixtures.filter((f) => f.status === 'live');
    expect(live.length).toBeGreaterThanOrEqual(3);
    expect(live.some((f) => f.home_team_id === 85 || f.away_team_id === 85)).toBe(true);
    expect(live.some((f) => f.home_team_id === 541 || f.away_team_id === 541)).toBe(true);
    expect(live.some((f) => f.home_team_id === 529 || f.away_team_id === 529)).toBe(true);
  });

  it('hub démo remplit live + world (pas de sections toutes vides)', async () => {
    const result = await fetchSupporterMatchHub({
      calendarEvents: [],
      tournaments: [],
      follows: [],
      filters: { gender: 'all', source: 'all', scope: 'all', competition: 'all' },
    });

    expect(result.providerState.source).toBe('demo');
    expect(result.sections.live.length).toBeGreaterThan(0);
    expect(result.sections.world.length).toBeGreaterThan(0);
    expect(result.heroKickoffs.length).toBeGreaterThan(0);
    expect(result.liveCount).toBeGreaterThan(0);
  });
});
