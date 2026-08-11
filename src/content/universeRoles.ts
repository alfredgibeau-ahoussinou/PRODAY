import type { UserRole } from '../models/User';
import type { ProductLineId } from '../models/ProductLine';
import { isProFamilyLine } from '../utils/productLineResolution';

/** Rôles ProDay Man — joueurs uniquement (foot masculin amateur). */
export const HOMME_PRODUCT_ROLES: UserRole[] = ['player'];

/** Rôles ProDay Woman — joueuses uniquement (foot féminin). */
export const WOMAN_PRODUCT_ROLES: UserRole[] = ['player'];

/** Rôles Pôle Joueur (stockage `amateur`) — joueurs uniquement. Coach → Pro Staff. */
export const AMATEUR_PRODUCT_ROLES: UserRole[] = ['player'];

/** Rôles ProDay Supporter — fans et communauté. */
export const SUPPORTER_PRODUCT_ROLES: UserRole[] = ['supporter'];

/** Rôles Pro joueur. */
export const PRO_PLAYER_PRODUCT_ROLES: UserRole[] = ['player'];

/** Rôles structure club pro. */
export const PRO_CLUB_PRODUCT_ROLES: UserRole[] = ['club'];

/** Rôles staff pro (sans sponsor — pôle Sponsor séparé). */
export const PRO_STAFF_PRODUCT_ROLES: UserRole[] = [
  'coach',
  'agent',
  'recruiter',
  'organizer',
];

/** Rôles Pro Day Sponsor — marques partenaires. */
export const SPONSOR_PRODUCT_ROLES: UserRole[] = ['sponsor'];

/** @deprecated Union legacy `product_line: pro` */
export const PRO_PRODUCT_ROLES: UserRole[] = [
  ...PRO_PLAYER_PRODUCT_ROLES,
  ...PRO_CLUB_PRODUCT_ROLES,
  ...PRO_STAFF_PRODUCT_ROLES,
  ...SPONSOR_PRODUCT_ROLES,
];

/** Rôles ProDay Santé — praticiens médicaux et paramédicaux. */
export const SANTE_PRODUCT_ROLES: UserRole[] = ['physio'];

/** Rôles Portail Parent / Famille. */
export const PARENT_PRODUCT_ROLES: UserRole[] = ['parent'];

export function rolesForProductLine(line: ProductLineId): UserRole[] {
  switch (line) {
    case 'woman':
      return WOMAN_PRODUCT_ROLES;
    case 'amateur':
      return AMATEUR_PRODUCT_ROLES;
    case 'supporter':
      return SUPPORTER_PRODUCT_ROLES;
    case 'pro_player':
      return PRO_PLAYER_PRODUCT_ROLES;
    case 'pro_club':
      return PRO_CLUB_PRODUCT_ROLES;
    case 'pro_staff':
      return PRO_STAFF_PRODUCT_ROLES;
    case 'sponsor':
      return SPONSOR_PRODUCT_ROLES;
    case 'pro':
      return PRO_PRODUCT_ROLES;
    case 'sante':
      return SANTE_PRODUCT_ROLES;
    case 'parent':
      return PARENT_PRODUCT_ROLES;
    default:
      return HOMME_PRODUCT_ROLES;
  }
}

export function isRoleAllowedForProductLine(role: UserRole, line: ProductLineId): boolean {
  return rolesForProductLine(line).includes(role);
}

/**
 * Returns incompatible product lines for a given role to enforce pole exclusivity.
 * Users with a specific role should not be able to access poles meant for other roles.
 */
export function getIncompatibleProductLines(role: UserRole): ProductLineId[] {
  switch (role) {
    case 'coach':
      // Coach = Pro Staff — hors Pôle Joueur / Club
      return ['pro_club', 'amateur', 'homme', 'woman', 'pro_player'];
    case 'club':
      // Club belongs to Club pole, cannot access Staff pole
      return ['pro_staff'];
    case 'agent':
    case 'recruiter':
    case 'organizer':
      // Staff roles belong to Staff pole, cannot access Club pole
      return ['pro_club'];
    case 'player':
      // Players can access both pro_player and amateur, but not staff/club specific poles
      return ['pro_club', 'pro_staff'];
    case 'sponsor':
      // Sponsors have their own pole
      return ['pro_club', 'pro_staff', 'pro_player', 'amateur', 'homme', 'woman'];
    case 'supporter':
      // Supporters have their own pole
      return ['pro_club', 'pro_staff', 'pro_player', 'amateur', 'homme', 'woman', 'sante'];
    case 'physio':
      // Health practitioners have their own pole
      return ['pro_club', 'pro_staff', 'pro_player', 'amateur', 'homme', 'woman', 'supporter'];
    case 'parent':
      return [
        'pro_club',
        'pro_staff',
        'pro_player',
        'amateur',
        'homme',
        'woman',
        'supporter',
        'sante',
        'sponsor',
      ];
    default:
      return [];
  }
}

/**
 * Checks if a user with a given role can access a specific product line.
 * This enforces pole exclusivity by blocking incompatible poles.
 */
export function canAccessProductLine(role: UserRole, line: ProductLineId): boolean {
  const incompatible = getIncompatibleProductLines(role);
  if (incompatible.includes(line)) return false;
  return isRoleAllowedForProductLine(role, line);
}

export function defaultRoleForProductLine(
  line: ProductLineId,
  presetRole?: UserRole | null,
): UserRole {
  if (presetRole && isRoleAllowedForProductLine(presetRole, line)) return presetRole;
  if (line === 'pro_player') return 'player';
  if (line === 'pro_club') return 'club';
  if (line === 'sponsor') return 'sponsor';
  if (line === 'pro' || line === 'pro_staff') return 'coach';
  if (line === 'sante') return 'physio';
  if (line === 'amateur') return 'player';
  if (line === 'supporter') return 'supporter';
  if (line === 'parent') return 'parent';
  return 'player';
}

export function productLineLabel(line: ProductLineId): string {
  switch (line) {
    case 'woman':
      return 'ProDay Woman';
    case 'amateur':
      return 'Pro Day Joueur';
    case 'supporter':
      return 'Pro Day Supporter';
    case 'sponsor':
      return 'Pro Day Sponsor';
    case 'pro_player':
      return 'Pro Day Joueur';
    case 'pro_club':
      return 'Pro Day Club';
    case 'pro_staff':
      return 'Pro Day Coach';
    case 'pro':
      return 'Pro Day Pro';
    case 'sante':
      return 'Pro Day Santé';
    case 'parent':
      return 'Pro Day Parent';
    default:
      return 'Pro Day Man';
  }
}

/** Ligne d’inscription à partir du carousel ou preset (hors legacy homme/woman). */
export function resolveSignupProductLine(
  carouselOrContextLine: ProductLineId,
  role: UserRole,
): ProductLineId {
  if (role === 'sponsor' || carouselOrContextLine === 'sponsor') return 'sponsor';
  // Coach n’appartient plus au Pôle Joueur / Amateur — toujours Staff.
  if (
    role === 'coach' &&
    (carouselOrContextLine === 'amateur' ||
      carouselOrContextLine === 'homme' ||
      carouselOrContextLine === 'woman' ||
      carouselOrContextLine === 'pro_player')
  ) {
    return 'pro_staff';
  }
  if (carouselOrContextLine === 'pro_player' || carouselOrContextLine === 'pro_club' || carouselOrContextLine === 'pro_staff') {
    return carouselOrContextLine;
  }
  if (carouselOrContextLine === 'pro' || isProFamilyLine(carouselOrContextLine)) {
    if (role === 'club') return 'pro_club';
    if (role === 'player') return 'pro_player';
    if (['coach', 'agent', 'recruiter', 'organizer'].includes(role)) {
      return 'pro_staff';
    }
  }
  return carouselOrContextLine;
}
