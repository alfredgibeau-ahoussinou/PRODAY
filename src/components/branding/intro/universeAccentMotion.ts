import { interpolateColor } from 'react-native-reanimated';
import type { CarouselPoleId } from '../../../models/CarouselPole';
import { UNIVERSE_ACCENT } from './universeIntroAccents';

export type UniverseAccentRanges = {
  inputRange: number[];
  outputRange: string[];
};

/** Plages Reanimated pour interpolation accent — JS-only (pas de worklet). */
export function universeAccentRanges(lines: CarouselPoleId[]): UniverseAccentRanges {
  return {
    inputRange: lines.map((_, index) => index),
    outputRange: lines.map((line) => UNIVERSE_ACCENT[line]),
  };
}

/**
 * Couleur accent interpolée — primitives uniquement (tests / JS thread).
 * Pas de default param, pas d'objet ranges, pas de lookup UNIVERSE_ACCENT.
 * Ne pas appeler depuis un worklet UI-thread si possible : préférer liveIndex React.
 */
export function accentColorAtPage(
  page: number,
  inputRange: number[],
  outputRange: string[],
  fallback: string,
): string {
  if (inputRange.length === 0) return fallback;
  if (inputRange.length === 1) return outputRange[0] ?? fallback;
  const lo = inputRange[0];
  const hi = inputRange[inputRange.length - 1];
  const clamped = Math.max(lo, Math.min(hi, page));
  return interpolateColor(clamped, inputRange, outputRange);
}
