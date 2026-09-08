import type { AuthIntent } from '../../context/TabNavigationContext';
import type { CarouselPoleId } from '../../models/CarouselPole';

/** Accent chrome d’entrée unifié — look pôle Club (noir + émeraude). */
export const UNIVERSE_ENTRY_ACCENT = '#10B981';
export const UNIVERSE_ENTRY_ACCENT_SOFT = 'rgba(16, 185, 129, 0.18)';
export const UNIVERSE_ENTRY_INK_ON_ACCENT = '#07100C';

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
