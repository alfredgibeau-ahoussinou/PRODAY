import {
  coachChrome,
  coachContentWidth,
} from '../features/coach/theme/coachDesignSystem';

describe('coachDesignSystem breakpoints', () => {
  it('masque le dock et active la sidebar dès 900px', () => {
    expect(coachChrome.wideBreakpoint).toBe(900);
    expect(coachChrome.sidebarCollapsed).toBe(56);
    expect(coachChrome.sidebarExpanded).toBe(200);
    expect(coachChrome.sidebarWidth).toBe(200);
    expect(coachChrome.contentMaxWidth).toBe(1180);
  });

  it('adapte les colonnes dashboard et menu aux largeurs desktop', () => {
    expect(coachChrome.dashboardCols(390)).toBe(1);
    expect(coachChrome.dashboardCols(1024)).toBe(2);
    expect(coachChrome.dashboardCols(1366)).toBe(3);
    expect(coachChrome.dashboardCols(1600)).toBe(4);
    expect(coachChrome.dashboardCols(1920)).toBe(4);

    expect(coachChrome.menuToolCols(390)).toBe(2);
    expect(coachChrome.menuToolCols(1100)).toBe(3);
    expect(coachChrome.menuToolCols(1440)).toBe(4);
  });

  it('utilise bottom sheet mobile et panneau desktop pour les modales', () => {
    expect(coachChrome.modalIsSheet(390)).toBe(true);
    expect(coachChrome.modalIsSheet(1366)).toBe(false);
  });

  it('borne la largeur de contenu hors sidebar (rail étroit par défaut)', () => {
    expect(coachContentWidth(1920, true, true)).toBe(1180);
    expect(coachContentWidth(1000, true, true)).toBe(1000 - coachChrome.sidebarCollapsed);
    expect(coachContentWidth(1000, true, false)).toBe(1000 - coachChrome.sidebarExpanded);
    expect(coachContentWidth(390, false)).toBe(390);
  });
});
