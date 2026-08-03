import {
  averagePulseRating,
  computeMatchPulseRating,
  formatPulseRating,
} from '../utils/prodayMatchRating';
import type { PlayerActivity } from '../models/PlayerActivity';

describe('prodayMatchRating', () => {
  it('scores a strong attacking performance highly', () => {
    const score = computeMatchPulseRating({
      goals: 2,
      assists: 1,
      minutes_played: 90,
      match_result: 'win',
      clean_sheet: false,
      performance_tags_count: 3,
    });
    expect(score).toBeGreaterThanOrEqual(7.5);
    expect(score).toBeLessThanOrEqual(10);
  });

  it('penalizes red cards', () => {
    const clean = computeMatchPulseRating({ goals: 1, minutes_played: 90 });
    const sentOff = computeMatchPulseRating({
      goals: 1,
      minutes_played: 90,
      red_cards: 1,
    });
    expect(sentOff).toBeLessThan(clean);
  });

  it('averages pulse ratings from match activities', () => {
    const activities = [
      { type: 'match', rating_pulse: 8, date: new Date() },
      { type: 'match', rating_pulse: 6, date: new Date() },
      { type: 'training', rating_pulse: 9, date: new Date() },
    ] as PlayerActivity[];
    expect(averagePulseRating(activities)).toBe(7);
    expect(formatPulseRating(7)).toBe('7.0');
  });
});
