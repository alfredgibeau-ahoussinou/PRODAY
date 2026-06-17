import type { UserRole } from '../models/User';

const PLAYER_ROLES: UserRole[] = ['player'];

export function isPlayerProfileRole(role: UserRole): boolean {
  return PLAYER_ROLES.includes(role);
}
