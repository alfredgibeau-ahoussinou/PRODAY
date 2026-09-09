import fs from 'fs';
import path from 'path';
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

  it('garde les onglets en cross-fade 200–350 ms (enter + exit), sans slide', () => {
    const tab = getMotionPreset('tab');
    expect(tab.enterMs).toBeGreaterThanOrEqual(200);
    expect(tab.enterMs).toBeLessThanOrEqual(350);
    expect(tab.exitMs).toBeGreaterThanOrEqual(180);
    expect(tab.exitMs).toBeLessThanOrEqual(350);
    expect(tab.enterMs + tab.exitMs).toBeLessThanOrEqual(600);
    expect(tab.shift).toBe(0);
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

  it('conserve la direction rail Bureau Ops', () => {
    expect(adminNavDirection('pulse', 'file')).toBe(1);
    expect(adminNavDirection('file', 'pulse')).toBe(-1);
    expect(adminNavDirection('annuaire', 'classements')).toBe(1);
    expect(adminNavDirection('classements', 'comptes')).toBe(-1);
    expect(ADMIN_MOTION_SECTION_ORDER).toContain('pulse');
    expect(ADMIN_MOTION_SECTION_ORDER).toContain('classements');
    expect(ADMIN_MOTION_SECTION_ORDER).not.toContain('menu');
    expect(ADMIN_MOTION_SECTION_ORDER).not.toContain('commercial');
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
    expect(prodayMotion.duration.tab).toBeGreaterThanOrEqual(200);
    expect(prodayMotion.duration.tab).toBeLessThanOrEqual(350);
    expect(prodayMotion.duration.tab + CROSSFADE_SAFETY_MS).toBeLessThanOrEqual(520);
  });

  it('PushScreenTransition : filets enter/exit', () => {
    expect(PUSH_ENTER_SAFETY_MS).toBeGreaterThanOrEqual(120);
    expect(PUSH_EXIT_SAFETY_MS).toBeGreaterThanOrEqual(100);
    expect(PUSH_ENTER_SAFETY_MS + PUSH_EXIT_SAFETY_MS).toBeLessThan(400);
  });
});

describe('AnimatedTabContent — Accueil ↔ Matchs', () => {
  const src = fs.readFileSync(
    path.join(__dirname, '../components/motion/AnimatedTabContent.tsx'),
    'utf8',
  );

  it('n’enveloppe pas le keep-alive dans RouteSwitch (évite double transition)', () => {
    expect(src).not.toMatch(/from ['"].*RouteSwitch['"]/);
    expect(src).not.toMatch(/<RouteSwitch/);
    expect(src).toMatch(/TabKeepAliveLayer/);
    expect(src).toMatch(/size > 2/);
  });

  it('utilise un cross-fade opacity (pas de translateX)', () => {
    expect(src).toMatch(/opacity/);
    expect(src).not.toMatch(/translateX/);
    expect(src).toMatch(/withTiming/);
  });

  it('home → matchs est forward dans l’ordre joueur type', () => {
    const playerOrder = ['home', 'reels', 'matchs', 'messages'] as const;
    expect(navDirectionFromOrder(playerOrder, 'home', 'matchs')).toBe(1);
    expect(navDirectionFromOrder(playerOrder, 'matchs', 'home')).toBe(-1);
  });
});

describe('PaneTransition — cross-fade onglets', () => {
  const src = fs.readFileSync(
    path.join(__dirname, '../motion/primitives/PaneTransition.tsx'),
    'utf8',
  );

  it('branche fade (shift 0) sur PaneCrossfade / CrossfadeLayer', () => {
    expect(src).toMatch(/PaneCrossfade/);
    expect(src).toMatch(/CrossfadeLayer/);
    expect(src).toMatch(/fadeOnly/);
    expect(src).toMatch(/preset\.shift <= 0/);
  });
});
