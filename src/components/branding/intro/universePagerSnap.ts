import { desktopShellChrome } from '../../../theme/desktopShellChrome';

/**
 * Seuil vélocité (px/ms) — en dessous, snap au relâchement du drag.
 * Un peu plus haut que 0.08 pour laisser le momentum + snapToOffsets
 * porter le geste (sens plus doux).
 */
export const UNIVERSE_SNAP_VELOCITY_THRESHOLD = 0.12;

/**
 * Entre `fast` (0.99) et `normal` (0.998) — glide plus long avant le snap.
 * iOS lit un nombre ; Android utilise une décélération plus courte.
 */
export const UNIVERSE_DECELERATION_RATE = 0.994;

/**
 * Mode cinématique (rail gauche + hero fixe) dès le breakpoint desktop partagé.
 * En dessous : FlatList swipe (meilleur tactile / tablette).
 */
export const UNIVERSE_CINEMATIC_BREAKPOINT = desktopShellChrome.wideBreakpoint;

/** Largeur du rail de pôles (grand écran). */
export const UNIVERSE_SIDE_RAIL_WIDTH = 200;

export function isUniverseCinematicLayout(width: number): boolean {
  return width >= UNIVERSE_CINEMATIC_BREAKPOINT;
}

/** Largeur carte / slide selon mode et viewport. */
export function resolveUniverseItemWidth(screenWidth: number, cinematic: boolean): number {
  if (cinematic) {
    const rail = UNIVERSE_SIDE_RAIL_WIDTH;
    const usable = Math.max(280, screenWidth - rail);
    // Bornes stables 900 → 1920 : ni carte timbre, ni mur.
    return Math.min(Math.max(usable * 0.48, 320), 480);
  }
  return Math.min(screenWidth * 0.78, screenWidth - 48);
}

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
