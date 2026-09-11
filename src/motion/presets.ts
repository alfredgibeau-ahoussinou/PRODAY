import { prodayMotion } from './tokens';
import type { MotionContext, MotionSpring } from './types';

export type MotionPreset = {
  context: MotionContext;
  enterMs: number;
  exitMs: number;
  spring: MotionSpring;
  shift: number;
  scaleFrom: number;
  interruptible: boolean;
};

/**
 * Presets par contexte — un langage, plusieurs intentions.
 */
export const MOTION_PRESETS: Record<MotionContext, MotionPreset> = {
  nav: {
    context: 'nav',
    enterMs: prodayMotion.duration.enter,
    exitMs: prodayMotion.duration.exit,
    spring: prodayMotion.spring.snappy,
    shift: prodayMotion.paneShift,
    scaleFrom: 1,
    interruptible: true,
  },
  detail: {
    context: 'detail',
    enterMs: prodayMotion.duration.normal,
    exitMs: prodayMotion.duration.exit,
    spring: prodayMotion.spring.smooth,
    shift: prodayMotion.detailShift,
    scaleFrom: prodayMotion.detailScaleFrom,
    interruptible: true,
  },
  form: {
    context: 'form',
    enterMs: prodayMotion.duration.normal,
    exitMs: prodayMotion.duration.fast,
    spring: prodayMotion.spring.smooth,
    shift: 24,
    scaleFrom: 0.99,
    interruptible: true,
  },
  sheet: {
    context: 'sheet',
    enterMs: prodayMotion.duration.modal,
    exitMs: prodayMotion.duration.exit,
    spring: prodayMotion.spring.sheet,
    shift: 64,
    scaleFrom: 1,
    interruptible: true,
  },
  modal: {
    context: 'modal',
    enterMs: prodayMotion.duration.modal,
    exitMs: prodayMotion.duration.fast,
    spring: prodayMotion.spring.smooth,
    shift: 48,
    scaleFrom: 0.98,
    interruptible: true,
  },
  tab: {
    context: 'tab',
    enterMs: prodayMotion.duration.tab,
    /** Exit calibré avec enterMs pour un cross-fade soyeux sans superposition excessive. */
    exitMs: 240,
    spring: prodayMotion.spring.dock,
    /** 0 = fondu pur (pas de slide). */
    shift: 0,
    scaleFrom: 1,
    interruptible: true,
  },
  live: {
    context: 'live',
    enterMs: prodayMotion.duration.live,
    exitMs: prodayMotion.duration.fast,
    spring: prodayMotion.spring.snappy,
    shift: 16,
    scaleFrom: 1,
    interruptible: true,
  },
  video: {
    context: 'video',
    enterMs: prodayMotion.duration.video,
    exitMs: prodayMotion.duration.video,
    spring: prodayMotion.spring.snappy,
    shift: 12,
    scaleFrom: 1,
    interruptible: true,
  },
  shared: {
    context: 'shared',
    enterMs: prodayMotion.duration.normal,
    exitMs: prodayMotion.duration.fast,
    spring: prodayMotion.spring.smooth,
    shift: 0,
    scaleFrom: 1,
    interruptible: true,
  },
};

export function getMotionPreset(context: MotionContext): MotionPreset {
  return MOTION_PRESETS[context];
}
