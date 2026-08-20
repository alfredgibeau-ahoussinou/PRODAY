jest.mock('../services/teamEvents.service', () => ({
  teamEventsService: { getById: jest.fn() },
}));

import { FOOTBALL_HUB, FOOTBALL_HUB_COPY } from '../features/footballHub/theme/footballHubTheme';
import {
  ExternalFootballDataProvider,
  MergedFootballProvider,
  ProDayFootballDataProvider,
} from '../services/footballData/providers';
import { resetExternalScoresProviderCache } from '../services/externalScores.service';

describe('footballHub theme', () => {
  it('expose l’identité violet ProDay immersive', () => {
    expect(FOOTBALL_HUB.accent).toBe('#3C00F0');
    expect(FOOTBALL_HUB.live).toBe('#22C55E');
    expect(FOOTBALL_HUB_COPY.heroTitle).toContain('football');
  });
});

describe('MergedFootballProvider', () => {
  beforeEach(() => {
    resetExternalScoresProviderCache();
    process.env.EXPO_PUBLIC_EXTERNAL_SCORES_MOCK = '1';
  });

  afterEach(() => {
    delete process.env.EXPO_PUBLIC_EXTERNAL_SCORES_MOCK;
    resetExternalScoresProviderCache();
  });

  it('fusionne live via provider externe', async () => {
    const merged = new MergedFootballProvider(
      new ProDayFootballDataProvider([], []),
      new ExternalFootballDataProvider(),
    );
    const live = await merged.listLiveFixtures();
    expect(Array.isArray(live)).toBe(true);
    const fixtures = await merged.getFixtures?.({ days: 7 });
    expect(Array.isArray(fixtures)).toBe(true);
  });

  it('getLineups ne invente pas de XI (tableau vide si mock sans lineups API)', async () => {
    const merged = new MergedFootballProvider(
      new ProDayFootballDataProvider([], []),
      new ExternalFootballDataProvider(),
    );
    const lineups = await merged.getLineups('world-fixture-api_999999');
    expect(lineups).toEqual([]);
  });
});
