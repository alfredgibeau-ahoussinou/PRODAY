import type { AdminNavSectionId } from '../navigation/adminNavConfig';
import {
  prodayMotion,
  navDirectionFromOrder,
  type NavDirection,
} from '../../../motion';
import { ADMIN_NAV_ITEMS } from '../navigation/adminNavConfig';

export const adminMotion = prodayMotion;

/** Ordre menu Espace Admin (scroll · 30+ pages). */
export const ADMIN_MOTION_SECTION_ORDER: AdminNavSectionId[] = ADMIN_NAV_ITEMS.map((n) => n.id);

export type AdminNavDirection = NavDirection;

export function adminNavDirection(
  from: AdminNavSectionId,
  to: AdminNavSectionId,
): AdminNavDirection {
  return navDirectionFromOrder(ADMIN_MOTION_SECTION_ORDER, from, to);
}
