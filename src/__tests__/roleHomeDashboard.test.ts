import {
  isStaffRoleHome,
  STAFF_ROLE_HOME_ROLES,
} from '../features/home/roles/roleHomeDashboardRoles';

describe('roleHomeDashboard routing', () => {
  it('expose les 5 rôles staff dédiés', () => {
    expect(STAFF_ROLE_HOME_ROLES).toEqual([
      'coach',
      'club',
      'recruiter',
      'organizer',
      'agent',
    ]);
  });

  it('isStaffRoleHome filtre joueur, physio et sponsor', () => {
    for (const role of STAFF_ROLE_HOME_ROLES) {
      expect(isStaffRoleHome(role)).toBe(true);
    }
    expect(isStaffRoleHome('player')).toBe(false);
    expect(isStaffRoleHome('physio')).toBe(false);
    expect(isStaffRoleHome('sponsor')).toBe(false);
  });
});
