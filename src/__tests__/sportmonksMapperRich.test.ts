import {
  FIXTURE_DETAIL_INCLUDES,
  mapSmFixtureToUnified,
  parseFormationField,
} from '../services/supporterFootball';
import type { SmFixture } from '../services/supporterFootball/mappers';

/**
 * Sous-ensemble Lens–PSG (fixture 19467892) — forme réelle Sportmonks,
 * tronqué à ~4 joueurs + xgfixture (pas le JSON complet).
 */
const LENS_PSG_MINIMAL: SmFixture = {
  id: 19467892,
  starting_at: '2025-03-16 20:45:00',
  starting_at_timestamp: 1742157900,
  state_id: 5,
  league_id: 301,
  participants: [
    {
      id: 44,
      name: 'Lens',
      short_code: 'RCL',
      image_path: 'https://cdn.sportmonks.com/images/soccer/teams/12/44.png',
      meta: { location: 'home' },
    },
    {
      id: 85,
      name: 'Paris Saint Germain',
      short_code: 'PSG',
      image_path: 'https://cdn.sportmonks.com/images/soccer/teams/21/85.png',
      meta: { location: 'away' },
    },
  ],
  scores: [
    { description: '1ST_HALF', score: { goals: 0, participant: 'home' } },
    { description: '1ST_HALF', score: { goals: 1, participant: 'away' } },
    { description: 'CURRENT', score: { goals: 0, participant: 'home' } },
    { description: 'CURRENT', score: { goals: 2, participant: 'away' } },
  ],
  state: { id: 5, short_name: 'FT', name: 'Full Time', state: 'FT' },
  league: { id: 301, name: 'Ligue 1' },
  venue: { id: 1, name: 'Stade Bollaert-Delelis' },
  formations: [
    { participant_id: 44, formation: '3-4-2-1' },
    { participant_id: 85, formation: '4-3-3' },
  ],
  lineups: [
    {
      id: 1,
      player_id: 1001,
      team_id: 44,
      player_name: 'Brice Samba',
      jersey_number: 30,
      formation_field: '1:1',
      formation_position: 1,
      type_id: 11,
      player: {
        id: 1001,
        name: 'Brice Samba',
        image_path: 'https://cdn.sportmonks.com/images/soccer/players/1/1001.png',
      },
      details: [
        { type_id: 118, data: { value: 6.4 } },
        { type_id: 119, data: { value: 90 } },
      ],
      xglineup: [{ type_id: 5304, data: { value: 0.01 } }],
    },
    {
      id: 2,
      player_id: 1002,
      team_id: 44,
      player_name: 'Jonathan Gradit',
      jersey_number: 24,
      formation_field: '2:2',
      formation_position: 3,
      type_id: 11,
      player: { id: 1002, name: 'Jonathan Gradit', image_path: null },
      details: [
        { type_id: 118, data: { value: 6.1 } },
        { type_id: 119, data: { value: 90 } },
        { type_id: 42, data: { value: 0 } },
      ],
    },
    {
      id: 3,
      player_id: 2001,
      team_id: 85,
      player_name: 'Gianluigi Donnarumma',
      jersey_number: 1,
      formation_field: '1:1',
      formation_position: 1,
      type_id: 11,
      captain: true,
      player: {
        id: 2001,
        name: 'Gianluigi Donnarumma',
        image_path: 'https://cdn.sportmonks.com/images/soccer/players/1/2001.png',
      },
      details: [
        { type_id: 118, data: { value: 7.2 } },
        { type_id: 119, data: { value: 90 } },
      ],
    },
    {
      id: 4,
      player_id: 2002,
      team_id: 85,
      player_name: 'Ousmane Dembélé',
      jersey_number: 10,
      formation_field: '3:2',
      formation_position: 10,
      type_id: 11,
      player: {
        id: 2002,
        name: 'Ousmane Dembélé',
        image_path: 'https://cdn.sportmonks.com/images/soccer/players/10/2002.png',
      },
      details: [
        { type_id: 118, data: { value: 8.1 } },
        { type_id: 119, data: { value: 85 } },
        { type_id: 52, data: { value: 1 } },
        { type_id: 42, data: { value: 3 } },
      ],
      xglineup: [{ type_id: 5304, data: { value: 0.42 } }],
    },
    {
      id: 5,
      player_id: 2003,
      team_id: 85,
      player_name: 'Lee Kang-in',
      jersey_number: 19,
      formation_field: null,
      type_id: 12,
      player: { id: 2003, name: 'Lee Kang-in' },
      details: [{ type_id: 119, data: { value: 12 } }],
    },
  ],
  xgfixture: [
    {
      type_id: 5304,
      participant_id: 44,
      location: 'home',
      data: { value: 0.81 },
      type: { id: 5304, name: 'Expected Goals (xG)', code: 'expected-goals' },
    },
    {
      type_id: 5304,
      participant_id: 85,
      location: 'away',
      data: { value: 1.94 },
      type: { id: 5304, name: 'Expected Goals (xG)', code: 'expected-goals' },
    },
    {
      type_id: 5305,
      participant_id: 44,
      location: 'home',
      data: { value: 0.55 },
      type: { id: 5305, name: 'Expected Goals on Target (xGoT)', code: 'expected-goals-on-target' },
    },
    {
      type_id: 5305,
      participant_id: 85,
      location: 'away',
      data: { value: 2.1 },
      type: { id: 5305, name: 'Expected Goals on Target (xGoT)', code: 'expected-goals-on-target' },
    },
  ],
  events: [
    {
      id: 9001,
      minute: 22,
      player_name: 'Ousmane Dembélé',
      participant_id: 85,
      type: { code: 'goal', name: 'Goal' },
    },
    {
      id: 9002,
      minute: 71,
      player_name: 'Vitinha',
      participant_id: 85,
      type: { code: 'goal', name: 'Goal' },
    },
  ],
};

describe('sportmonksMapperRich — Lens/PSG subset', () => {
  it('expose les includes détail Match Center attendus', () => {
    expect(FIXTURE_DETAIL_INCLUDES).toContain('lineups.player');
    expect(FIXTURE_DETAIL_INCLUDES).toContain('lineups.details');
    expect(FIXTURE_DETAIL_INCLUDES).toContain('lineups.xGLineup');
    expect(FIXTURE_DETAIL_INCLUDES).toContain('xGFixture');
    expect(FIXTURE_DETAIL_INCLUDES).toContain('statistics.type');
    expect(FIXTURE_DETAIL_INCLUDES).toContain('venue');
  });

  it('parse formation_field row:col', () => {
    expect(parseFormationField('1:1')).toEqual({ row: 1, col: 1 });
    expect(parseFormationField('3:2')).toEqual({ row: 3, col: 2 });
    expect(parseFormationField(null)).toBeNull();
    expect(parseFormationField('bench')).toBeNull();
  });

  it('mappe score CURRENT + HT, logos, pitch, banc, xG et panneau joueur', () => {
    const match = mapSmFixtureToUnified(LENS_PSG_MINIMAL);

    expect(match.id).toBe('external-sm-19467892');
    expect(match.externalFixtureId).toBe(19467892);
    expect(match.homeTeam.name).toBe('Lens');
    expect(match.awayTeam.name).toBe('Paris Saint Germain');
    expect(match.homeTeam.logoUrl).toContain('44.png');
    expect(match.awayTeam.logoUrl).toContain('85.png');
    expect(match.competition.name).toBe('Ligue 1');
    expect(match.venue).toBe('Stade Bollaert-Delelis');
    expect(match.status).toBe('finished');
    expect(match.score.home).toBe(0);
    expect(match.score.away).toBe(2);
    expect(match.score.halfTimeHome).toBe(0);
    expect(match.score.halfTimeAway).toBe(1);
    expect(match.score.period).toMatch(/Full Time|FT/i);

    const homeStarters = match.lineup?.home?.players.filter((p) => p.role === 'starter') ?? [];
    const awayPlayers = match.lineup?.away?.players ?? [];
    const samba = homeStarters.find((p) => p.name.includes('Samba'));
    const dembele = awayPlayers.find((p) => p.name.includes('Dembélé'));
    const lee = awayPlayers.find((p) => p.name.includes('Lee'));

    expect(samba?.pitchRow).toBe(1);
    expect(samba?.pitchCol).toBe(1);
    expect(samba?.photoUrl).toContain('1001.png');
    expect(samba?.rating).toBe(6.4);
    expect(samba?.minutes).toBe(90);
    expect(samba?.xg).toBe(0.01);

    expect(dembele?.pitchRow).toBe(3);
    expect(dembele?.pitchCol).toBe(2);
    expect(dembele?.goals).toBe(1);
    expect(dembele?.shots).toBe(3);
    expect(dembele?.xg).toBe(0.42);
    expect(dembele?.role).toBe('starter');

    expect(lee?.role).toBe('bench');
    expect(lee?.pitchRow ?? null).toBeNull();
    expect(lee?.minutes).toBe(12);

    const donna = awayPlayers.find((p) => p.name.includes('Donnarumma'));
    expect(donna?.captain).toBe(true);

    const xg = match.statistics?.rows.find((r) => r.key === 'xg');
    const xgot = match.statistics?.rows.find((r) => r.key === 'xgot');
    expect(xg?.label).toBe('xG');
    expect(xg?.home).toBe(0.81);
    expect(xg?.away).toBe(1.94);
    expect(xgot?.label).toBe('xGoT');
    expect(xgot?.home).toBe(0.55);
    expect(xgot?.away).toBe(2.1);

    expect(match.events?.[0]?.type).toBe('goal');
    expect(match.events?.[0]?.playerName).toContain('Dembélé');
  });
});
