jest.mock('../services/teamEvents.service', () => ({
  teamEventsService: { getById: jest.fn() },
}));

import { ExternalFootballDataProvider } from '../services/footballData/providers';
import { listCompetitionsForCountry } from '../content/supporterCompetitionsCatalog';
import { resetExternalScoresProviderCache } from '../services/externalScores.service';

describe('footballDataFacade / ExternalFootballDataProvider', () => {
  beforeEach(() => {
    resetExternalScoresProviderCache();
    process.env.EXPO_PUBLIC_EXTERNAL_SCORES_MOCK = '1';
  });

  afterEach(() => {
    delete process.env.EXPO_PUBLIC_EXTERNAL_SCORES_MOCK;
    resetExternalScoresProviderCache();
  });

  it('listLiveFixtures retourne des fixtures via provider', async () => {
    const provider = new ExternalFootballDataProvider();
    const live = await provider.listLiveFixtures();
    expect(Array.isArray(live)).toBe(true);
  });

  it('searchTeams retourne des hits', async () => {
    const provider = new ExternalFootballDataProvider();
    const hits = await provider.searchTeams('Paris');
    expect(Array.isArray(hits)).toBe(true);
  });

  it('listCompetitionsByCountry filtre le catalog', () => {
    const fr = listCompetitionsForCountry('FR');
    expect(fr.every((c) => c.countryCode === 'FR')).toBe(true);
  });
});
