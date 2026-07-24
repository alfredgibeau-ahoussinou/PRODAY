import type { UserRole } from '../models/User';
import type { ProductLineId } from '../models/ProductLine';
import { productLineLabel, rolesForProductLine } from '../content/universeRoles';
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

/** Rôles métier compatibles avec l’univers sélectionné en admin. */
export function adminRolesForProductLine(line: ProductLineId): UserRole[] {
  return rolesForProductLine(line);
}

const ROLE_HINTS: Partial<Record<UserRole, string>> = {
  player: 'CV, Mercato, saison',
  coach: 'Staff technique / entraînement',
  club: 'Structure & recrutement',
  agent: 'Mandats & représentation',
  recruiter: 'Scouting & détection',
  organizer: 'Événements & tournois',
  sponsor: 'Marque & campagnes',
  supporter: 'Fan & communauté',
  physio: 'Pôle santé · 7 spécialités',
};

export function adminRoleHint(role: UserRole): string {
  return ROLE_HINTS[role] ?? '';
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

/** Rôles métier proposés à la création / édition admin (tous univers). */
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
