/** Hauteur approximative du dock d’onglets (hors safe area bas). */
export const TAB_BAR_DOCK_HEIGHT = 56;

/** Marge basse invité (pas de dock). */
export const GUEST_SCROLL_INSET = 32;

/** Footer sticky inscription (bouton + padding). */
export const SIGNUP_STICKY_FOOTER_HEIGHT = 76;

/** Espace réservé en bas (dock + marges + safe area approx.). */
export const TAB_BAR_CONTENT_INSET = 88;

export interface TabBarInsetOptions {
  /** Compte invité : pas de dock d’onglets. */
  guestMode?: boolean;
  /** Bouton fixe au-dessus du dock (parcours inscription). */
  stickyFooter?: boolean;
  /** Marge supplémentaire (ex. spacing.xl). */
  extra?: number;
}

/** `paddingBottom` pour ScrollView sous le dock flottant. */
export function tabBarScrollInset(opts: TabBarInsetOptions = {}): number {
  let inset = opts.guestMode ? GUEST_SCROLL_INSET : TAB_BAR_CONTENT_INSET;
  if (opts.stickyFooter) inset += SIGNUP_STICKY_FOOTER_HEIGHT;
  if (opts.extra) inset += opts.extra;
  return inset;
}
