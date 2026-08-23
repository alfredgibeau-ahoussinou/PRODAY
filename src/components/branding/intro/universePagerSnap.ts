/** Seuil vélocité (px/ms) — en dessous, le snap se fait au relâchement du drag. */
export const UNIVERSE_SNAP_VELOCITY_THRESHOLD = 0.08;

export function shouldSnapOnDragEnd(velocityX: number | undefined | null): boolean {
  return Math.abs(velocityX ?? 0) < UNIVERSE_SNAP_VELOCITY_THRESHOLD;
}

/** Index de page arrondi à partir de l'offset horizontal. */
export function snapIndexFromOffset(
  offsetX: number,
  itemWidth: number,
  count: number,
): number {
  if (itemWidth <= 0 || count <= 0) return 0;
  return Math.max(0, Math.min(count - 1, Math.round(offsetX / itemWidth)));
}

/** Literals worklet-safe — évite PRODAY_MASTER dans les worklets Reanimated. */
export const UNIVERSE_AMBIENT_FALLBACK = '#C5A059';
export const UNIVERSE_AMBIENT_BASE = '#000000';
