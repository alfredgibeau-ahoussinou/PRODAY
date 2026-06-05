import type { UserRole } from '../models/User';
import type { ProductLineId } from '../models/ProductLine';

/** Rôles ProDay Man — joueurs uniquement (foot masculin amateur). */
export const HOMME_PRODUCT_ROLES: UserRole[] = ['player'];

/** Rôles ProDay Woman — joueuses uniquement (foot féminin). */
export const WOMAN_PRODUCT_ROLES: UserRole[] = ['player'];

/** Rôles ProDay Pro — staff, structures, santé et partenaires. */
export const PRO_PRODUCT_ROLES: UserRole[] = [
  'coach',
  'agent',
  'recruiter',
  'physio',
  'sponsor',
  'club',
  'organizer',
];

export function rolesForProductLine(line: ProductLineId): UserRole[] {
  switch (line) {
    case 'woman':
      return WOMAN_PRODUCT_ROLES;
    case 'pro':
      return PRO_PRODUCT_ROLES;
    default:
      return HOMME_PRODUCT_ROLES;
  }
}

export function isRoleAllowedForProductLine(role: UserRole, line: ProductLineId): boolean {
  return rolesForProductLine(line).includes(role);
}

export function defaultRoleForProductLine(line: ProductLineId): UserRole {
  if (line === 'pro') return 'coach';
  return 'player';
}

export function productLineLabel(line: ProductLineId): string {
  switch (line) {
    case 'woman':
      return 'ProDay Woman';
    case 'pro':
      return 'Pro Day Pro';
    default:
      return 'Pro Day Man';
  }
}
