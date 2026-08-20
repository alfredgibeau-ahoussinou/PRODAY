import { externalScoresService, resetExternalScoresProviderCache } from '../services/externalScores.service';

describe('externalScoresService', () => {
  const previousFlag = process.env.EXPO_PUBLIC_EXTERNAL_SCORES_MOCK;
  const previousKey = process.env.EXPO_PUBLIC_EXTERNAL_SCORES_API_KEY;
  const previousFd = process.env.EXPO_PUBLIC_FOOTBALL_DATA_TOKEN;

  beforeEach(() => {
    process.env.EXPO_PUBLIC_EXTERNAL_SCORES_MOCK = '1';
    delete process.env.EXPO_PUBLIC_EXTERNAL_SCORES_API_KEY;
    delete process.env.EXPO_PUBLIC_FOOTBALL_DATA_TOKEN;
    resetExternalScoresProviderCache();
  });

  afterAll(() => {
    if (previousFlag == null) delete process.env.EXPO_PUBLIC_EXTERNAL_SCORES_MOCK;
    else process.env.EXPO_PUBLIC_EXTERNAL_SCORES_MOCK = previousFlag;
    if (previousKey == null) delete process.env.EXPO_PUBLIC_EXTERNAL_SCORES_API_KEY;
    else process.env.EXPO_PUBLIC_EXTERNAL_SCORES_API_KEY = previousKey;
    if (previousFd == null) delete process.env.EXPO_PUBLIC_FOOTBALL_DATA_TOKEN;
    else process.env.EXPO_PUBLIC_FOOTBALL_DATA_TOKEN = previousFd;
    resetExternalScoresProviderCache();
  });

  it('retourne des fixtures mock triées', async () => {
    const fixtures = await externalScoresService.listFixtures();
    expect(fixtures.length).toBeGreaterThan(0);
    for (let i = 1; i < fixtures.length; i += 1) {
      expect(fixtures[i].starts_at.getTime()).toBeGreaterThanOrEqual(
        fixtures[i - 1].starts_at.getTime()
      );
    }
  });

  it('filtre une compétition', async () => {
    const ligue1 = await externalScoresService.listFixtures('ligue1');
    expect(ligue1.length).toBeGreaterThan(0);
    expect(ligue1.every((fixture) => fixture.competition === 'ligue1')).toBe(true);
  });

  it('expose listLiveFixtures mock avec matchs monde live', async () => {
    const live = await externalScoresService.listLiveFixtures();
    expect(live.length).toBeGreaterThanOrEqual(2);
    expect(live.every((fixture) => fixture.status === 'live')).toBe(true);
    expect(live.some((fixture) => fixture.competition === 'pl')).toBe(true);
  });

  it('expose listUpcomingFixtures mock sur 14 jours', async () => {
    const week = await externalScoresService.listUpcomingFixtures({ days: 7 });
    const fortnight = await externalScoresService.listUpcomingFixtures({ days: 14 });
    expect(week.length).toBeGreaterThan(0);
    expect(fortnight.length).toBeGreaterThan(week.length);
    expect(fortnight.every((fixture) => fixture.status === 'scheduled')).toBe(true);
  });

  it('listTeamFixtures mock retourne des matchs PSG programmés', async () => {
    const psg = await externalScoresService.listTeamFixtures(85, {
      status: 'scheduled',
      days: 14,
    });
    expect(psg.length).toBeGreaterThanOrEqual(1);
    expect(
      psg.every(
        (fixture) => fixture.home_team_id === 85 || fixture.away_team_id === 85,
      ),
    ).toBe(true);
    expect(psg.every((fixture) => fixture.home_team_id != null)).toBe(true);
  });

  it('expose un état provider mock par défaut', async () => {
    const state = await externalScoresService.getProviderState();
    expect(state.source).toBe('mock');
    expect(state.healthy).toBe(true);
  });

  it('sans clé utilise la démo riche (jamais vide)', async () => {
    delete process.env.EXPO_PUBLIC_EXTERNAL_SCORES_MOCK;
    resetExternalScoresProviderCache();
    const fixtures = await externalScoresService.listFixtures();
    const live = await externalScoresService.listLiveFixtures();
    const state = await externalScoresService.getProviderState();
    expect(fixtures.length).toBeGreaterThan(0);
    expect(live.length).toBeGreaterThan(0);
    expect(state.source).toBe('demo');
    expect(state.healthy).toBe(true);
  });

  it('démo retourne des fixtures par équipe (PSG)', async () => {
    delete process.env.EXPO_PUBLIC_EXTERNAL_SCORES_MOCK;
    resetExternalScoresProviderCache();
    const psg = await externalScoresService.listTeamFixtures(85, {
      status: 'scheduled',
      days: 14,
    });
    expect(psg.length).toBeGreaterThanOrEqual(1);
    expect(psg.some((f) => f.home_team_id === 85 || f.away_team_id === 85)).toBe(true);
  });

  it('sélectionne le provider API quand une clé est configurée', async () => {
    delete process.env.EXPO_PUBLIC_EXTERNAL_SCORES_MOCK;
    process.env.EXPO_PUBLIC_EXTERNAL_SCORES_API_KEY = 'test-key';
    resetExternalScoresProviderCache();
    const state = await externalScoresService.getProviderState();
    expect(state.source).toBe('api_football');
  });

  it('sélectionne football-data.org quand seul le token gratuit est présent', async () => {
    delete process.env.EXPO_PUBLIC_EXTERNAL_SCORES_MOCK;
    delete process.env.EXPO_PUBLIC_EXTERNAL_SCORES_API_KEY;
    process.env.EXPO_PUBLIC_FOOTBALL_DATA_TOKEN = 'free-token';
    resetExternalScoresProviderCache();
    const state = await externalScoresService.getProviderState();
    expect(state.source).toBe('football_data');
  });
});
