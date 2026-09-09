import { ADMIN_TOKENS } from '../features/admin/theme/adminTokens';
import {
  adminChrome,
  adminRadius,
  adminType,
} from '../features/admin/theme/adminDesignSystem';
import { fontFamily } from '../theme/typography';
import { PRODAY_POLE_ACCENTS } from '../theme/prodayBrand';

describe('Admin Control Center visual system', () => {
  it('reste distinct du pôle club (pas émeraude)', () => {
    expect(ADMIN_TOKENS.accent).toBe(PRODAY_POLE_ACCENTS.admin);
    expect(ADMIN_TOKENS.accent).not.toBe(PRODAY_POLE_ACCENTS.club);
    expect(ADMIN_TOKENS.signal).not.toBe(PRODAY_POLE_ACCENTS.club);
    expect(ADMIN_TOKENS.signal).not.toBe(PRODAY_POLE_ACCENTS.president);
  });

  it('utilise Inter pour les titres UI (pas Syne display)', () => {
    expect(adminType.h1.fontFamily).toBe(fontFamily.extrabold);
    expect(adminType.display.fontFamily).toBe(fontFamily.extrabold);
    expect(adminType.stat.fontFamily).toBe(fontFamily.extrabold);
    expect(adminType.brand.fontFamily).toBe(fontFamily.brand);
  });

  it('expose un chrome control center sombre', () => {
    expect(ADMIN_TOKENS.bg.startsWith('#0')).toBe(true);
    expect(adminChrome.brandMark).toContain('CONTROL');
    expect(adminRadius.hero).toBeLessThanOrEqual(22);
  });
});
