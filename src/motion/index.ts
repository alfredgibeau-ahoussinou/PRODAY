export { prodayMotion, motion } from './tokens';
export type { ProDayMotionTokens } from './tokens';

export {
  PANE_EXIT_SAFETY_MS,
  PANE_ENTER_SAFETY_MS,
  PUSH_EXIT_SAFETY_MS,
  PUSH_ENTER_SAFETY_MS,
  CROSSFADE_SAFETY_MS,
} from './safety';

export { MOTION_PRESETS, getMotionPreset } from './presets';
export type { MotionPreset } from './presets';

export type { MotionContext, NavDirection, MotionSpring } from './types';

export { navDirectionFromOrder } from './navDirection';

export { ProDayMotionProvider, useProDayMotion } from './ProDayMotionProvider';
export { useShellNavDirection } from './hooks/useShellNavDirection';

export { sanitizeHostChildren } from './sanitizeHostChildren';
export { PaneTransition } from './primitives/PaneTransition';
export { DetailTransition } from './primitives/DetailTransition';
export { RouteSwitch } from './primitives/RouteSwitch';
export { ModalSheet } from './primitives/ModalSheet';
export type { ModalSheetProps } from './primitives/ModalSheet';
export { BottomSheet } from './primitives/BottomSheet';
export type { BottomSheetProps } from './primitives/BottomSheet';
export { PressableScale } from './primitives/PressableScale';
export { ListRow } from './primitives/ListRow';
export { TabUnderline, DockPillIndicator } from './primitives/TabMicro';

/** Re-export accessibilité — single import surface. */
export { useReducedMotion } from '../hooks/useReducedMotion';
