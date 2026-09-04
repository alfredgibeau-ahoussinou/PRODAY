/**
 * Chrome / layout Pôle Coach — breakpoints partagés (shell, scroll, grilles, modales).
 * Desktop : rail étroit collé à gauche (collapsed par défaut), pas un menu mobile élargi.
 */

export const coachChrome = {
  /** Sidebar + contenu côte à côte ; dock masqué au-delà. */
  wideBreakpoint: 900,
  /** Tablette / petite fenêtre desktop. */
  tabletBreakpoint: 680,
  /** Rail icônes — slim, collé à gauche (76 px aligné pôle club). */
  sidebarCollapsed: 76,
  /** Menu labels — borné 72–220. */
  sidebarExpanded: 200,
  /** Alias expanded (rétrocompat). */
  sidebarWidth: 200,
  /** Largeur max contenu lisible (dashboard / listes). */
  contentMaxWidth: 1180,
  /** Grille dashboard : 1 → 2 → 3 → 4 colonnes. */
  dashboardCols: (width: number): 1 | 2 | 3 | 4 => {
    if (width >= 1600) return 4;
    if (width >= 1366) return 3;
    if (width >= 900) return 2;
    return 1;
  },
  /** Grille outils Menu. */
  menuToolCols: (width: number): 2 | 3 | 4 => {
    if (width >= 1440) return 4;
    if (width >= 1100) return 3;
    return 2;
  },
  /** Modales : bottom sheet mobile / panneau centré desktop. */
  modalIsSheet: (width: number) => width < 900,
} as const;

export const coachLayout = {
  pageGutter: 20,
  sectionGap: 16,
  contentTop: 12,
  dockClearance: 72,
} as const;

export function coachContentWidth(
  windowWidth: number,
  sidebarVisible: boolean,
  sidebarCollapsed = true,
): number {
  const sidebarW = sidebarCollapsed
    ? coachChrome.sidebarCollapsed
    : coachChrome.sidebarExpanded;
  const usable = sidebarVisible ? windowWidth - sidebarW : windowWidth;
  return Math.min(usable, coachChrome.contentMaxWidth);
}
