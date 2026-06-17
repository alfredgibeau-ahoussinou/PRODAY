import {
  isMentalCoachSpecialty,
  matchesHealthPoleFilter,
  matchesHealthPoleGroup,
} from '../utils/healthPoleSpecialties';

describe('healthPoleSpecialties', () => {
  it('détecte le coach mental', () => {
    expect(isMentalCoachSpecialty('Coach mental / préparateur mental')).toBe(true);
    expect(isMentalCoachSpecialty('Kinésithérapeute du sport')).toBe(false);
  });

  it('filtre par groupe pôle', () => {
    expect(matchesHealthPoleGroup('Kinésithérapeute du sport', 'kine_osteo')).toBe(true);
    expect(matchesHealthPoleGroup('Ostéopathe', 'kine_osteo')).toBe(true);
    expect(matchesHealthPoleGroup('Médecin du sport', 'kine_osteo')).toBe(false);
    expect(matchesHealthPoleGroup('Médecin du sport', 'medecin_prepa')).toBe(true);
    expect(matchesHealthPoleGroup('Préparateur physique', 'medecin_prepa')).toBe(true);
    expect(matchesHealthPoleGroup('Coach mental / préparateur mental', 'mental')).toBe(true);
    expect(matchesHealthPoleGroup('Nutritionniste sportif', 'nutrition')).toBe(true);
    expect(matchesHealthPoleGroup('Podologue du sport', 'podologie')).toBe(true);
    expect(matchesHealthPoleGroup('Podologue du sport', 'nutrition')).toBe(false);
    expect(matchesHealthPoleGroup('Nutritionniste sportif', 'mental')).toBe(false);
    expect(matchesHealthPoleGroup('Coach mental / préparateur mental', 'nutrition')).toBe(false);
  });

  it('filtre par id annuaire', () => {
    expect(matchesHealthPoleFilter('Coach mental / préparateur mental', 'mental')).toBe(true);
    expect(matchesHealthPoleFilter('Nutritionniste sportif', 'nutrition')).toBe(true);
    expect(matchesHealthPoleFilter('Podologue du sport', 'podologie')).toBe(true);
    expect(matchesHealthPoleFilter('Kinésithérapeute du sport', 'mental')).toBe(false);
    expect(matchesHealthPoleFilter('Kinésithérapeute du sport', 'kine_osteo')).toBe(true);
    expect(matchesHealthPoleFilter(undefined, 'all')).toBe(true);
  });
});
