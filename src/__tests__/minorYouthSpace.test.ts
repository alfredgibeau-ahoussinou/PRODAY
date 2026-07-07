import type { User } from '../models/User';
import {
  getSelectableAppSpacesForUser,
  isYouthAppSpace,
  resolveYouthAppSpaceForMinor,
} from '../utils/minorYouthSpace';

const minorBoy = {
  uid: 'm1',
  email: 'minor@test.com',
  display_name: 'Mineur',
  role: 'player',
  profile: { age: 15 },
  parental_settings: {
    is_minor: true,
    supervision_enabled: true,
    contacts_filter_enabled: true,
    screen_time_enabled: false,
    daily_limit_minutes: 90,
    active_days: [],
  },
} as unknown as User;

describe('minorYouthSpace', () => {
  it('identifie les espaces jeunes', () => {
    expect(isYouthAppSpace('boys')).toBe(true);
    expect(isYouthAppSpace('men')).toBe(false);
  });

  it('résout l’espace jeunes selon l’âge', () => {
    expect(resolveYouthAppSpaceForMinor({ ...minorBoy, profile: { age: 11 } }, 'homme')).toBe(
      'under_u13',
    );
    expect(resolveYouthAppSpaceForMinor(minorBoy, 'homme')).toBe('boys');
    expect(
      resolveYouthAppSpaceForMinor(
        { ...minorBoy, profile: { age: 15, gender: 'women' } },
        'amateur',
      ),
    ).toBe('girls');
  });

  it('limite les espaces sélectionnables pour un mineur', () => {
    const spaces = getSelectableAppSpacesForUser(minorBoy, 'homme');
    expect(spaces).toContain('boys');
    expect(spaces).not.toContain('men');
  });
});
