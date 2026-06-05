import {
  isMentalCoachSpecialty,
  matchesHealthPoleFilter,
} from '../utils/healthPoleSpecialties';

describe('healthPoleSpecialties', () => {
  it('détecte le coach mental', () => {
    expect(isMentalCoachSpecialty('Coach mental / préparateur mental')).toBe(true);
    expect(isMentalCoachSpecialty('Kinésithérapeute du sport')).toBe(false);
  });

  it('filtre par spécialité', () => {
    expect(matchesHealthPoleFilter('Coach mental / préparateur mental', 'mental')).toBe(true);
    expect(matchesHealthPoleFilter('Kinésithérapeute du sport', 'mental')).toBe(false);
    expect(matchesHealthPoleFilter('Kinésithérapeute du sport', 'kine')).toBe(true);
    expect(matchesHealthPoleFilter(undefined, 'all')).toBe(true);
  });
});
