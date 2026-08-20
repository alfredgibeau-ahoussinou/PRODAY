import { mapApiFootballFixture } from '../services/externalScoresApiFootball.provider';

describe('externalScoresApiFootball provider', () => {
  it('mappe une fixture API-Football vers ExternalFixture', () => {
    const fixture = mapApiFootballFixture({
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
    });

    expect(fixture).toMatchObject({
      id: 'api_123',
      competition: 'ligue1',
      competition_label: 'Ligue 1',
      league_id: 61,
      home_team: 'Paris SG',
      away_team: 'Marseille',
      status: 'live',
      score_home: 1,
      score_away: 0,
      minute: 34,
      venue: 'Paris',
    });
  });

  it('mappe le statut live depuis HT et 2H', () => {
    const ht = mapApiFootballFixture({
      fixture: {
        id: 2,
        date: '2026-07-01T19:00:00.000Z',
        status: { short: 'HT', elapsed: 45 },
      },
      league: { id: 39, name: 'Premier League' },
      teams: { home: { name: 'A' }, away: { name: 'B' } },
      goals: { home: 0, away: 0 },
    });
    expect(ht.status).toBe('live');
    expect(ht.competition).toBe('pl');
    expect(ht.competition_label).toBe('Premier League');
  });

  it('utilise other pour une ligue inconnue', () => {
    const row = mapApiFootballFixture({
      fixture: {
        id: 9,
        date: '2026-07-01T19:00:00.000Z',
        status: { short: 'NS' },
      },
      league: { id: 9999, name: 'Ligue locale' },
      teams: { home: { name: 'X' }, away: { name: 'Y' } },
      goals: { home: null, away: null },
    });
    expect(row.competition).toBe('other');
    expect(row.competition_label).toBe('Ligue locale');
  });
});
