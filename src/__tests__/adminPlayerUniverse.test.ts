import {
  suggestAppSpaceForPlayer,
  resolveAdminPlayerAgeGroup,
  resolveAdminPlayerAge,
  adminPlayerIdentityLine,
  editableGenderFromProfile,
} from '../utils/adminPlayerUniverse';
import { userFromFirestore } from '../lib/firestoreMappers';
import type { User } from '../models/User';

describe('adminPlayerUniverse', () => {
  it('suggère AppSpace selon âge × genre', () => {
    expect(suggestAppSpaceForPlayer('men', 'youth')).toBe('under_u13');
    expect(suggestAppSpaceForPlayer('women', 'youth')).toBe('under_u13');
    expect(suggestAppSpaceForPlayer('men', 'teen')).toBe('boys');
    expect(suggestAppSpaceForPlayer('women', 'teen')).toBe('girls');
    expect(suggestAppSpaceForPlayer('men', 'adult')).toBe('men');
    expect(suggestAppSpaceForPlayer('women', 'adult')).toBe('women');
  });

  it('édite seulement men | women', () => {
    expect(editableGenderFromProfile('men')).toBe('men');
    expect(editableGenderFromProfile('women')).toBe('women');
    expect(editableGenderFromProfile('minor')).toBeNull();
    expect(editableGenderFromProfile(undefined)).toBeNull();
  });
});

describe('userFromFirestore — birth_date + admin identity', () => {
  const base = {
    display_name: 'Léa',
    email: 'lea@test.com',
    role: 'player',
    product_line: 'amateur',
    created_at: new Date('2026-01-01'),
    updated_at: new Date('2026-01-02'),
  };

  it('mappe profile.birth_date depuis Firestore', () => {
    const u = userFromFirestore('u1', {
      ...base,
      profile: { gender: 'women', birth_date: '2016-05-20', age: 10 },
    });
    expect(u.profile.birth_date).toBe('2016-05-20');
    expect(u.profile.gender).toBe('women');
    expect(resolveAdminPlayerAgeGroup(u)).toBe('youth');
    expect(resolveAdminPlayerAge(u)).toBeGreaterThanOrEqual(9);
    expect(adminPlayerIdentityLine(u)).toContain('Femme');
    expect(adminPlayerIdentityLine(u)).toContain('Monde -13');
  });

  it('résout ado / adulte depuis birth_date', () => {
    const teen = userFromFirestore('u2', {
      ...base,
      profile: { gender: 'men', birth_date: '2011-03-01' },
    });
    expect(resolveAdminPlayerAgeGroup(teen)).toBe('teen');

    const adult = userFromFirestore('u3', {
      ...base,
      profile: { gender: 'women', birth_date: '2000-01-15' },
    });
    expect(resolveAdminPlayerAgeGroup(adult)).toBe('adult');
  });

  it('fallback age si pas de birth_date', () => {
    const u = userFromFirestore('u4', {
      ...base,
      profile: { gender: 'men', age: 15 },
    }) as User;
    expect(u.profile.birth_date).toBeUndefined();
    expect(resolveAdminPlayerAgeGroup(u)).toBe('teen');
  });
});
