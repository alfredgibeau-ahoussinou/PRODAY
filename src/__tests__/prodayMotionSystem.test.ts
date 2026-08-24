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
import {
  CROSSFADE_SAFETY_MS,
  PANE_ENTER_SAFETY_MS,
  PANE_EXIT_SAFETY_MS,
  PUSH_ENTER_SAFETY_MS,
  PUSH_EXIT_SAFETY_MS,
} from '../motion/safety';

describe('ProDayMotionSystem', () => {
  it('expose des tokens durée / spring cohérents', () => {
    expect(prodayMotion.duration.fast).toBeLessThan(prodayMotion.duration.normal);
    expect(prodayMotion.duration.exit).toBeLessThanOrEqual(prodayMotion.duration.enter);
    expect(prodayMotion.duration.video).toBeLessThanOrEqual(prodayMotion.duration.fast);
    expect(prodayMotion.paneShift).toBeGreaterThanOrEqual(32);
    expect(prodayMotion.paneShift).toBeLessThanOrEqual(48);
    expect(prodayMotion.holdOpacity).toBeGreaterThan(0);
    expect(prodayMotion.holdOpacity).toBeLessThan(0.5);
    expect(prodayMotion.spring.snappy.damping).toBeGreaterThan(0);
  });

  it('définit un preset distinct par contexte', () => {
    expect(getMotionPreset('nav').enterMs).toBe(MOTION_PRESETS.nav.enterMs);
    expect(getMotionPreset('video').enterMs).toBeLessThan(getMotionPreset('detail').enterMs);
    expect(getMotionPreset('tab').shift).toBeLessThan(getMotionPreset('detail').shift);
    expect(getMotionPreset('live').interruptible).toBe(true);
    expect(getMotionPreset('sheet').spring).toEqual(prodayMotion.spring.sheet);
  });

  it('garde les onglets dans la fenêtre 180–280 ms (enter + exit)', () => {
    const tab = getMotionPreset('tab');
    expect(tab.enterMs).toBeGreaterThanOrEqual(180);
    expect(tab.enterMs).toBeLessThanOrEqual(280);
    expect(tab.enterMs + tab.exitMs).toBeLessThanOrEqual(300);
    expect(tab.shift).toBeLessThanOrEqual(28);
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

describe('anti-écran-noir — filets motion', () => {
  it('PaneTransition : plancher + timeouts < 500ms', () => {
    expect(prodayMotion.holdOpacity).toBeGreaterThan(0);
    expect(PANE_EXIT_SAFETY_MS).toBeGreaterThanOrEqual(60);
    expect(PANE_ENTER_SAFETY_MS).toBeGreaterThanOrEqual(120);
    expect(PANE_EXIT_SAFETY_MS + PANE_ENTER_SAFETY_MS).toBeLessThan(500);
  });

  it('CrossfadeSwitch : pas d’opacity 0 permanente', () => {
    expect(prodayMotion.holdOpacity).toBeGreaterThan(0);
    expect(prodayMotion.duration.tab).toBeGreaterThanOrEqual(180);
    expect(prodayMotion.duration.tab).toBeLessThanOrEqual(280);
    expect(prodayMotion.duration.tab + CROSSFADE_SAFETY_MS).toBeLessThan(500);
  });

  it('PushScreenTransition : filets enter/exit', () => {
    expect(PUSH_ENTER_SAFETY_MS).toBeGreaterThanOrEqual(120);
    expect(PUSH_EXIT_SAFETY_MS).toBeGreaterThanOrEqual(100);
    expect(PUSH_ENTER_SAFETY_MS + PUSH_EXIT_SAFETY_MS).toBeLessThan(400);
  });
});
