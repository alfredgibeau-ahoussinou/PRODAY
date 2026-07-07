import { externalScoresService, resetExternalScoresProviderCache } from '../services/externalScores.service';

describe('externalScoresService', () => {
  const previousFlag = process.env.EXPO_PUBLIC_EXTERNAL_SCORES_MOCK;
  const previousKey = process.env.EXPO_PUBLIC_EXTERNAL_SCORES_API_KEY;

  beforeEach(() => {
    process.env.EXPO_PUBLIC_EXTERNAL_SCORES_MOCK = '1';
    delete process.env.EXPO_PUBLIC_EXTERNAL_SCORES_API_KEY;
    resetExternalScoresProviderCache();
  });

  afterAll(() => {
    if (previousFlag == null) delete process.env.EXPO_PUBLIC_EXTERNAL_SCORES_MOCK;
    else process.env.EXPO_PUBLIC_EXTERNAL_SCORES_MOCK = previousFlag;
    if (previousKey == null) delete process.env.EXPO_PUBLIC_EXTERNAL_SCORES_API_KEY;
    else process.env.EXPO_PUBLIC_EXTERNAL_SCORES_API_KEY = previousKey;
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

  it('expose un état provider mock par défaut', async () => {
    const state = await externalScoresService.getProviderState();
    expect(state.source).toBe('mock');
    expect(state.healthy).toBe(true);
  });

  it('n’utilise pas le mock sans flag explicite', async () => {
    delete process.env.EXPO_PUBLIC_EXTERNAL_SCORES_MOCK;
    resetExternalScoresProviderCache();
    const fixtures = await externalScoresService.listFixtures();
    const state = await externalScoresService.getProviderState();
    expect(fixtures).toEqual([]);
    expect(state.source).toBe('api_stub');
    expect(state.healthy).toBe(false);
  });

  it('sélectionne le provider API quand une clé est configurée', async () => {
    delete process.env.EXPO_PUBLIC_EXTERNAL_SCORES_MOCK;
    process.env.EXPO_PUBLIC_EXTERNAL_SCORES_API_KEY = 'test-key';
    resetExternalScoresProviderCache();
    const state = await externalScoresService.getProviderState();
    expect(state.source).toBe('api_football');
  });
});

