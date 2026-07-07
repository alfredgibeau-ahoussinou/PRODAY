import { mapApiFootballFixture } from '../services/externalScoresApiFootball.provider';

describe('externalScoresApiFootball provider', () => {
  it('mappe une fixture API-Football vers ExternalFixture', () => {
    const fixture = mapApiFootballFixture(
      {
        fixture: {
          id: 123,
          date: '2026-07-01T19:00:00.000Z',
          status: { short: '1H', elapsed: 34 },
          venue: { city: 'Paris', name: 'Parc des Princes' },
        },
        league: { id: 61, name: 'Ligue 1' },
        teams: {
          home: { name: 'Paris SG' },
          away: { name: 'Marseille' },
        },
        goals: { home: 1, away: 0 },
      },
      'ligue1',
    );

    expect(fixture).toMatchObject({
      id: 'api_123',
      competition: 'ligue1',
      home_team: 'Paris SG',
      away_team: 'Marseille',
      status: 'live',
      score_home: 1,
      score_away: 0,
      minute: 34,
      venue: 'Paris',
    });
  });
});
