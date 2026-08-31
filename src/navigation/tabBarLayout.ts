import { Platform } from 'react-native';

/** Hauteur du dock (hors safe area) — mobile avec bouton Reels central / dock jeu. */
export const TAB_BAR_DOCK_HEIGHT = Platform.OS === 'web' ? 52 : 78;

/** Marge basse invité (pas de dock). */
export const GUEST_SCROLL_INSET = 32;

/** Footer sticky inscription (bouton + padding). */
export const SIGNUP_STICKY_FOOTER_HEIGHT = 76;

/** Espace réservé en bas pour le contenu scrollable / plein écran. */
export const TAB_BAR_CONTENT_INSET = Platform.OS === 'web' ? 72 : 98;

/** Marge droite scrollable — FAB Coach IA joueur (56px) + marge dock. */
export const PLAYER_FAB_CONTENT_INSET = 72;

export interface TabBarInsetOptions {
  guestMode?: boolean;
  stickyFooter?: boolean;
  extra?: number;
}

export function tabBarScrollInset(opts: TabBarInsetOptions = {}): number {
  let inset = opts.guestMode ? GUEST_SCROLL_INSET : TAB_BAR_CONTENT_INSET;
  if (opts.stickyFooter) inset += SIGNUP_STICKY_FOOTER_HEIGHT;
  if (opts.extra) inset += opts.extra;
  return inset;
}
