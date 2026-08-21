import {
  MOTION_PRESETS,
  getMotionPreset,
  navDirectionFromOrder,
  prodayMotion,
} from '../motion';
import {
  ADMIN_MOTION_SECTION_ORDER,
  adminMotion,
  adminNavDirection,
} from '../features/admin/motion/adminMotion';

describe('ProDayMotionSystem', () => {
  it('expose des tokens durée / spring cohérents', () => {
    expect(prodayMotion.duration.fast).toBeLessThan(prodayMotion.duration.normal);
    expect(prodayMotion.duration.exit).toBeLessThanOrEqual(prodayMotion.duration.enter);
    expect(prodayMotion.duration.video).toBeLessThanOrEqual(prodayMotion.duration.fast);
    expect(prodayMotion.paneShift).toBeGreaterThanOrEqual(48);
    expect(prodayMotion.spring.snappy.damping).toBeGreaterThan(0);
  });

  it('définit un preset distinct par contexte', () => {
    expect(getMotionPreset('nav').enterMs).toBe(MOTION_PRESETS.nav.enterMs);
    expect(getMotionPreset('video').enterMs).toBeLessThan(getMotionPreset('detail').enterMs);
    expect(getMotionPreset('tab').shift).toBeLessThan(getMotionPreset('detail').shift);
    expect(getMotionPreset('live').interruptible).toBe(true);
    expect(getMotionPreset('sheet').spring).toEqual(prodayMotion.spring.sheet);
  });

  it('calcule forward / back selon un ordre générique', () => {
    const order = ['a', 'b', 'c'] as const;
    expect(navDirectionFromOrder(order, 'a', 'c')).toBe(1);
    expect(navDirectionFromOrder(order, 'c', 'a')).toBe(-1);
    expect(navDirectionFromOrder(order, 'b', 'b')).toBe(1);
  });
});

describe('Admin motion → ProDayMotionSystem', () => {
  it('adminMotion alias le système global', () => {
    expect(adminMotion).toBe(prodayMotion);
    expect(adminMotion.duration.fast).toBe(prodayMotion.duration.fast);
  });

  it('conserve la direction dock+menu admin', () => {
    expect(adminNavDirection('accueil', 'clubs')).toBe(1);
    expect(adminNavDirection('clubs', 'accueil')).toBe(-1);
    expect(adminNavDirection('ia', 'systeme')).toBe(1);
    expect(adminNavDirection('systeme', 'menu')).toBe(-1);
    expect(ADMIN_MOTION_SECTION_ORDER).toContain('commercial');
  });
});
