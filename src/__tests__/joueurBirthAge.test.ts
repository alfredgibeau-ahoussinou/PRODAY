jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

import {
  ageYearsAsOf,
  birthDateIsoForAgeGroup,
  isValidPlayerBirthDate,
  joueurAgeGroupFromYears,
  nextAgeGroupTransitionDate,
  resolveJoueurAgeGroupFromBirth,
  toBirthDateIso,
} from '../utils/joueurBirthAge';
import { hydrateJoueurGate, hasJoueurGateComplete } from '../utils/joueurGateStorage';

describe('joueurBirthAge', () => {
  it('computes age relative to calendar (birthday evolution)', () => {
    // Né le 15 mars 2014 → le 14 mars 2026 = 11 ans (youth), le 15 mars 2026 = 12
    const birth = '2014-03-15';
    expect(ageYearsAsOf(birth, new Date(2026, 2, 14))).toBe(11);
    expect(ageYearsAsOf(birth, new Date(2026, 2, 15))).toBe(12);
    expect(resolveJoueurAgeGroupFromBirth(birth, new Date(2026, 2, 14))).toBe('youth');
  });

  it('switches youth → teen at 13th birthday', () => {
    const birth = '2013-08-11';
    // 12 ans la veille
    expect(resolveJoueurAgeGroupFromBirth(birth, new Date(2026, 7, 10))).toBe('youth');
    // 13 ans le jour J
    expect(resolveJoueurAgeGroupFromBirth(birth, new Date(2026, 7, 11))).toBe('teen');
  });

  it('switches teen → adult at 18th birthday', () => {
    const birth = '2008-08-11';
    expect(resolveJoueurAgeGroupFromBirth(birth, new Date(2026, 7, 10))).toBe('teen');
    expect(resolveJoueurAgeGroupFromBirth(birth, new Date(2026, 7, 11))).toBe('adult');
  });

  it('exposes next transition date before 13 / 18', () => {
    const birth = '2014-06-01';
    const next = nextAgeGroupTransitionDate(birth, new Date(2026, 0, 1));
    expect(next).not.toBeNull();
    expect(next!.getFullYear()).toBe(2027); // 13e anniversaire
    expect(next!.getMonth()).toBe(5);
    expect(next!.getDate()).toBe(1);
  });

  it('validates birth dates', () => {
    expect(isValidPlayerBirthDate('2015-01-01', new Date(2026, 0, 1)).ok).toBe(true);
    expect(isValidPlayerBirthDate('2099-01-01', new Date(2026, 0, 1)).ok).toBe(false);
    expect(toBirthDateIso(2014, 2, 30)).toBeNull();
    expect(toBirthDateIso(2014, 2, 28)).toBe('2014-02-28');
  });

  it('maps years to three universes', () => {
    expect(joueurAgeGroupFromYears(12)).toBe('youth');
    expect(joueurAgeGroupFromYears(13)).toBe('teen');
    expect(joueurAgeGroupFromYears(17)).toBe('teen');
    expect(joueurAgeGroupFromYears(18)).toBe('adult');
  });
});

describe('joueurGate birthDate', () => {
  it('requires birthDate for gate completeness', () => {
    expect(
      hasJoueurGateComplete({
        gate: {
          gender: 'men',
          ageGroup: 'youth',
          age: 11,
          completedAt: 'x',
        },
      }),
    ).toBe(false);

    expect(
      hasJoueurGateComplete({
        gate: {
          gender: 'women',
          ageGroup: 'teen',
          age: 15,
          birthDate: '2011-05-01',
          completedAt: 'x',
        },
      }),
    ).toBe(true);
  });

  it('hydrates ageGroup from birthDate over stale ageGroup', () => {
    const live = hydrateJoueurGate(
      {
        gender: 'men',
        ageGroup: 'youth',
        age: 11,
        birthDate: '2008-01-01',
        completedAt: 'x',
      },
      new Date(2026, 5, 1),
    );
    expect(live.ageGroup).toBe('adult');
    expect(live.age).toBe(18);
  });

  it('birthDateIsoForAgeGroup bascule les cockpits admin', () => {
    const asOf = new Date(2026, 7, 11);
    const youth = birthDateIsoForAgeGroup('youth', { asOf });
    const teen = birthDateIsoForAgeGroup('teen', { asOf });
    const adult = birthDateIsoForAgeGroup('adult', { asOf });
    expect(resolveJoueurAgeGroupFromBirth(youth, asOf)).toBe('youth');
    expect(resolveJoueurAgeGroupFromBirth(teen, asOf)).toBe('teen');
    expect(resolveJoueurAgeGroupFromBirth(adult, asOf)).toBe('adult');
    expect(isValidPlayerBirthDate(youth, asOf).ok).toBe(true);
  });
});
