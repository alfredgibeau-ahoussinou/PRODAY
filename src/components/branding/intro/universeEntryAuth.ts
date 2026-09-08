import type { AuthIntent } from '../../../context/TabNavigationContext';
import type { CarouselPoleId } from '../../../models/CarouselPole';
import type { ProductLineId } from '../../../models/ProductLine';
import type { UserRole } from '../../../models/User';
import {
  brandVariantForProductLine,
  poleAccent,
  poleAccentSoft,
  poleOnAccent,
  type ProDayBrandVariant,
} from '../../../theme/prodayBrand';
import { brandVariantForCarouselPole } from './universePoleBrand';
import { UNIVERSE_ACCENT } from './universeIntroAccents';

export type PoleAuthPalette = {
  variant: ProDayBrandVariant;
  /** Remplissage CTA / kicker. */
  accent: string;
  accentSoft: string;
  /** Texte / icône sur fond accent. */
  onAccent: string;
};

/**
 * Palette auth / inscription = accent du pôle choisi (jamais forcer le vert Club).
 */
export function resolvePoleAuthPalette(opts: {
  pole?: CarouselPoleId | null;
  productLine?: ProductLineId | null;
  role?: UserRole | null;
}): PoleAuthPalette {
  const variant: ProDayBrandVariant = opts.pole
    ? brandVariantForCarouselPole(opts.pole)
    : brandVariantForProductLine(opts.productLine, {
        role: opts.role,
        sponsor: opts.role === 'sponsor' || opts.productLine === 'sponsor',
      });

  // Priorité : accent carousel officiel si pôle connu
  const fromCarousel =
    opts.pole && UNIVERSE_ACCENT[opts.pole] ? UNIVERSE_ACCENT[opts.pole] : null;

  return {
    variant,
    accent: fromCarousel || poleAccent(variant),
    accentSoft: poleAccentSoft(variant, 0.18),
    onAccent: poleOnAccent(variant),
  };
}

/**
 * Accent CTA carousel — blanc joueur illisible en pastille → or master pour le chrome.
 * Les autres pôles gardent leur couleur brand.
 */
export function resolveUniverseCtaAccent(pole: CarouselPoleId): string {
  const raw = UNIVERSE_ACCENT[pole];
  if (!raw || raw.toUpperCase() === '#FFFFFF') return '#C5A059';
  return raw;
}

/**
 * Après « Entrer dans [pôle] » sans session :
 * → intent `signup` = écran choix (créer un compte / se connecter), pas login forcé.
 * Admin non autorisé → login VIP.
 */
export function resolveGuestAuthIntentAfterUniverse(opts: {
  pole: CarouselPoleId;
  hasProfile: boolean;
  isPlatformAdmin: boolean;
}): AuthIntent | null {
  if (opts.pole === 'admin') {
    if (opts.isPlatformAdmin) return null;
    return 'login';
  }
  if (opts.hasProfile) return null;
  return 'signup';
}
