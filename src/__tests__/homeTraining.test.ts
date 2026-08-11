import {
  DEFAULT_COACHING_COMMISSION,
  splitCoachingPayment,
} from '../models/HomeTraining';
import { filterHomeExercises, HOME_EXERCISE_LIBRARY } from '../content/homeExercises';

describe('home training & hourly coaching', () => {
  it('splits a 30€ session with club commission', () => {
    const split = splitCoachingPayment(30, DEFAULT_COACHING_COMMISSION, true);
    expect(split.proday_eur).toBe(3);
    expect(split.club_eur).toBeCloseTo(2.1, 5);
    expect(split.coach_eur).toBeCloseTo(24.9, 5);
    expect(split.coach_eur + split.proday_eur + split.club_eur).toBeCloseTo(30, 5);
  });

  it('omits club share for independent coaches', () => {
    const split = splitCoachingPayment(30, DEFAULT_COACHING_COMMISSION, false);
    expect(split.club_eur).toBe(0);
    expect(split.proday_eur).toBe(3);
    expect(split.coach_eur).toBe(27);
  });

  it('filters family-mode exercises', () => {
    const family = filterHomeExercises({ mode: 'family' });
    expect(family.length).toBeGreaterThan(0);
    expect(family.every((e) => e.modes.includes('family'))).toBe(true);
  });

  it('exposes equipment on every seed exercise', () => {
    expect(HOME_EXERCISE_LIBRARY.length).toBeGreaterThanOrEqual(5);
    for (const ex of HOME_EXERCISE_LIBRARY) {
      expect(ex.equipment.length).toBeGreaterThan(0);
      expect(ex.instructions.length).toBeGreaterThan(0);
    }
  });
});
