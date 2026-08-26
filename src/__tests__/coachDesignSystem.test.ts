import {
  coachChrome,
  coachContentWidth,
} from '../features/coach/theme/coachDesignSystem';

describe('coachDesignSystem breakpoints', () => {
  it('masque le dock et active la sidebar dès 900px', () => {
    expect(coachChrome.wideBreakpoint).toBe(900);
    expect(coachChrome.sidebarWidth).toBe(248);
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

  it('borne la largeur de contenu hors sidebar', () => {
    expect(coachContentWidth(1920, true)).toBe(1180);
    expect(coachContentWidth(1000, true)).toBe(1000 - coachChrome.sidebarWidth);
    expect(coachContentWidth(390, false)).toBe(390);
  });
});
