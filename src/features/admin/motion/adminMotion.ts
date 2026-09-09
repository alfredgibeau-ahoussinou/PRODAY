import type { AdminNavSectionId } from '../navigation/adminNavConfig';
import {
  prodayMotion,
  navDirectionFromOrder,
  type NavDirection,
} from '../../../motion';

/**
 * Motion Admin — consomme ProDayMotionSystem.
 */
export const adminMotion = prodayMotion;

/** Ordre rail Bureau Ops (Pulse → File → Annuaire → Comptes → Effectifs → Tableaux). */
export const ADMIN_MOTION_SECTION_ORDER: AdminNavSectionId[] = [
  'pulse',
  'file',
  'annuaire',
  'comptes',
  'effectifs',
  'classements',
];

export type AdminNavDirection = NavDirection;

export function adminNavDirection(
  from: AdminNavSectionId,
  to: AdminNavSectionId,
): AdminNavDirection {
  return navDirectionFromOrder(ADMIN_MOTION_SECTION_ORDER, from, to);
}
