import { userFromFirestore } from '../lib/firestoreMappers';
import { inferGenderFromLegacyUser } from '../utils/playerGender';
import type { User } from '../models/User';

describe('userFromFirestore — profile.gender', () => {
  const base = {
    display_name: 'Alex',
    email: 'alex@test.com',
    role: 'player',
    product_line: 'amateur',
    created_at: new Date('2026-01-01'),
    updated_at: new Date('2026-01-02'),
  };

  it('mappe men | women | minor depuis Firestore', () => {
    expect(
      userFromFirestore('u1', { ...base, profile: { gender: 'women', position: 'Milieu' } }).profile
        .gender,
    ).toBe('women');
    expect(
      userFromFirestore('u2', { ...base, profile: { gender: 'men' } }).profile.gender,
    ).toBe('men');
    expect(
      userFromFirestore('u3', { ...base, profile: { gender: 'minor' } }).profile.gender,
    ).toBe('minor');
  });

  it('ignore les valeurs invalides', () => {
    expect(
      userFromFirestore('u4', { ...base, profile: { gender: 'male' } }).profile.gender,
    ).toBeUndefined();
    expect(userFromFirestore('u5', { ...base, profile: {} }).profile.gender).toBeUndefined();
  });
});

describe('inferGenderFromLegacyUser', () => {
  const base = {
    uid: 'u',
    display_name: 'J',
    email: 'j@test.com',
    role: 'player' as const,
    is_verified: false,
    verification_status: 'NOT_REQUIRED' as const,
    profile: {},
    documents: [],
    created_at: new Date(),
    updated_at: new Date(),
    is_active: true,
  };

  it('ne touche pas un genre déjà déclaré', () => {
    expect(
      inferGenderFromLegacyUser({
        ...base,
        profile: { gender: 'men' },
        product_line: 'woman',
      } as User),
    ).toBeNull();
  });

  it('déduit depuis product_line ou app_space', () => {
    expect(
      inferGenderFromLegacyUser({ ...base, product_line: 'woman' } as User),
    ).toBe('women');
    expect(
      inferGenderFromLegacyUser({ ...base, product_line: 'amateur', app_space: 'girls' } as User),
    ).toBe('women');
    expect(
      inferGenderFromLegacyUser({ ...base, product_line: 'amateur', app_space: 'men' } as User),
    ).toBe('men');
  });
});
