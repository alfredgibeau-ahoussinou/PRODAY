import {
  getFeaturedPopularClubs,
  searchCuratedPopularClubs,
} from '../content/supporterPopularClubs';
import { externalScoresService, resetExternalScoresProviderCache } from '../services/externalScores.service';

describe('supporterPopularClubs', () => {
  it('trouve PSG, Real et Barça sans API', () => {
    const psg = searchCuratedPopularClubs('PSG');
    expect(psg.some((h) => h.name.includes('Paris'))).toBe(true);
    expect(psg[0]?.id).toMatch(/^wt:id:85$/);

    const real = searchCuratedPopularClubs('Real');
    expect(real.some((h) => h.name.includes('Real Madrid'))).toBe(true);

    const barca = searchCuratedPopularClubs('Barça');
    expect(barca.some((h) => h.name.includes('Barcelone'))).toBe(true);
  });

  it('matche OM et Lyon via alias', () => {
    expect(searchCuratedPopularClubs('OM').some((h) => h.name.includes('Marseille'))).toBe(true);
    expect(searchCuratedPopularClubs('Lyon').some((h) => h.name.includes('Lyonnais'))).toBe(true);
  });

  it('expose des clubs populaires quand la requête est vide', () => {
    const featured = getFeaturedPopularClubs();
    expect(featured.length).toBeGreaterThanOrEqual(8);
    expect(featured.some((c) => c.name.includes('Paris'))).toBe(true);
    expect(featured.some((c) => c.name.includes('Real Madrid'))).toBe(true);
  });

  it('normalise les accents (Barca → Barcelone)', () => {
    expect(searchCuratedPopularClubs('Barca').some((h) => h.name.includes('Barcelone'))).toBe(true);
  });
});

describe('externalScoresService.searchTeams (curated fallback)', () => {
  const previousFlag = process.env.EXPO_PUBLIC_EXTERNAL_SCORES_MOCK;
  const previousKey = process.env.EXPO_PUBLIC_EXTERNAL_SCORES_API_KEY;

  beforeEach(() => {
    delete process.env.EXPO_PUBLIC_EXTERNAL_SCORES_MOCK;
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

  it('retourne PSG en mode api_stub sans clé', async () => {
    const hits = await externalScoresService.searchTeams('PSG');
    expect(hits.length).toBeGreaterThan(0);
    expect(hits.some((h) => h.name.includes('Paris'))).toBe(true);
  });
});
