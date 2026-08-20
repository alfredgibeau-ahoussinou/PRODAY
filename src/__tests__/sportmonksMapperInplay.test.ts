import {
  LIVE_INPLAY_INCLUDES,
  mapSmFixtureToUnified,
} from '../services/supporterFootball';
import type { SmFixture } from '../services/supporterFootball/mappers';

/**
 * Mini payload inplay (2 équipes + CURRENT + period ticking) — sans secrets.
 * Forme alignée sur Sportmonks v3 `periods` / `scores` / `participants`.
 */
const INPLAY_SAMPLE: SmFixture = {
  id: 19123456,
  starting_at: '2026-08-20 14:00:00',
  starting_at_timestamp: 1755698400,
  state_id: 2,
  league_id: 301,
  season_id: 23621,
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
    { description: 'CURRENT', score: { goals: 1, participant: 'home' } },
    { description: 'CURRENT', score: { goals: 0, participant: 'away' } },
    { description: '1ST_HALF', score: { goals: 1, participant: 'home' } },
    { description: '1ST_HALF', score: { goals: 0, participant: 'away' } },
  ],
  periods: [
    {
      id: 8000001,
      fixture_id: 19123456,
      type_id: 1,
      started: 1755698400,
      ended: null,
      ticking: true,
      sort_order: 1,
      description: '1st-half',
      period_length: 45,
      minutes: 23,
      seconds: 12,
      has_timer: true,
    },
  ],
  events: [
    {
      id: 7001,
      minute: 17,
      player_name: 'Florian Sotoca',
      participant_id: 44,
      type: { code: 'goal', name: 'Goal' },
    },
  ],
  league: {
    id: 301,
    name: 'Ligue 1',
    country: { id: 17, name: 'France' },
  },
  round: { id: 274461, name: '12' },
};

describe('sportmonksMapperInplay — livescores/inplay', () => {
  it('expose les includes LIVE_INPLAY_INCLUDES attendus', () => {
    expect(LIVE_INPLAY_INCLUDES).toBe(
      'participants;scores;periods;events;league.country;round',
    );
  });

  it('mappe participants, score CURRENT, minute/période, ligue+pays, round, events', () => {
    const match = mapSmFixtureToUnified(INPLAY_SAMPLE);

    expect(match.id).toBe('external-sm-19123456');
    expect(match.source).toBe('external');
    expect(match.status).toBe('live');
    expect(match.homeTeam.name).toBe('Lens');
    expect(match.awayTeam.name).toBe('Paris Saint Germain');
    expect(match.score.home).toBe(1);
    expect(match.score.away).toBe(0);
    expect(match.score.minute).toBe(23);
    expect(match.score.period).toBe('1st-half');
    expect(match.competition.name).toBe('Ligue 1');
    expect(match.competition.country).toBe('France');
    expect(match.round).toBe('12');
    expect(match.events).toHaveLength(1);
    expect(match.events?.[0]?.type).toBe('goal');
    expect(match.events?.[0]?.playerName).toContain('Sotoca');
  });
});
