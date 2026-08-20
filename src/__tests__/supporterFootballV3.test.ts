import {
  createSupporterFootballFacade,
  DemoFootballProvider,
  resolveMatchCenterTabs,
  mapSmFixtureToUnified,
} from '../services/supporterFootball';
import { mapSmStatus, inferGenderScope } from '../services/supporterFootball/mappers';

jest.mock('../lib/firebaseFunctions', () => ({
  callFunction: jest.fn(async () => {
    throw new Error('proxy unavailable');
  }),
  isFunctionsUnavailable: () => true,
}));

describe('supporterFootball UnifiedMatch + providers', () => {
  const prevDemo = process.env.EXPO_PUBLIC_SUPPORTER_FOOTBALL_DEMO;
  const prevToken = process.env.EXPO_PUBLIC_SPORTMONKS_API_TOKEN;

  afterEach(() => {
    process.env.EXPO_PUBLIC_SUPPORTER_FOOTBALL_DEMO = prevDemo;
    process.env.EXPO_PUBLIC_SPORTMONKS_API_TOKEN = prevToken;
  });

  it('mappe un fixture Sportmonks vers UnifiedMatch source external', () => {
    const match = mapSmFixtureToUnified({
      id: 42,
      starting_at_timestamp: 1_700_000_000,
      participants: [
        { id: 1, name: 'Home FC', meta: { location: 'home' } },
        { id: 2, name: 'Away FC', meta: { location: 'away' } },
      ],
      scores: [
        { description: 'CURRENT', score: { goals: 2, participant: 'home' } },
        { description: 'CURRENT', score: { goals: 1, participant: 'away' } },
      ],
      state: { short_name: 'FT', name: 'Full Time' },
      league: { id: 8, name: 'Premier League' },
    });
    expect(match.id).toBe('external-sm-42');
    expect(match.source).toBe('external');
    expect(match.homeTeam.name).toBe('Home FC');
    expect(match.awayTeam.name).toBe('Away FC');
    expect(match.score.home).toBe(2);
    expect(match.score.away).toBe(1);
    expect(match.status).toBe('finished');
  });

  it('infère genre / statut sans inventer de score', () => {
    expect(inferGenderScope('D1 Arkema Féminin')).toBe('women');
    expect(inferGenderScope('U19 Youth League')).toBe('youth');
    expect(mapSmStatus({ short_name: 'NS' })).toBe('scheduled');
    expect(mapSmStatus({ short_name: 'INPLAY' })).toBe('live');
  });

  it('mode démo tague source demo et n’expose pas de lineups inventés', async () => {
    process.env.EXPO_PUBLIC_SUPPORTER_FOOTBALL_DEMO = '1';
    delete process.env.EXPO_PUBLIC_SPORTMONKS_API_TOKEN;
    const demo = new DemoFootballProvider();
    const live = await demo.getLive();
    expect(live.every((m) => m.source === 'demo')).toBe(true);
    expect(await demo.getLineups('demo-live')).toBeNull();
  });

  it('facade merge ProDay + démo sans token', async () => {
    process.env.EXPO_PUBLIC_SUPPORTER_FOOTBALL_DEMO = '1';
    delete process.env.EXPO_PUBLIC_SPORTMONKS_API_TOKEN;
    const facade = createSupporterFootballFacade([], []);
    const health = await facade.getHealth();
    expect(health.mode).toBe('demo');
    const live = await facade.getLive();
    expect(live.some((m) => m.source === 'demo')).toBe(true);
  });

  it('Match Center tabs = Résumé | Composition | Statistiques | Événements (+ Vidéo)', () => {
    const tabs = resolveMatchCenterTabs({
      id: 'x',
      source: 'external',
      homeTeam: { id: '1', name: 'A' },
      awayTeam: { id: '2', name: 'B' },
      competition: { id: 'c', name: 'Ligue' },
      date: new Date(),
      status: 'live',
      score: { home: 0, away: 0 },
      video: { url: 'https://example.com', rightsOk: true },
    });
    expect(tabs).toEqual([
      'resume',
      'composition',
      'statistiques',
      'evenements',
      'video',
    ]);
  });
});
