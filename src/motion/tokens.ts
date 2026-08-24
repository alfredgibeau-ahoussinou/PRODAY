import { Easing } from 'react-native-reanimated';
import type { MotionSpring } from './types';

/**
 * ProDayMotionSystem — tokens uniques app-wide.
 * GPU-friendly (transform / opacity), durées courtes, pas flashy.
 */
export const prodayMotion = {
  duration: {
    fast: 120,
    normal: 200,
    slow: 260,
    enter: 220,
    exit: 110,
    modal: 240,
    toast: 160,
    number: 420,
    /** Vidéo / reels — ultra court pour ne pas retarder le média. */
    video: 120,
    /** Live / match — micro, jamais bloquant. */
    live: 140,
    /** Onglets dock — une phase, 180–280 ms. */
    tab: 200,
    /** prefers-reduced-motion : cut ou micro-fade. */
    reduced: 100,
  },
  spring: {
    snappy: { damping: 24, stiffness: 280, mass: 0.6 } satisfies MotionSpring,
    smooth: { damping: 28, stiffness: 200, mass: 0.75 } satisfies MotionSpring,
    sheet: { damping: 26, stiffness: 220, mass: 0.8 } satisfies MotionSpring,
    dock: { damping: 22, stiffness: 300, mass: 0.55 } satisfies MotionSpring,
    bouncy: { damping: 18, stiffness: 160, mass: 0.8 } satisfies MotionSpring,
  },
  easing: {
    out: Easing.out(Easing.cubic),
    in: Easing.in(Easing.cubic),
    inOut: Easing.inOut(Easing.cubic),
  },
  /**
   * Plancher d’opacity pendant un swap.
   * Jamais 0 : un frame à 0 = écran noir si l’anim est coupée.
   */
  holdOpacity: 0.28,
  /** Slide horizontal panes / onglets (px) — micro, direct. */
  paneShift: 40,
  /** Push détail (profondeur). */
  detailShift: 32,
  detailScaleFrom: 0.98,
  /** Alias historique theme/motion. */
  screenShift: 40,
  /** Overlay sheets / modales. */
  backdrop: 'rgba(0,0,0,0.55)',
  modalBackdrop: 'rgba(0,0,0,0.52)',
  /** Seuil dismiss sheet (px). */
  sheetDismissY: 96,
} as const;

/** Alias rétrocompat — `import { motion } from '../theme/motion'`. */
export const motion = prodayMotion;

export type ProDayMotionTokens = typeof prodayMotion;
