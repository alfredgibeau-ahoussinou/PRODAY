import {
  mapFdMatchToUnified,
  mapFdStatus,
  mergeExternalMatchesPreferRicher,
  normalizeMatchTeamName,
} from '../services/supporterFootball/footballDataMappers';
import type { UnifiedMatch } from '../services/supporterFootball/types';

describe('football-data.org → UnifiedMatch (FL1)', () => {
  it('mappe un match Ligue 1 vers UnifiedMatch source external', () => {
    const match = mapFdMatchToUnified({
      id: 424242,
      utcDate: '2026-08-20T19:00:00Z',
      status: 'TIMED',
      matchday: 2,
      venue: 'Orange Vélodrome',
      homeTeam: { id: 516, name: 'Olympique de Marseille', shortName: 'Marseille', tla: 'OM' },
      awayTeam: { id: 524, name: 'Paris Saint-Germain FC', shortName: 'PSG', tla: 'PSG' },
      competition: { id: 2015, name: 'Ligue 1', code: 'FL1' },
      score: { fullTime: { home: null, away: null }, halfTime: { home: null, away: null } },
    });

    expect(match.id).toBe('external-fd-424242');
    expect(match.source).toBe('external');
    expect(match.status).toBe('scheduled');
    expect(match.competition.name).toBe('Ligue 1');
    expect(match.competition.id).toBe('fd-comp-FL1');
    expect(match.homeTeam.name).toBe('Olympique de Marseille');
    expect(match.homeTeam.shortName).toBe('Marseille');
    expect(match.awayTeam.name).toBe('Paris Saint-Germain FC');
    expect(match.awayTeam.shortName).toBe('PSG');
    expect(match.awayTeam.id).toBe('fd-team-524');
    expect(match.score.home).toBeNull();
    expect(match.score.away).toBeNull();
    expect(match.venue).toBe('Orange Vélodrome');
    expect(match.round).toBe('2');
    expect(match.externalFixtureId).toBe(424242);
  });

  it('mappe FINISHED avec score FT', () => {
    const match = mapFdMatchToUnified({
      id: 1,
      utcDate: '2026-08-15T19:00:00Z',
      status: 'FINISHED',
      homeTeam: { id: 1, name: 'Home' },
      awayTeam: { id: 2, name: 'Away' },
      competition: { code: 'FL1', name: 'Ligue 1' },
      score: {
        fullTime: { home: 2, away: 1 },
        halfTime: { home: 1, away: 0 },
      },
    });
    expect(match.status).toBe('finished');
    expect(match.score.home).toBe(2);
    expect(match.score.away).toBe(1);
    expect(match.score.halfTimeHome).toBe(1);
  });

  it('mapFdStatus couvre live / HT / reporté', () => {
    expect(mapFdStatus('IN_PLAY')).toBe('live');
    expect(mapFdStatus('PAUSED')).toBe('halftime');
    expect(mapFdStatus('POSTPONED')).toBe('postponed');
    expect(mapFdStatus('SCHEDULED')).toBe('scheduled');
  });

  it('déduplique date+home+away en préférant le payload plus riche', () => {
    const thin: UnifiedMatch = {
      id: 'external-fd-1',
      source: 'external',
      homeTeam: { id: 'a', name: 'Paris Saint Germain' },
      awayTeam: { id: 'b', name: 'Olympique Marseille' },
      competition: { id: 'fd-comp-FL1', name: 'Ligue 1' },
      date: new Date('2026-08-20T19:00:00Z'),
      status: 'scheduled',
      score: { home: null, away: null },
    };
    const rich: UnifiedMatch = {
      ...thin,
      id: 'external-sm-99',
      homeTeam: { id: 'sm-a', name: 'Paris Saint-Germain' },
      awayTeam: { id: 'sm-b', name: 'Olympique Marseille' },
      venue: 'Parc des Princes',
      events: [{ id: 'e1', type: 'goal', minute: 12 }],
    };
    expect(normalizeMatchTeamName('Paris Saint Germain')).toBe(
      normalizeMatchTeamName('Paris Saint-Germain'),
    );
    const merged = mergeExternalMatchesPreferRicher([[thin], [rich]]);
    expect(merged).toHaveLength(1);
    expect(merged[0].id).toBe('external-sm-99');
  });
});
