import {
  shouldSnapOnDragEnd,
  snapIndexFromOffset,
  isUniverseCinematicLayout,
  resolveUniverseItemWidth,
  UNIVERSE_AMBIENT_BASE,
  UNIVERSE_AMBIENT_FALLBACK,
  UNIVERSE_CINEMATIC_BREAKPOINT,
  UNIVERSE_DECELERATION_RATE,
  UNIVERSE_SIDE_RAIL_WIDTH,
  UNIVERSE_SNAP_VELOCITY_THRESHOLD,
} from '../components/branding/intro/universePagerSnap';
import { desktopShellChrome } from '../theme/desktopShellChrome';
import { PRODAY_MASTER } from '../theme/prodayBrand';

describe('universePagerSnap', () => {
  it('calcule l’index arrondi depuis l’offset', () => {
    expect(snapIndexFromOffset(0, 300, 5)).toBe(0);
    expect(snapIndexFromOffset(149, 300, 5)).toBe(0);
    expect(snapIndexFromOffset(151, 300, 5)).toBe(1);
    expect(snapIndexFromOffset(900, 300, 5)).toBe(3);
    expect(snapIndexFromOffset(2000, 300, 5)).toBe(4);
    expect(snapIndexFromOffset(100, 0, 5)).toBe(0);
  });

  it('snap au drag end seulement si vélocité faible', () => {
    expect(shouldSnapOnDragEnd(0)).toBe(true);
    expect(shouldSnapOnDragEnd(0.02)).toBe(true);
    expect(shouldSnapOnDragEnd(-0.05)).toBe(true);
    expect(shouldSnapOnDragEnd(UNIVERSE_SNAP_VELOCITY_THRESHOLD)).toBe(false);
    expect(shouldSnapOnDragEnd(0.5)).toBe(false);
    expect(shouldSnapOnDragEnd(undefined)).toBe(true);
  });

  it('expose un snap doux (décélération entre fast et normal)', () => {
    expect(UNIVERSE_DECELERATION_RATE).toBeGreaterThan(0.99);
    expect(UNIVERSE_DECELERATION_RATE).toBeLessThan(0.998);
    expect(UNIVERSE_SNAP_VELOCITY_THRESHOLD).toBeGreaterThanOrEqual(0.1);
  });

  it('expose des literals worklet-safe alignés brand', () => {
    expect(UNIVERSE_AMBIENT_FALLBACK).toBe(PRODAY_MASTER.gold);
    expect(UNIVERSE_AMBIENT_BASE).toBe(PRODAY_MASTER.black);
  });

  it('active le mode cinématique dès le breakpoint desktop (900)', () => {
    expect(UNIVERSE_CINEMATIC_BREAKPOINT).toBe(desktopShellChrome.wideBreakpoint);
    expect(isUniverseCinematicLayout(899)).toBe(false);
    expect(isUniverseCinematicLayout(900)).toBe(true);
    expect(isUniverseCinematicLayout(1366)).toBe(true);
    expect(isUniverseCinematicLayout(1440)).toBe(true);
    expect(isUniverseCinematicLayout(1920)).toBe(true);
    expect(UNIVERSE_SIDE_RAIL_WIDTH).toBe(200);
  });

  it('borne la largeur de carte sur grand écran (ni timbre ni mur)', () => {
    const w900 = resolveUniverseItemWidth(900, true);
    const w1366 = resolveUniverseItemWidth(1366, true);
    const w1440 = resolveUniverseItemWidth(1440, true);
    const w1920 = resolveUniverseItemWidth(1920, true);
    expect(w900).toBeGreaterThanOrEqual(320);
    expect(w900).toBeLessThanOrEqual(480);
    expect(w1366).toBeGreaterThanOrEqual(320);
    expect(w1366).toBeLessThanOrEqual(480);
    expect(w1440).toBe(480);
    expect(w1920).toBe(480);
    expect(resolveUniverseItemWidth(390, false)).toBeLessThan(390);
  });
});
