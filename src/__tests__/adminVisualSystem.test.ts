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

  it('expose un chrome Apple sombre premium', () => {
    expect(ADMIN_TOKENS.bg.startsWith('#0')).toBe(true);
    expect(ADMIN_TOKENS.surface).toBe('#161922');
    expect(ADMIN_TOKENS.accentHot).toBe('#0A84FF');
    expect(adminChrome.brandMark).toContain('ADMIN');
    expect(adminChrome.dockRailHeight).toBe(0);
    expect(adminRadius.hero).toBeLessThanOrEqual(16);
    expect(ADMIN_NAV_ITEMS.length).toBeGreaterThanOrEqual(28);
  });

  it('expose des primitives page unifiées', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const src = require('fs').readFileSync(
      require('path').join(__dirname, '../features/admin/ui/adminUi.tsx'),
      'utf8',
    ) as string;
    expect(src).toContain('export function AdminEntityRow');
    expect(src).toContain('export function AdminSearchField');
    expect(src).toContain('export function AdminEmptyState');
    expect(src).toContain('export function AdminMetricTile');
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
