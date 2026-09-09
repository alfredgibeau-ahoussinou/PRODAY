import { ADMIN_TOKENS } from '../features/admin/theme/adminTokens';
import {
  adminChrome,
  adminRadius,
  adminType,
} from '../features/admin/theme/adminDesignSystem';
import { fontFamily } from '../theme/typography';
import { PRODAY_POLE_ACCENTS } from '../theme/prodayBrand';

describe('Bureau Ops visual system', () => {
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

  it('expose un chrome Bureau Ops clair (pas void sombre)', () => {
    expect(ADMIN_TOKENS.bg.startsWith('#E')).toBe(true);
    expect(ADMIN_TOKENS.surface).toBe('#FFFFFF');
    expect(adminChrome.brandMark).toContain('BUREAU');
    expect(adminChrome.dockRailHeight).toBe(0);
    expect(adminRadius.hero).toBeLessThanOrEqual(12);
  });
});
