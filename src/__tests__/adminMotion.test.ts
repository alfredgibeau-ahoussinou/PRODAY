import {
  ADMIN_MOTION_SECTION_ORDER,
  adminMotion,
  adminNavDirection,
} from '../features/admin/motion/adminMotion';

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
