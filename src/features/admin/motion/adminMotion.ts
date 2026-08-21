import { Easing } from 'react-native-reanimated';
import type { AdminNavSectionId } from '../navigation/adminNavConfig';

/**
 * Motion design system — Pôle Admin APP uniquement.
 * GPU-friendly (transform / opacity), durées courtes, pas flashy.
 */
export const adminMotion = {
  duration: {
    fast: 140,
    normal: 220,
    slow: 300,
    enter: 240,
    exit: 160,
    modal: 260,
    toast: 180,
    number: 420,
  },
  spring: {
    snappy: { damping: 24, stiffness: 260, mass: 0.65 },
    smooth: { damping: 28, stiffness: 200, mass: 0.75 },
    sheet: { damping: 26, stiffness: 220, mass: 0.8 },
    dock: { damping: 22, stiffness: 280, mass: 0.6 },
  },
  easing: {
    out: Easing.out(Easing.cubic),
    in: Easing.in(Easing.cubic),
    inOut: Easing.inOut(Easing.cubic),
  },
  /** Slide horizontal entre panes (px). */
  paneShift: 28,
  /** Push détail (profondeur). */
  detailShift: 36,
  detailScaleFrom: 0.985,
  /** Overlay sheets. */
  backdrop: 'rgba(0,0,0,0.55)',
  /** Seuil dismiss sheet (px). */
  sheetDismissY: 96,
} as const;

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

export type AdminNavDirection = 1 | -1;

export function adminNavDirection(
  from: AdminNavSectionId,
  to: AdminNavSectionId,
): AdminNavDirection {
  if (from === to) return 1;
  const a = ADMIN_MOTION_SECTION_ORDER.indexOf(from);
  const b = ADMIN_MOTION_SECTION_ORDER.indexOf(to);
  if (a < 0 || b < 0) return 1;
  return b >= a ? 1 : -1;
}
