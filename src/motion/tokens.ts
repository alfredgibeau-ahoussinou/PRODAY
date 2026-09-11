import { Easing } from 'react-native-reanimated';
import type { MotionSpring } from './types';

/**
 * ProDayMotionSystem — tokens uniques app-wide.
 * GPU-friendly (transform / opacity), durées courtes, pas flashy.
 */
export const prodayMotion = {
  duration: {
    fast: 140,
    normal: 320,
    slow: 380,
    enter: 340,
    exit: 220,
    modal: 360,
    toast: 180,
    number: 400,
    /** Vidéo / reels — ultra court pour ne pas retarder le média. */
    video: 120,
    /** Live / match — micro, jamais bloquant. */
    live: 150,
    /** Onglets dock — cross-fade premium Apple, 300 ms. */
    tab: 300,
    /** prefers-reduced-motion : cut ou micro-fade. */
    reduced: 90,
  },
  spring: {
    snappy: { damping: 26, stiffness: 320, mass: 0.6 } satisfies MotionSpring,
    smooth: { damping: 30, stiffness: 220, mass: 0.8 } satisfies MotionSpring,
    sheet: { damping: 28, stiffness: 240, mass: 0.8 } satisfies MotionSpring,
    dock: { damping: 24, stiffness: 300, mass: 0.6 } satisfies MotionSpring,
    bouncy: { damping: 20, stiffness: 180, mass: 0.75 } satisfies MotionSpring,
  },
  easing: {
    // Apple standard cubic-bezier curves (iOS System Animation curves)
    out: Easing.bezier(0.25, 0.1, 0.25, 1),
    in: Easing.bezier(0.42, 0, 1, 1),
    inOut: Easing.bezier(0.42, 0, 0.58, 1),
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
