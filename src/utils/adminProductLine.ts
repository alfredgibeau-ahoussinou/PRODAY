import type { UserRole } from '../models/User';
import type { ProductLineId } from '../models/ProductLine';
import { productLineLabel } from '../content/universeRoles';
import { splitLegacyProByRole } from './productLineResolution';

/** Lignes produit gérables dans l’espace admin (pôles actuels). */
export const ADMIN_PRODUCT_LINES: ProductLineId[] = [
  'amateur',
  'supporter',
  'pro_player',
  'pro_club',
  'pro_staff',
  'sponsor',
  'sante',
];

export function adminProductLineLabel(line: ProductLineId): string {
  return productLineLabel(line);
}

/**
 * Déduit la ligne produit à persister quand l’admin change rôle / univers.
 */
export function resolveAdminProductLine(
  role: UserRole,
  preferred?: ProductLineId | null,
): ProductLineId {
  if (role === 'sponsor') return 'sponsor';
  if (role === 'physio') return 'sante';
  if (role === 'supporter') return 'supporter';

  if (role === 'player') {
    if (preferred === 'amateur') return 'amateur';
    return 'pro_player';
  }
  if (role === 'club') return 'pro_club';
  if (role === 'coach' && preferred === 'amateur') return 'amateur';
  if (['coach', 'agent', 'recruiter', 'organizer'].includes(role)) {
    return 'pro_staff';
  }

  return preferred && ADMIN_PRODUCT_LINES.includes(preferred)
    ? preferred
    : splitLegacyProByRole(role);
}

/** Rôles métier proposés à la création / édition admin. */
export const ADMIN_EDIT_ROLES: UserRole[] = [
  'player',
  'coach',
  'club',
  'agent',
  'recruiter',
  'organizer',
  'physio',
  'sponsor',
  'supporter',
];
