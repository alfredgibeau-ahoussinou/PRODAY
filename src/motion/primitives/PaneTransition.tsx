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
/** Jamais animer vers 0 (écran noir si l’anim est coupée). */
export const PANE_HOLD_OPACITY = prodayMotion.holdOpacity;

type Props = {
  sectionKey: string;
  direction: NavDirection;
  /** Préférer un élément React (écran / pane). Strings nues sont sanitizées. */
  children: React.ReactNode;
  /** Défaut `nav` (rapide). `tab` = micro. */
  context?: Extract<MotionContext, 'nav' | 'tab' | 'live'>;
  /**
   * `true` (défaut) = remplit le parent (shells).
   * `false` = hauteur contenu (segments dans ScrollView).
   */
  fill?: boolean;
};

/**
 * Transition entre panes / onglets — une seule phase (slide + opacity).
 * Pas d’exit à 0 : swap immédiat depuis le plancher. Interruptible.
 */
export function PaneTransition({
  sectionKey,
  direction,
  children,
  context = 'nav',
  fill = true,
}: Props) {
  const reduced = useReducedMotion();
  const { setPaneBusy } = useProDayMotion();
  const preset = getMotionPreset(context);
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
    translateX.value = dir * preset.shift;
    opacity.value = withTiming(1, {
      duration: preset.enterMs,
      easing: prodayMotion.easing.out,
    });
    translateX.value = withTiming(
      0,
      {
        duration: preset.enterMs,
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
    }, preset.enterMs + PANE_ENTER_SAFETY_MS);
  }, [
    sectionKey,
    direction,
    reduced,
    opacity,
    translateX,
    settle,
    forceVisible,
    setPaneBusy,
    preset.enterMs,
    preset.shift,
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
});
