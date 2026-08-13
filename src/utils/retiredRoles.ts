import type { UserRole } from '../models/User';
import type { ProductLineId } from '../models/ProductLine';

/** Rôles produit retirés — plus d’UI, plus d’inscription. */
export const RETIRED_USER_ROLES: readonly UserRole[] = [
  'agent',
  'recruiter',
  'physio',
] as const;

export function isRetiredUserRole(role?: UserRole | null): boolean {
  return role != null && (RETIRED_USER_ROLES as readonly string[]).includes(role);
}

export function isRetiredProductLine(line?: ProductLineId | null): boolean {
  return line === 'sante';
}
