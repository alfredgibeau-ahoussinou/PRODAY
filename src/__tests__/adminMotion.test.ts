import {
  ADMIN_MOTION_SECTION_ORDER,
  adminMotion,
  adminNavDirection,
} from '../features/admin/motion/adminMotion';
import { adminLayout, adminSpace } from '../features/admin/theme/adminDesignSystem';

describe('Admin motion system', () => {
  it('expose des tokens durée / spring cohérents', () => {
    expect(adminMotion.duration.fast).toBeLessThan(adminMotion.duration.normal);
    expect(adminMotion.duration.exit).toBeLessThanOrEqual(adminMotion.duration.enter);
    expect(adminMotion.paneShift).toBeGreaterThan(0);
    expect(adminMotion.spring.snappy.damping).toBeGreaterThan(0);
  });

  it('calcule forward / back selon l’ordre dock+menu', () => {
    expect(adminNavDirection('accueil', 'clubs')).toBe(1);
    expect(adminNavDirection('clubs', 'accueil')).toBe(-1);
    expect(adminNavDirection('ia', 'systeme')).toBe(1);
    expect(adminNavDirection('systeme', 'menu')).toBe(-1);
    expect(ADMIN_MOTION_SECTION_ORDER).toContain('commercial');
  });
});

describe('Admin mobile safe area layout', () => {
  it('garde un air confortable sous la status bar / îlot', () => {
    expect(adminLayout.contentTop).toBeGreaterThanOrEqual(adminSpace.xl);
    expect(adminLayout.statusBarMin).toBeGreaterThanOrEqual(44);
    const simulatedInset = 0;
    const pad =
      Math.max(simulatedInset, adminLayout.statusBarMin) + adminLayout.contentTop;
    expect(pad).toBeGreaterThanOrEqual(54 + adminSpace.xl);
  });
});
