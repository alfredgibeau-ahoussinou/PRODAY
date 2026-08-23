import { interpolateColor } from 'react-native-reanimated';
import type { CarouselPoleId } from '../../../models/CarouselPole';
import { UNIVERSE_ACCENT } from './universeIntroAccents';

export type UniverseAccentRanges = {
  inputRange: number[];
  outputRange: string[];
};

/** Plages Reanimated pour interpolation accent fluide au swipe. */
export function universeAccentRanges(lines: CarouselPoleId[]): UniverseAccentRanges {
  return {
    inputRange: lines.map((_, index) => index),
    outputRange: lines.map((line) => UNIVERSE_ACCENT[line]),
  };
}

/** Fallback joueur — literal worklet-safe (PRODAY_POLE_ACCENTS.player). */
const ACCENT_FALLBACK = '#1E3AFF';

/** Couleur accent interpolée — ranges pré-calculées côté JS. */
export function accentColorAtPage(
  page: number,
  ranges: UniverseAccentRanges,
  fallback: string = ACCENT_FALLBACK,
): string {
  'worklet';
  if (ranges.inputRange.length === 0) return fallback;
  if (ranges.inputRange.length === 1) return ranges.outputRange[0];
  const clamped = Math.max(
    ranges.inputRange[0],
    Math.min(ranges.inputRange[ranges.inputRange.length - 1], page),
  );
  return interpolateColor(clamped, ranges.inputRange, ranges.outputRange);
}
