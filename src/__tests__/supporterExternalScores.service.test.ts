import { externalScoresService } from '../services/externalScores.service';

describe('externalScoresService', () => {
  const previousFlag = process.env.EXPO_PUBLIC_EXTERNAL_SCORES_MOCK;

  beforeEach(() => {
    process.env.EXPO_PUBLIC_EXTERNAL_SCORES_MOCK = '1';
  });

  afterAll(() => {
    if (previousFlag == null) delete process.env.EXPO_PUBLIC_EXTERNAL_SCORES_MOCK;
    else process.env.EXPO_PUBLIC_EXTERNAL_SCORES_MOCK = previousFlag;
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

  it('bascule sur le provider API stub quand le mock est désactivé', async () => {
    process.env.EXPO_PUBLIC_EXTERNAL_SCORES_MOCK = '0';
    const fixtures = await externalScoresService.listFixtures();
    const state = await externalScoresService.getProviderState();
    expect(fixtures).toEqual([]);
    expect(state.source).toBe('api_stub');
    expect(state.healthy).toBe(false);
  });
});

