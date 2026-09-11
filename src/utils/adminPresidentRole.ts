import type { Club } from '../models/Club';
import type { User, UserRole } from '../models/User';
import { getRoleLabel } from '../screens/signup/signupFlowConfig';

/**
 * Option de rôle dans l’UI admin adhérents.
 * `president` n’est pas un UserRole Firestore : c’est `club` + owner du club lié.
 */
export type AdminRoleOption = UserRole | 'president';

export const ADMIN_EDITABLE_ROLE_OPTIONS: AdminRoleOption[] = [
  'player',
  'coach',
  'parent',
  'club',
  'president',
  'supporter',
  'sponsor',
  'agent',
  'recruiter',
];

export function findClubForAdminUser(
  user: Pick<User, 'uid' | 'profile'>,
  clubs: Club[],
): Club | null {
  const byOwner = clubs.find((c) => c.owner_uid === user.uid);
  if (byOwner) return byOwner;
  const clubId = user.profile?.club_id;
  if (clubId) return clubs.find((c) => c.id === clubId) ?? null;
  return null;
}

/** Compte président = rôle club + uid === club.owner_uid. */
export function isAdminPresidentUser(
  user: Pick<User, 'uid' | 'role' | 'profile'>,
  clubs: Club[],
): boolean {
  if (user.role !== 'club') return false;
  const club = findClubForAdminUser(user, clubs);
  return !!club && club.owner_uid === user.uid;
}

export function adminRoleOptionFromUser(
  user: Pick<User, 'uid' | 'role' | 'profile'>,
  clubs: Club[],
): AdminRoleOption {
  if (isAdminPresidentUser(user, clubs)) return 'president';
  return user.role;
}

export function adminRoleOptionLabel(option: AdminRoleOption): string {
  if (option === 'president') return 'Président';
  return getRoleLabel(option);
}

/** Rôle Firestore à persister depuis le chip admin. */
export function persistedUserRoleFromAdminOption(option: AdminRoleOption): UserRole {
  return option === 'president' ? 'club' : option;
}

export function adminUserMatchesRoleFilter(
  user: Pick<User, 'uid' | 'role' | 'profile'>,
  clubs: Club[],
  filter: 'all' | AdminRoleOption,
): boolean {
  if (filter === 'all') return true;
  if (filter === 'president') return isAdminPresidentUser(user, clubs);
  if (filter === 'club') {
    return user.role === 'club' && !isAdminPresidentUser(user, clubs);
  }
  return user.role === filter;
}
