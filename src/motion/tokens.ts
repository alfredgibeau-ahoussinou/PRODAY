import { Easing } from 'react-native-reanimated';
import type { MotionSpring } from './types';

/**
 * ProDayMotionSystem — tokens uniques app-wide.
 * GPU-friendly (transform / opacity), durées courtes, pas flashy.
 */
export const prodayMotion = {
  duration: {
    fast: 110,
    normal: 180,
    slow: 240,
    enter: 200,
    exit: 100,
    modal: 220,
    toast: 140,
    number: 400,
    /** Vidéo / reels — ultra court pour ne pas retarder le média. */
    video: 110,
    /** Live / match — micro, jamais bloquant. */
    live: 130,
    /** Onglets dock — cross-fade premium, 240–300 ms. */
    tab: 280,
    /** prefers-reduced-motion : cut ou micro-fade. */
    reduced: 90,
  },
  spring: {
    snappy: { damping: 24, stiffness: 300, mass: 0.55 } satisfies MotionSpring,
    smooth: { damping: 28, stiffness: 220, mass: 0.7 } satisfies MotionSpring,
    sheet: { damping: 26, stiffness: 240, mass: 0.75 } satisfies MotionSpring,
    dock: { damping: 22, stiffness: 320, mass: 0.5 } satisfies MotionSpring,
    bouncy: { damping: 18, stiffness: 170, mass: 0.75 } satisfies MotionSpring,
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
  holdOpacity: 0.32,
  /** Slide horizontal panes / onglets (px) — micro, direct. */
  paneShift: 36,
  /** Push détail (profondeur). */
  detailShift: 28,
  detailScaleFrom: 0.985,
  /** Alias historique theme/motion. */
  screenShift: 36,
  /** Overlay sheets / modales. */
  backdrop: 'rgba(0,0,0,0.55)',
  modalBackdrop: 'rgba(0,0,0,0.52)',
  /** Seuil dismiss sheet (px). */
  sheetDismissY: 96,
} as const;

/** Alias rétrocompat — `import { motion } from '../theme/motion'`. */
export const motion = prodayMotion;

export type ProDayMotionTokens = typeof prodayMotion;
