import type { ProductLineId } from './ProductLine';
import type { UserRole } from './User';
import { resolveProProductSegmentFromRole, type ProProductSegment } from './ProductLine';

/**
 * Pôles carousel pré-connexion.
 * Amateur + Pro Joueur → Pôle Joueur unifié (badges de niveau).
 * Nouveau : Pôle Événements (organisateurs).
 */
export type CarouselPoleId =
  | 'joueur'
  | 'supporter'
  | 'pro_club'
  | 'pro_staff'
  | 'evenements'
  | 'sponsor'
  | 'sante'
  /** @deprecated → joueur */
  | 'amateur'
  /** @deprecated → joueur */
  | 'pro_player';

export const CAROUSEL_POLE_ORDER: CarouselPoleId[] = [
  'joueur',
  'supporter',
  'pro_club',
  'pro_staff',
  'evenements',
  'sponsor',
  'sante',
];

export const PRO_SIGNUP_PRESET_ROLE_KEY = 'proday_pro_signup_preset_role';

export function isCarouselProPole(pole: CarouselPoleId): boolean {
  const normalized = normalizeCarouselPole(pole);
  return (
    normalized === 'pro_club' ||
    normalized === 'pro_staff' ||
    normalized === 'evenements'
  );
}

export function normalizeCarouselPole(pole: CarouselPoleId): CarouselPoleId {
  if (pole === 'amateur' || pole === 'pro_player') return 'joueur';
  return pole;
}

export function carouselPoleToProductLine(pole: CarouselPoleId): ProductLineId {
  const normalized = normalizeCarouselPole(pole);
  if (normalized === 'joueur') return 'amateur';
  if (normalized === 'pro_club') return 'pro_club';
  if (normalized === 'pro_staff') return 'pro_staff';
  if (normalized === 'evenements') return 'pro_staff';
  if (normalized === 'sponsor') return 'sponsor';
  return normalized as ProductLineId;
}

export function carouselPoleToProSegment(pole: CarouselPoleId): ProProductSegment | null {
  const normalized = normalizeCarouselPole(pole);
  if (normalized === 'joueur') return 'pro_player';
  if (normalized === 'pro_club') return 'pro_club';
  if (normalized === 'pro_staff' || normalized === 'evenements') return 'pro_staff';
  return null;
}

/** Rôle présélectionné à l'inscription après choix carousel. */
export function carouselPoleSignupPresetRole(pole: CarouselPoleId): UserRole | null {
  switch (normalizeCarouselPole(pole)) {
    case 'joueur':
      return 'player';
    case 'pro_club':
      return 'club';
    case 'pro_staff':
      return 'coach';
    case 'evenements':
      return 'organizer';
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
  if (line === 'pro_player' || line === 'amateur' || line === 'homme' || line === 'woman') {
    return 'joueur';
  }
  if (line === 'pro_club') return 'pro_club';
  if (line === 'pro_staff') {
    if (role === 'organizer') return 'evenements';
    return 'pro_staff';
  }
  if (line === 'pro') {
    const segment = resolveProProductSegmentFromRole(role);
    if (segment === 'pro_club') return 'pro_club';
    if (segment === 'pro_staff') {
      return role === 'organizer' ? 'evenements' : 'pro_staff';
    }
    return 'joueur';
  }
  if (line === 'supporter' || line === 'sante') {
    return line;
  }
  return 'joueur';
}
