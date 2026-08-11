import type { ProductLineId } from './ProductLine';
import type { UserRole } from './User';
import { resolveProProductSegmentFromRole, type ProProductSegment } from './ProductLine';

/**
 * Pôles carousel pré-connexion — architecture cible.
 * Vitrine : Joueur · Club · Coach · Parent · Supporter · Sponsor.
 * Santé / Agent / Recruteur / Organisateur = rôles intégrés (pas des pôles).
 */
export type CarouselPoleId =
  | 'joueur'
  | 'supporter'
  | 'pro_club'
  | 'coach'
  | 'parent'
  | 'sponsor'
  | 'sante'
  /** @deprecated → coach */
  | 'pro_staff'
  /** @deprecated → pro_club (organisateurs intégrés au Club) */
  | 'evenements'
  /** @deprecated → joueur */
  | 'amateur'
  /** @deprecated → joueur */
  | 'pro_player';

/** Carousel marketing / choix univers — 6 pôles principaux. */
export const CAROUSEL_SHOWCASE_POLE_ORDER: CarouselPoleId[] = [
  'joueur',
  'pro_club',
  'coach',
  'parent',
  'supporter',
  'sponsor',
];

/** Hors vitrine GTM — rôle médical intégré, page sur invitation. */
export const CAROUSEL_PARKED_POLE_ORDER: CarouselPoleId[] = ['sante'];

/** Catalogue complet (admin / mappings). Préférer SHOWCASE pour l’UI pré-connexion. */
export const CAROUSEL_POLE_ORDER: CarouselPoleId[] = [
  ...CAROUSEL_SHOWCASE_POLE_ORDER,
  ...CAROUSEL_PARKED_POLE_ORDER,
];

export function isCarouselParkedPole(pole: CarouselPoleId): boolean {
  return CAROUSEL_PARKED_POLE_ORDER.includes(normalizeCarouselPole(pole));
}

export function isCarouselShowcasePole(pole: CarouselPoleId): boolean {
  return CAROUSEL_SHOWCASE_POLE_ORDER.includes(normalizeCarouselPole(pole));
}

export const PRO_SIGNUP_PRESET_ROLE_KEY = 'proday_pro_signup_preset_role';

export function isCarouselProPole(pole: CarouselPoleId): boolean {
  const normalized = normalizeCarouselPole(pole);
  return normalized === 'pro_club' || normalized === 'coach';
}

export function normalizeCarouselPole(pole: CarouselPoleId): CarouselPoleId {
  if (pole === 'amateur' || pole === 'pro_player') return 'joueur';
  if (pole === 'pro_staff') return 'coach';
  if (pole === 'evenements') return 'pro_club';
  return pole;
}

export function carouselPoleToProductLine(pole: CarouselPoleId): ProductLineId {
  const normalized = normalizeCarouselPole(pole);
  if (normalized === 'joueur') return 'amateur';
  if (normalized === 'pro_club') return 'pro_club';
  if (normalized === 'coach') return 'pro_staff';
  if (normalized === 'sponsor') return 'sponsor';
  if (normalized === 'parent') return 'parent';
  return normalized as ProductLineId;
}

export function carouselPoleToProSegment(pole: CarouselPoleId): ProProductSegment | null {
  const normalized = normalizeCarouselPole(pole);
  if (normalized === 'joueur') return 'pro_player';
  if (normalized === 'pro_club') return 'pro_club';
  if (normalized === 'coach') return 'pro_staff';
  return null;
}

/** Rôle présélectionné à l'inscription après choix carousel. */
export function carouselPoleSignupPresetRole(pole: CarouselPoleId): UserRole | null {
  switch (normalizeCarouselPole(pole)) {
    case 'joueur':
      return 'player';
    case 'pro_club':
      return 'club';
    case 'coach':
      return 'coach';
    case 'parent':
      return 'parent';
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
  if (line === 'parent') return 'parent';
  if (line === 'pro_player' || line === 'amateur' || line === 'homme' || line === 'woman') {
    return 'joueur';
  }
  if (line === 'pro_club') return 'pro_club';
  if (line === 'pro_staff') {
    // Agent / recruteur / organisateur restent des rôles sous le pôle Coach (écosystème).
    return 'coach';
  }
  if (line === 'pro') {
    const segment = resolveProProductSegmentFromRole(role);
    if (segment === 'pro_club') return 'pro_club';
    if (segment === 'pro_staff') return 'coach';
    return 'joueur';
  }
  if (line === 'supporter' || line === 'sante') {
    return line;
  }
  if (role === 'parent') return 'parent';
  return 'joueur';
}
