import type { User } from '../models/User';
import {
  resolveJoueurAgeGroup,
  resolveJoueurGenderVisual,
  type JoueurAgeGroup,
  type JoueurGenderVisual,
} from '../utils/joueurExperienceTheme';
import {
  JOUEUR_AGE_GENDER_ACCENTS,
  JOUEUR_AGE_MOODS,
} from '../content/joueurPageIdentity';

function makeUser(overrides: Partial<User> & { profile?: Partial<User['profile']> }): User {
  return {
    uid: 'test-uid',
    display_name: 'Lucas Martin',
    email: 'test@proday.fr',
    role: 'player',
    avatar_url: null,
    city: 'Paris',
    is_verified: false,
    profile: {
      position: 'Milieu',
      birth_date: '2000-06-15',
      age: 26,
      gender: 'men',
      jersey_number: 10,
      season_stats: { matches: 12, goals: 5, assists: 8 },
      ...overrides.profile,
    },
    ...overrides,
  } as User;
}

describe('PlayerCard age-adaptive logic', () => {
  const cases: Array<{
    id: string;
    birthDate: string;
    gender: string;
    expectedAge: JoueurAgeGroup;
    expectedGender: JoueurGenderVisual;
  }> = [
    { id: 'youth-boy', birthDate: '2015-03-01', gender: 'men', expectedAge: 'youth', expectedGender: 'male' },
    { id: 'youth-girl', birthDate: '2016-07-20', gender: 'women', expectedAge: 'youth', expectedGender: 'female' },
    { id: 'teen-boy', birthDate: '2010-01-10', gender: 'men', expectedAge: 'teen', expectedGender: 'male' },
    { id: 'teen-girl', birthDate: '2011-11-05', gender: 'women', expectedAge: 'teen', expectedGender: 'female' },
    { id: 'adult-man', birthDate: '2000-06-15', gender: 'men', expectedAge: 'adult', expectedGender: 'male' },
    { id: 'adult-woman', birthDate: '2002-04-22', gender: 'women', expectedAge: 'adult', expectedGender: 'female' },
  ];

  it.each(cases)(
    'resolves $id → ageGroup=$expectedAge, gender=$expectedGender',
    ({ birthDate, gender, expectedAge, expectedGender }) => {
      const ageGroup = resolveJoueurAgeGroup({ birthDate });
      const genderVisual = resolveJoueurGenderVisual(gender);
      expect(ageGroup).toBe(expectedAge);
      expect(genderVisual).toBe(expectedGender);
    },
  );

  it('each age group has distinct mood tokens', () => {
    const groups: JoueurAgeGroup[] = ['youth', 'teen', 'adult'];
    const radii = groups.map((g) => JOUEUR_AGE_MOODS[g].radius);
    expect(new Set(radii).size).toBe(3);
  });

  it('youth has larger radius than adult (softer feel)', () => {
    expect(JOUEUR_AGE_MOODS.youth.radius).toBeGreaterThan(JOUEUR_AGE_MOODS.adult.radius);
  });

  it('each age×gender combo has distinct accent', () => {
    const accents = new Set<string>();
    for (const age of ['youth', 'teen', 'adult'] as const) {
      for (const g of ['male', 'female'] as const) {
        accents.add(JOUEUR_AGE_GENDER_ACCENTS[age][g].accent);
      }
    }
    expect(accents.size).toBe(6);
  });

  it('defaults to adult when no birth_date', () => {
    const group = resolveJoueurAgeGroup({});
    expect(group).toBe('adult');
  });

  it('defaults to neutral when no gender', () => {
    const g = resolveJoueurGenderVisual(undefined);
    expect(g).toBe('neutral');
  });
});

describe('PlayerCard position mapping', () => {
  const positionShort = (pos: string | undefined): string => {
    if (!pos) return '—';
    const p = pos
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
    if (/gardien|goal|gk|gb/.test(p)) return 'GK';
    if (/lateral\s*g|arriere\s*g|dg/.test(p)) return 'DG';
    if (/lateral\s*d|arriere\s*d|dd/.test(p)) return 'DD';
    if (/milieu\s*def|mdc|sentinelle/.test(p)) return 'MDC';
    if (/defens|arriere|cb|dc/.test(p)) return 'DC';
    if (/milieu\s*off|moc|meneur|10/.test(p)) return 'MOC';
    if (/milieu|mid|mc|relayeur/.test(p)) return 'MC';
    if (/ailier\s*g|mg|ag/.test(p)) return 'AG';
    if (/ailier\s*d|md|ad/.test(p)) return 'AD';
    if (/attaqu|buteur|striker|avant|bu/.test(p)) return 'BU';
    return pos.slice(0, 3).toUpperCase();
  };

  const mapping = [
    ['Gardien', 'GK'],
    ['Défenseur central', 'DC'],
    ['Latéral gauche', 'DG'],
    ['Latéral droit', 'DD'],
    ['Milieu défensif', 'MDC'],
    ['Milieu offensif', 'MOC'],
    ['Milieu', 'MC'],
    ['Ailier gauche', 'AG'],
    ['Ailier droit', 'AD'],
    ['Attaquant', 'BU'],
    ['Buteur', 'BU'],
    [undefined, '—'],
  ] as const;

  it.each(mapping)('maps "%s" → "%s"', (input, expected) => {
    expect(positionShort(input as string | undefined)).toBe(expected);
  });
});

describe('PlayerCard theme adaptation per age', () => {
  it('youth card hides form bar and trend', () => {
    const mood = JOUEUR_AGE_MOODS.youth;
    expect(mood.density).toBe('playful');
    expect(mood.motion).toBe('bouncy');
  });

  it('teen card shows HUD density', () => {
    const mood = JOUEUR_AGE_MOODS.teen;
    expect(mood.density).toBe('hud');
    expect(mood.motion).toBe('snappy');
  });

  it('adult card shows pro density', () => {
    const mood = JOUEUR_AGE_MOODS.adult;
    expect(mood.density).toBe('pro');
    expect(mood.motion).toBe('snappy');
  });
});
