import type { UserRole } from '../models/User';
import type { ProductLineId } from '../models/ProductLine';
import { productLineLabel, rolesForProductLine } from '../content/universeRoles';
import { splitLegacyProByRole } from './productLineResolution';
import { isJoueurProductLine } from './playerLevelBadge';

/**
 * Lignes produit gérables dans l’espace admin (pôles actuels).
 * Pôle Joueur unifié : une seule entrée `amateur` (UI « Joueur ») —
 * `pro_player` / legacy homme·woman restent en stockage, filtrés via isJoueurProductLine.
 * Pôle Santé retiré — plus proposé à la création / édition.
 */
export const ADMIN_PRODUCT_LINES: ProductLineId[] = [
  'amateur',
  'supporter',
  'parent',
  'pro_club',
  'pro_staff',
  'sponsor',
];

/** Libellé admin — préfère « Joueur » pour le pôle unifié (stockage inchangé). */
export function adminProductLineLabel(line: ProductLineId): string {
  if (isJoueurProductLine(line)) return 'Joueur';
  switch (line) {
    case 'supporter':
      return 'Supporter';
    case 'parent':
      return 'Parent';
    case 'sponsor':
      return 'Sponsor';
    case 'pro_club':
      return 'Pro Club';
    case 'pro_staff':
      return 'Coach';
    case 'sante':
      return 'Santé (retiré)';
    default:
      return productLineLabel(line);
  }
}

/** Filtre liste admin : le chip Joueur (`amateur`) couvre tout le pôle unifié. */
export function adminUserMatchesProductLineFilter(
  userLine: ProductLineId,
  filterLine: ProductLineId,
): boolean {
  if (isJoueurProductLine(filterLine)) {
    return isJoueurProductLine(userLine);
  }
  return userLine === filterLine;
}

/** Rôles métier compatibles avec l’univers sélectionné en admin. */
export function adminRolesForProductLine(line: ProductLineId): UserRole[] {
  return rolesForProductLine(line).filter(
    (r) => r !== 'physio' && r !== 'agent' && r !== 'recruiter',
  );
}

const ROLE_HINTS: Partial<Record<UserRole, string>> = {
  player: 'CV, Mercato, saison',
  coach: 'Staff technique / entraînement',
  club: 'Structure & recrutement (staff) — Président = owner du club',
  organizer: 'Événements & tournois',
  sponsor: 'Marque & campagnes',
  supporter: 'Fan & communauté',
  parent: 'Supervision · messages · agenda',
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
  // Anciens comptes physio : bascule staff (pôle Santé retiré).
  if (role === 'physio') return 'pro_staff';
  if (role === 'supporter') return 'supporter';
  if (role === 'parent') return 'parent';

  if (role === 'player') {
    if (preferred === 'amateur') return 'amateur';
    return 'pro_player';
  }
  if (role === 'club') return 'pro_club';
  if (role === 'agent' || role === 'recruiter') return 'pro_staff';
  if (['coach', 'organizer'].includes(role)) {
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
  'organizer',
  'sponsor',
  'supporter',
  'parent',
];
