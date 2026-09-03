import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { getMotionPreset } from '../presets';
import { sanitizeHostChildren } from '../sanitizeHostChildren';
import { PANE_ENTER_SAFETY_MS, PANE_EXIT_SAFETY_MS } from '../safety';
import { prodayMotion } from '../tokens';
import type { MotionContext, NavDirection } from '../types';
import { useProDayMotion } from '../ProDayMotionProvider';

/** @deprecated import depuis `src/motion/safety` — re-export pour tests existants. */
export { PANE_EXIT_SAFETY_MS, PANE_ENTER_SAFETY_MS } from '../safety';
/** Jamais animer vers 0 (écran noir si l’anim est coupée) — slide mode. */
export const PANE_HOLD_OPACITY = prodayMotion.holdOpacity;

type Props = {
  sectionKey: string;
  direction: NavDirection;
  /** Préférer un élément React (écran / pane). Strings nues sont sanitizées. */
  children: React.ReactNode;
  /** Défaut `nav` (rapide). `tab` = cross-fade. */
  context?: Extract<MotionContext, 'nav' | 'tab' | 'live'>;
  /**
   * `true` (défaut) = remplit le parent (shells).
   * `false` = hauteur contenu (segments dans ScrollView).
   */
  fill?: boolean;
};

/**
 * Transition entre panes / onglets.
 * - `tab` (shift 0) : cross-fade 2 couches (premium).
 * - sinon : une phase slide + opacity, plancher holdOpacity.
 */
export function PaneTransition({
  sectionKey,
  direction,
  children,
  context = 'nav',
  fill = true,
}: Props) {
  const preset = getMotionPreset(context);
  const fadeOnly = preset.shift <= 0;

  if (fadeOnly) {
    return (
      <PaneCrossfade
        sectionKey={sectionKey}
        enterMs={preset.enterMs}
        exitMs={preset.exitMs}
        fill={fill}
      >
        {children}
      </PaneCrossfade>
    );
  }

  return (
    <PaneSlide
      sectionKey={sectionKey}
      direction={direction}
      enterMs={preset.enterMs}
      shift={preset.shift}
      fill={fill}
    >
      {children}
    </PaneSlide>
  );
}

/** Cross-fade keep-alive (max 2) — docks / onglets. */
function PaneCrossfade({
  sectionKey,
  enterMs,
  exitMs,
  children,
  fill,
}: {
  sectionKey: string;
  enterMs: number;
  exitMs: number;
  children: React.ReactNode;
  fill: boolean;
}) {
  const reduced = useReducedMotion();
  const { setPaneBusy } = useProDayMotion();
  const safeChildren = sanitizeHostChildren(children);
  const cacheRef = useRef(new Map<string, React.ReactNode>());
  const prevKeyRef = useRef(sectionKey);
  const switched = prevKeyRef.current !== sectionKey;

  useEffect(() => {
    prevKeyRef.current = sectionKey;
  }, [sectionKey]);

  cacheRef.current.set(sectionKey, safeChildren);
  if (cacheRef.current.size > 2) {
    for (const key of cacheRef.current.keys()) {
      if (key === sectionKey) continue;
      cacheRef.current.delete(key);
      if (cacheRef.current.size <= 2) break;
    }
  }

  useEffect(() => {
    if (!switched || reduced) {
      setPaneBusy(false);
      return;
    }
    setPaneBusy(true);
    const t = setTimeout(() => setPaneBusy(false), enterMs + PANE_ENTER_SAFETY_MS);
    return () => clearTimeout(t);
  }, [sectionKey, switched, reduced, enterMs, setPaneBusy]);

  if (reduced) {
    return (
      <View style={fill ? styles.host : styles.hostAuto}>
        <View style={fill ? styles.fill : styles.fillAuto}>
          {safeChildren}
        </View>
      </View>
    );
  }

  return (
    <View style={fill ? styles.host : styles.hostAuto}>
      {[...cacheRef.current.entries()].map(([id, node]) => {
        const on = id === sectionKey;
        return (
          <CrossfadeLayer
            key={id}
            active={on}
            animateOnMount={switched && on}
            enterMs={enterMs}
            exitMs={exitMs}
            fill={fill}
          >
            {node}
          </CrossfadeLayer>
        );
      })}
    </View>
  );
}

function CrossfadeLayer({
  active,
  animateOnMount,
  enterMs,
  exitMs,
  fill,
  children,
}: {
  active: boolean;
  animateOnMount: boolean;
  enterMs: number;
  exitMs: number;
  fill: boolean;
  children: React.ReactNode;
}) {
  const prevActive = useRef(animateOnMount ? false : active);
  const opacity = useSharedValue(animateOnMount ? 0 : active ? 1 : 0);
  const gen = useRef(0);

  useEffect(() => {
    const wasActive = prevActive.current;
    prevActive.current = active;
    if (active === wasActive) return;

    const token = ++gen.current;
    cancelAnimation(opacity);

    if (active) {
      opacity.value = 0;
      opacity.value = withTiming(
        1,
        { duration: enterMs, easing: prodayMotion.easing.out },
        (finished) => {
          if (token !== gen.current) return;
          if (!finished) {
            cancelAnimation(opacity);
            opacity.value = 1;
          }
        },
      );
      const safety = setTimeout(() => {
        if (token !== gen.current) return;
        cancelAnimation(opacity);
        opacity.value = 1;
      }, enterMs + PANE_ENTER_SAFETY_MS);
      return () => clearTimeout(safety);
    }

    opacity.value = withTiming(0, {
      duration: exitMs,
      easing: prodayMotion.easing.in,
    });
  }, [active, enterMs, exitMs, opacity]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    zIndex: active ? 2 : 1,
  }));

  return (
    <Animated.View
      style={[fill ? styles.layerFill : styles.layerAuto, style]}
      pointerEvents={active ? 'auto' : 'none'}
      accessibilityElementsHidden={!active}
      importantForAccessibility={active ? 'yes' : 'no-hide-descendants'}
      collapsable={false}
    >
      {children}
    </Animated.View>
  );
}

/** Slide + opacity (nav / live) — une couche, plancher holdOpacity. */
function PaneSlide({
  sectionKey,
  direction,
  enterMs,
  shift,
  children,
  fill,
}: {
  sectionKey: string;
  direction: NavDirection;
  enterMs: number;
  shift: number;
  children: React.ReactNode;
  fill: boolean;
}) {
  const reduced = useReducedMotion();
  const { setPaneBusy } = useProDayMotion();
  const safeChildren = sanitizeHostChildren(children);
  const [displayed, setDisplayed] = useState(safeChildren);
  const currentKey = useRef(sectionKey);
  const pending = useRef(safeChildren);
  const busy = useRef(false);
  const gen = useRef(0);
  const settled = useRef(0);
  const enterSafetyRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const holdSafetyRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  pending.current = safeChildren;

  const opacity = useSharedValue(1);
  const translateX = useSharedValue(0);

  const forceVisible = useCallback(() => {
    cancelAnimation(opacity);
    cancelAnimation(translateX);
    opacity.value = 1;
    translateX.value = 0;
  }, [opacity, translateX]);

  const settle = useCallback(
    (token: number, visible: boolean) => {
      if (token !== gen.current) return;
      if (settled.current === token && !visible) return;
      settled.current = token;
      if (visible) forceVisible();
      busy.current = false;
      setPaneBusy(false);
    },
    [forceVisible, setPaneBusy],
  );

  useEffect(
    () => () => {
      if (enterSafetyRef.current) clearTimeout(enterSafetyRef.current);
      if (holdSafetyRef.current) clearTimeout(holdSafetyRef.current);
    },
    [],
  );

  useEffect(() => {
    if (sectionKey === currentKey.current) {
      setDisplayed(pending.current);
      return;
    }

    currentKey.current = sectionKey;
    setDisplayed(pending.current);

    if (reduced) {
      forceVisible();
      busy.current = false;
      setPaneBusy(false);
      return;
    }

    const dir = direction;
    const token = ++gen.current;
    busy.current = true;
    setPaneBusy(true);
    cancelAnimation(opacity);
    cancelAnimation(translateX);

    opacity.value = PANE_HOLD_OPACITY;
    translateX.value = dir * shift;
    opacity.value = withTiming(1, {
      duration: enterMs,
      easing: prodayMotion.easing.out,
    });
    translateX.value = withTiming(
      0,
      {
        duration: enterMs,
        easing: prodayMotion.easing.out,
      },
      (finished) => {
        if (token !== gen.current) return;
        if (!finished) {
          cancelAnimation(opacity);
          cancelAnimation(translateX);
          opacity.value = 1;
          translateX.value = 0;
        }
        runOnJS(settle)(token, !finished);
      },
    );

    if (holdSafetyRef.current) clearTimeout(holdSafetyRef.current);
    holdSafetyRef.current = setTimeout(() => {
      if (token !== gen.current) return;
      if (opacity.value < PANE_HOLD_OPACITY) {
        opacity.value = PANE_HOLD_OPACITY;
      }
    }, PANE_EXIT_SAFETY_MS);

    if (enterSafetyRef.current) clearTimeout(enterSafetyRef.current);
    enterSafetyRef.current = setTimeout(() => {
      if (token !== gen.current) return;
      settle(token, true);
    }, enterMs + PANE_ENTER_SAFETY_MS);
  }, [
    sectionKey,
    direction,
    reduced,
    opacity,
    translateX,
    settle,
    forceVisible,
    setPaneBusy,
    enterMs,
    shift,
  ]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View style={fill ? styles.host : styles.hostAuto}>
      <Animated.View style={[fill ? styles.fill : styles.fillAuto, style]}>
        {sanitizeHostChildren(displayed)}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  host: { flex: 1, overflow: 'hidden' },
  fill: { flex: 1 },
  hostAuto: { overflow: 'hidden', alignSelf: 'stretch' },
  fillAuto: { alignSelf: 'stretch' },
  layerFill: {
    ...StyleSheet.absoluteFillObject,
  },
  layerAuto: {
    ...StyleSheet.absoluteFillObject,
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
  },
});
