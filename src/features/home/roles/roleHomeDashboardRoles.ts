import type { UserRole } from '../../../models/User';

export const STAFF_ROLE_HOME_ROLES = [
  'coach',
  'club',
  'organizer',
] as const satisfies readonly UserRole[];

export type StaffRoleHomeRole = (typeof STAFF_ROLE_HOME_ROLES)[number];

export function isStaffRoleHome(role: UserRole): role is StaffRoleHomeRole {
  return (STAFF_ROLE_HOME_ROLES as readonly UserRole[]).includes(role);
}
