jest.mock('../services/teamEvents.service', () => ({
  teamEventsService: { getById: jest.fn() },
}));

import {
  ExternalFootballDataProvider,
  MergedFootballProvider,
  ProDayFootballDataProvider,
  normalizeWorldFixtureKey,
  toWorldMatchCenterId,
} from '../services/footballData/providers';
import { footballDataFacade, resolveMatchCenterTabs } from '../services/footballData';
import { resetExternalScoresProviderCache } from '../services/externalScores.service';
import { listCompetitionsForCountry } from '../content/supporterCompetitionsCatalog';

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

  it('normalise les ids fixture pour getLineups / getFixture', () => {
    expect(normalizeWorldFixtureKey('world-fixture-api_123')).toBe('api_123');
    expect(normalizeWorldFixtureKey('api_123')).toBe('api_123');
    expect(normalizeWorldFixtureKey('123')).toBe('api_123');
    expect(normalizeWorldFixtureKey('world-fixture-ligue1_psg_om')).toBe('ligue1_psg_om');
    expect(toWorldMatchCenterId('api_99')).toBe('world-fixture-api_99');
  });

  it('expose getLineups / getEvents / getStatistics / getFixture sur la facade', async () => {
    const merged = new MergedFootballProvider(
      new ProDayFootballDataProvider([], []),
      new ExternalFootballDataProvider(),
    );
    await expect(merged.getLineups('api_1')).resolves.toEqual(expect.any(Array));
    await expect(merged.getEvents('world-fixture-api_1')).resolves.toEqual(expect.any(Array));
    await expect(merged.getStatistics('1')).resolves.toBeNull();
    await expect(footballDataFacade.getFixture('api_1')).resolves.toBeDefined();
  });

  it('resolveMatchCenterTabs garde Compositions même sans XI', () => {
    const tabs = resolveMatchCenterTabs(
      {
        item: {
          id: 'world-fixture-api_1',
          source: 'world',
          status: 'live',
          genderScope: 'unspecified',
          homeLabel: 'A',
          awayLabel: 'B',
          startsAt: new Date(),
        },
        source: 'world',
        lineups: [],
        events: [],
        statistics: null,
        prodayEvent: null,
      },
      false,
    );
    expect(tabs).toEqual(expect.arrayContaining(['resume', 'stats', 'compositions', 'events']));
  });
});
