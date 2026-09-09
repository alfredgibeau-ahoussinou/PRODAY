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

/** Ordre de navigation pour forward/back (dock + menu) — Cockpit Total. */
export const ADMIN_MOTION_SECTION_ORDER: AdminNavSectionId[] = [
  'tour',
  'clubs',
  'identite',
  'utilisateurs',
  'menu',
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
