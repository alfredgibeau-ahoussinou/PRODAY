import {
  clubChrome,
  clubContentWidth,
} from '../features/club/theme/clubDesignSystem';
import {
  desktopContentWidth,
  desktopShellChrome,
  isDesktopWideLayout,
} from '../theme/desktopShellChrome';
import { parentChrome } from '../features/parent/theme/parentDesignSystem';
import { presidentChrome } from '../features/president/theme/presidentDesignSystem';
import { adminChrome } from '../features/admin/theme/adminDesignSystem';

describe('desktopShellChrome', () => {
  it('active le layout grand écran dès 900px', () => {
    expect(desktopShellChrome.wideBreakpoint).toBe(900);
    expect(desktopShellChrome.contentMaxWidth).toBe(1180);
    expect(desktopShellChrome.sideRailWidth).toBe(88);
    expect(isDesktopWideLayout(899)).toBe(false);
    expect(isDesktopWideLayout(900)).toBe(true);
    expect(isDesktopWideLayout(1920)).toBe(true);
  });

  it('borne la largeur de contenu avec rail', () => {
    expect(desktopContentWidth(1920, true)).toBe(1180);
    expect(desktopContentWidth(1000, true)).toBe(1000 - desktopShellChrome.sideRailWidth);
    expect(desktopContentWidth(390, false)).toBe(390);
  });
});

describe('clubChrome desktop', () => {
  it('aligne sidebar + contentMaxWidth sur le coach', () => {
    expect(clubChrome.wideBreakpoint).toBe(900);
    expect(clubChrome.contentMaxWidth).toBe(1180);
    expect(clubContentWidth(1920, true, false)).toBe(1180);
    expect(clubContentWidth(1100, true, false)).toBe(1100 - clubChrome.sidebarExpanded);
  });
});

describe('parent / president / admin breakpoints', () => {
  it('expose des seuils desktop cohérents', () => {
    expect(parentChrome.wideBreakpoint).toBe(900);
    expect(parentChrome.contentMaxWidth).toBe(960);
    expect(presidentChrome.wideBreakpoint).toBe(920);
    expect(presidentChrome.contentMaxWidth).toBe(1180);
    expect(adminChrome.wideBreakpoint).toBe(920);
    expect(adminChrome.contentMax).toBe(1320);
  });
});
