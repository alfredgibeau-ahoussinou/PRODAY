import type { AdminNavSectionId } from '../navigation/adminNavConfig';
import {
  prodayMotion,
  navDirectionFromOrder,
  type NavDirection,
} from '../../../motion';

/**
 * Motion Admin — consomme ProDayMotionSystem (plus de silo tokens).
 */
export const adminMotion = prodayMotion;

/** Ordre de navigation pour forward/back (dock + menu). */
export const ADMIN_MOTION_SECTION_ORDER: AdminNavSectionId[] = [
  'accueil',
  'commercial',
  'clubs',
  'menu',
  'ia',
  'plateforme',
  'utilisateurs',
  'finances',
  'produit',
  'support',
  'securite',
  'systeme',
];

export type AdminNavDirection = NavDirection;

export function adminNavDirection(
  from: AdminNavSectionId,
  to: AdminNavSectionId,
): AdminNavDirection {
  return navDirectionFromOrder(ADMIN_MOTION_SECTION_ORDER, from, to);
}
