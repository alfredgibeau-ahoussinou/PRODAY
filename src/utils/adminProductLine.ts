import type { UserRole } from '../models/User';
import type { ProductLineId } from '../models/ProductLine';
import { productLineLabel, rolesForProductLine } from '../content/universeRoles';
import { splitLegacyProByRole } from './productLineResolution';
import { isJoueurProductLine } from './playerLevelBadge';

/**
 * Lignes produit gérables dans l’espace admin (pôles actuels).
 * Pôle Joueur unifié : une seule entrée `amateur` (UI « Joueur ») —
 * `pro_player` / legacy homme·woman restent en stockage, filtrés via isJoueurProductLine.
 */
export const ADMIN_PRODUCT_LINES: ProductLineId[] = [
  'amateur',
  'supporter',
  'pro_club',
  'pro_staff',
  'sponsor',
  'sante',
];

/** Libellé admin — préfère « Joueur » pour le pôle unifié (stockage inchangé). */
export function adminProductLineLabel(line: ProductLineId): string {
  if (isJoueurProductLine(line)) return 'Joueur';
  switch (line) {
    case 'supporter':
      return 'Supporter';
    case 'sponsor':
      return 'Sponsor';
    case 'pro_club':
      return 'Pro Club';
    case 'pro_staff':
      return 'Pro Staff';
    case 'sante':
      return 'Santé';
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
