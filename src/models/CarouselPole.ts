import type { ProductLineId } from './ProductLine';
import type { UserRole } from './User';
import { resolveProProductSegmentFromRole, type ProProductSegment } from './ProductLine';

/** Pôles affichés au carousel pré-connexion (doc architecture §14). */
export type CarouselPoleId =
  | 'amateur'
  | 'supporter'
  | 'pro_player'
  | 'pro_club'
  | 'pro_staff'
  | 'sponsor'
  | 'sante';

export const CAROUSEL_POLE_ORDER: CarouselPoleId[] = [
  'amateur',
  'supporter',
  'pro_player',
  'pro_club',
  'pro_staff',
  'sponsor',
  'sante',
];

export const PRO_SIGNUP_PRESET_ROLE_KEY = 'proday_pro_signup_preset_role';

export function isCarouselProPole(pole: CarouselPoleId): boolean {
  return pole === 'pro_player' || pole === 'pro_club' || pole === 'pro_staff';
}

export function carouselPoleToProductLine(pole: CarouselPoleId): ProductLineId {
  if (pole === 'pro_player') return 'pro_player';
  if (pole === 'pro_club') return 'pro_club';
  if (pole === 'pro_staff') return 'pro_staff';
  if (pole === 'sponsor') return 'sponsor';
  return pole as ProductLineId;
}

export function carouselPoleToProSegment(pole: CarouselPoleId): ProProductSegment | null {
  if (pole === 'pro_player') return 'pro_player';
  if (pole === 'pro_club') return 'pro_club';
  if (pole === 'pro_staff') return 'pro_staff';
  return null;
}

/** Rôle présélectionné à l'inscription après choix carousel Pro / Sponsor. */
export function carouselPoleSignupPresetRole(pole: CarouselPoleId): UserRole | null {
  switch (pole) {
    case 'pro_player':
      return 'player';
    case 'pro_club':
      return 'club';
    case 'pro_staff':
      return 'coach';
    case 'sponsor':
      return 'sponsor';
    default:
      return null;
  }
}

/** Mappe la ligne stockée + rôle vers le pôle carousel (réouverture manuelle). */
export function productLineToCarouselPole(
  line: ProductLineId,
  role?: UserRole | null,
): CarouselPoleId {
  if (line === 'sponsor') return 'sponsor';
  if (line === 'pro_player') return 'pro_player';
  if (line === 'pro_club') return 'pro_club';
  if (line === 'pro_staff') return 'pro_staff';
  if (line === 'pro') {
    const segment = resolveProProductSegmentFromRole(role);
    if (segment === 'pro_club') return 'pro_club';
    if (segment === 'pro_staff') return 'pro_staff';
    return 'pro_player';
  }
  if (line === 'amateur' || line === 'supporter' || line === 'sante') {
    return line;
  }
  return 'amateur';
}
