import {
  isStaffRoleHome,
  STAFF_ROLE_HOME_ROLES,
} from '../features/home/roles/roleHomeDashboardRoles';

describe('roleHomeDashboard routing', () => {
  it('expose les rôles staff actifs (sans rôles retirés)', () => {
    expect(STAFF_ROLE_HOME_ROLES).toEqual(['coach', 'club', 'organizer']);
  });

  it('isStaffRoleHome filtre joueur, rôles retirés et sponsor', () => {
    for (const role of STAFF_ROLE_HOME_ROLES) {
      expect(isStaffRoleHome(role)).toBe(true);
    }
    expect(isStaffRoleHome('player')).toBe(false);
    expect(isStaffRoleHome('recruiter')).toBe(false);
    expect(isStaffRoleHome('agent')).toBe(false);
    expect(isStaffRoleHome('physio')).toBe(false);
    expect(isStaffRoleHome('sponsor')).toBe(false);
  });
});
