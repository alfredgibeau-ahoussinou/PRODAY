import type { Club } from '../models/Club';
import type { User } from '../models/User';
import {
  adminRoleOptionFromUser,
  adminRoleOptionLabel,
  adminUserMatchesRoleFilter,
  isAdminPresidentUser,
  persistedUserRoleFromAdminOption,
} from '../utils/adminPresidentRole';

function user(partial: Partial<User> & Pick<User, 'uid' | 'role'>): User {
  return {
    email: partial.email ?? 'u@test.com',
    display_name: partial.display_name ?? 'Test',
    created_at: new Date(),
    updated_at: new Date(),
    profile: partial.profile ?? {},
    ...partial,
  } as User;
}

function club(partial: Pick<Club, 'id' | 'owner_uid'> & Partial<Club>): Club {
  return {
    name: partial.name ?? 'FC Test',
    city: partial.city ?? 'Paris',
    verified: true,
    created_at: new Date(),
    updated_at: new Date(),
    ...partial,
  } as Club;
}

describe('adminPresidentRole', () => {
  const owner = user({ uid: 'owner1', role: 'club', profile: { club_id: 'c1' } });
  const staff = user({ uid: 'staff1', role: 'club', profile: { club_id: 'c1' } });
  const coach = user({ uid: 'coach1', role: 'coach', profile: { club_id: 'c1' } });
  const clubs = [club({ id: 'c1', owner_uid: 'owner1' })];

  it('détecte le président via owner_uid (pas un UserRole dédié)', () => {
    expect(isAdminPresidentUser(owner, clubs)).toBe(true);
    expect(isAdminPresidentUser(staff, clubs)).toBe(false);
    expect(isAdminPresidentUser(coach, clubs)).toBe(false);
    expect(adminRoleOptionFromUser(owner, clubs)).toBe('president');
    expect(adminRoleOptionFromUser(staff, clubs)).toBe('club');
    expect(persistedUserRoleFromAdminOption('president')).toBe('club');
    expect(adminRoleOptionLabel('president')).toBe('Président');
  });

  it('filtre Présidents vs Clubs (staff non-owner)', () => {
    expect(adminUserMatchesRoleFilter(owner, clubs, 'president')).toBe(true);
    expect(adminUserMatchesRoleFilter(staff, clubs, 'president')).toBe(false);
    expect(adminUserMatchesRoleFilter(owner, clubs, 'club')).toBe(false);
    expect(adminUserMatchesRoleFilter(staff, clubs, 'club')).toBe(true);
    expect(adminUserMatchesRoleFilter(coach, clubs, 'coach')).toBe(true);
  });

  it('refuse président sans club lié / owner mismatch', () => {
    const orphan = user({ uid: 'x', role: 'club' });
    expect(isAdminPresidentUser(orphan, clubs)).toBe(false);
    expect(isAdminPresidentUser(owner, [club({ id: 'c1', owner_uid: 'other' })])).toBe(false);
  });
});
