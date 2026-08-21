import { Easing } from 'react-native-reanimated';
import type { MotionSpring } from './types';

/**
 * ProDayMotionSystem — tokens uniques app-wide.
 * GPU-friendly (transform / opacity), durées courtes, pas flashy.
 */
export const prodayMotion = {
  duration: {
    fast: 140,
    normal: 220,
    slow: 300,
    enter: 240,
    exit: 160,
    modal: 260,
    toast: 180,
    number: 420,
    /** Vidéo / reels — ultra court pour ne pas retarder le média. */
    video: 120,
    /** Live / match — micro, jamais bloquant. */
    live: 160,
    tab: 180,
  },
  spring: {
    snappy: { damping: 24, stiffness: 260, mass: 0.65 } satisfies MotionSpring,
    smooth: { damping: 28, stiffness: 200, mass: 0.75 } satisfies MotionSpring,
    sheet: { damping: 26, stiffness: 220, mass: 0.8 } satisfies MotionSpring,
    dock: { damping: 22, stiffness: 280, mass: 0.6 } satisfies MotionSpring,
    bouncy: { damping: 18, stiffness: 160, mass: 0.8 } satisfies MotionSpring,
  },
  easing: {
    out: Easing.out(Easing.cubic),
    in: Easing.in(Easing.cubic),
    inOut: Easing.inOut(Easing.cubic),
  },
  /** Slide horizontal panes / onglets (px) — assez large pour être perçu. */
  paneShift: 52,
  /** Push détail (profondeur). */
  detailShift: 44,
  detailScaleFrom: 0.97,
  /** Alias historique theme/motion. */
  screenShift: 52,
  /** Overlay sheets / modales. */
  backdrop: 'rgba(0,0,0,0.55)',
  modalBackdrop: 'rgba(0,0,0,0.52)',
  /** Seuil dismiss sheet (px). */
  sheetDismissY: 96,
} as const;

/** Alias rétrocompat — `import { motion } from '../theme/motion'`. */
export const motion = prodayMotion;

export type ProDayMotionTokens = typeof prodayMotion;
