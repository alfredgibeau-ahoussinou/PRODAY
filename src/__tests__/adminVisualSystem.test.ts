import { ADMIN_TOKENS } from '../features/admin/theme/adminTokens';
import {
  adminChrome,
  adminRadius,
  adminType,
} from '../features/admin/theme/adminDesignSystem';
import { fontFamily } from '../theme/typography';
import { PRODAY_POLE_ACCENTS } from '../theme/prodayBrand';
import { ADMIN_NAV_ITEMS } from '../features/admin/navigation/adminNavConfig';
import { ADMIN_USER_SUBPAGES } from '../features/admin/panes/adminUserSubPages';

describe('Espace Admin visual system', () => {
  it('reste distinct du pôle club (pas émeraude)', () => {
    expect(ADMIN_TOKENS.accent).toBe(PRODAY_POLE_ACCENTS.admin);
    expect(ADMIN_TOKENS.accent).not.toBe(PRODAY_POLE_ACCENTS.club);
    expect(ADMIN_TOKENS.signal).not.toBe(PRODAY_POLE_ACCENTS.club);
    expect(ADMIN_TOKENS.signal).not.toBe(PRODAY_POLE_ACCENTS.president);
  });

  it('utilise Inter pour les titres UI (pas Syne display)', () => {
    expect(adminType.h1.fontFamily).toBe(fontFamily.extrabold);
    expect(adminType.display.fontFamily).toBe(fontFamily.black);
    expect(adminType.stat.fontFamily).toBe(fontFamily.black);
    expect(adminType.brand.fontFamily).toBe(fontFamily.brand);
  });

  it('expose un chrome control room sombre premium', () => {
    expect(ADMIN_TOKENS.bg.startsWith('#0')).toBe(true);
    expect(ADMIN_TOKENS.surface).toBe('#151A24');
    expect(adminChrome.brandMark).toContain('ADMIN');
    expect(adminChrome.dockRailHeight).toBe(0);
    expect(adminRadius.hero).toBeLessThanOrEqual(16);
    expect(ADMIN_NAV_ITEMS.length).toBeGreaterThanOrEqual(28);
  });
});

describe('Admin user detail sub-pages', () => {
  it('couvre profil → danger', () => {
    expect(ADMIN_USER_SUBPAGES).toEqual([
      'profil',
      'roles',
      'clubs',
      'verification',
      'abonnement',
      'activite',
      'danger',
    ]);
  });
});
