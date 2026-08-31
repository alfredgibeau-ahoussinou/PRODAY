/**
 * Chrome partagé grand écran (Expo web / fenêtre large Mac).
 * Pas d’app macOS native — ces breakpoints servent le layout web ≥900.
 */

export const desktopShellChrome = {
  /** Sidebar / rail latéral ; dock bas masqué au-delà. */
  wideBreakpoint: 900,
  /** Tablette / petite fenêtre. */
  tabletBreakpoint: 680,
  /** Largeur max contenu lisible (hors sidebar métier). */
  contentMaxWidth: 1180,
  /** Rail d’onglets vertical (Joueur / défaut web). */
  sideRailWidth: 88,
} as const;

export function isDesktopWideLayout(width: number): boolean {
  return width >= desktopShellChrome.wideBreakpoint;
}

export function desktopContentWidth(windowWidth: number, sideRailVisible: boolean): number {
  const usable = sideRailVisible
    ? windowWidth - desktopShellChrome.sideRailWidth
    : windowWidth;
  return Math.min(usable, desktopShellChrome.contentMaxWidth);
}
