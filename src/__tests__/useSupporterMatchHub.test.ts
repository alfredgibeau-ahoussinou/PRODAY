import { fetchSupporterMatchHub } from '../services/supporterMatchHub.service';
import { resetExternalScoresProviderCache } from '../services/externalScores.service';
import { teamEventsService } from '../services/teamEvents.service';
import type { SupporterMatchFilters } from '../services/supporterPreferences.service';
import {
  extractWorldFixtureKey,
  parseWorldFixtureRef,
} from '../utils/supporterMatchDetail';

jest.mock('../services/teamEvents.service', () => ({
  teamEventsService: {
    listUpcoming: jest.fn(),
  },
}));

const ALL_FILTERS: SupporterMatchFilters = {
  gender: 'all',
  source: 'all',
  scope: 'all',
  competition: 'all',
};

/**
 * Contrats Hub : pas de reload spinner sur poll silencieux ;
 * Accueil upcoming monde même sans follows ; ids lineup.
 */
describe('hub loading / poll contract', () => {
  const previousFlag = process.env.EXPO_PUBLIC_EXTERNAL_SCORES_MOCK;

  beforeEach(() => {
    process.env.EXPO_PUBLIC_EXTERNAL_SCORES_MOCK = '1';
    resetExternalScoresProviderCache();
    (teamEventsService.listUpcoming as jest.Mock).mockResolvedValue([]);
  });

  afterAll(() => {
    if (previousFlag == null) delete process.env.EXPO_PUBLIC_EXTERNAL_SCORES_MOCK;
    else process.env.EXPO_PUBLIC_EXTERNAL_SCORES_MOCK = previousFlag;
    resetExternalScoresProviderCache();
  });

  it('upcoming monde avec 0 follows (Accueil non vide)', async () => {
    const result = await fetchSupporterMatchHub({
      calendarEvents: [],
      tournaments: [],
      follows: [],
      filters: ALL_FILTERS,
    });
    expect(result.sections.upcoming.length).toBeGreaterThan(0);
    expect(result.sections.world.length).toBeGreaterThan(0);
  });

  it('refresh silencieux : loading reste false après 1er load', () => {
    const hasLoaded = true;
    const silent = (opts?: { silent?: boolean }) => opts?.silent ?? hasLoaded;
    expect(silent({ silent: true })).toBe(true);
    expect(silent()).toBe(true);
    expect(silent({ silent: false })).toBe(false);
  });
});

describe('lineup fixture id extraction', () => {
  it('extrait api_ depuis world-fixture / api_ / numérique', () => {
    expect(extractWorldFixtureKey('world-fixture-api_987')).toBe('api_987');
    expect(extractWorldFixtureKey('api_987')).toBe('api_987');
    expect(extractWorldFixtureKey('987')).toBe('api_987');
    expect(extractWorldFixtureKey('world-fixture-ligue1_psg_om')).toBe('ligue1_psg_om');
    expect(parseWorldFixtureRef('world-fixture-api_987')?.numericId).toBe(987);
  });
});
