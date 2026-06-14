import { Platform } from 'react-native';

/** Hauteur du dock (hors safe area) — mobile avec bouton Reels central. */
export const TAB_BAR_DOCK_HEIGHT = Platform.OS === 'web' ? 44 : 62;

/** Marge basse invité (pas de dock). */
export const GUEST_SCROLL_INSET = 32;

/** Footer sticky inscription (bouton + padding). */
export const SIGNUP_STICKY_FOOTER_HEIGHT = 76;

/** Espace réservé en bas pour le contenu scrollable / plein écran. */
export const TAB_BAR_CONTENT_INSET = Platform.OS === 'web' ? 64 : 84;

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
