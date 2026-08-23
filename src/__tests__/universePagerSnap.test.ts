import {
  shouldSnapOnDragEnd,
  snapIndexFromOffset,
  UNIVERSE_AMBIENT_BASE,
  UNIVERSE_AMBIENT_FALLBACK,
  UNIVERSE_SNAP_VELOCITY_THRESHOLD,
} from '../components/branding/intro/universePagerSnap';
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

  it('expose des literals worklet-safe alignés brand', () => {
    expect(UNIVERSE_AMBIENT_FALLBACK).toBe(PRODAY_MASTER.gold);
    expect(UNIVERSE_AMBIENT_BASE).toBe(PRODAY_MASTER.black);
  });
});
