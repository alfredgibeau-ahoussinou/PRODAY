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
import { prodayMotion } from '../tokens';
import type { MotionContext, NavDirection } from '../types';
import { useProDayMotion } from '../ProDayMotionProvider';

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
 * Transition entre panes / onglets — slide léger + opacity.
 * Chrome (dock / sidebar) stable ; interruptible si navigation rapide.
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
  pending.current = safeChildren;

  const opacity = useSharedValue(1);
  const translateX = useSharedValue(0);

  const finishEnter = useCallback(
    (nextKey: string, dir: NavDirection, token: number) => {
      if (token !== gen.current) return;
      currentKey.current = nextKey;
      setDisplayed(pending.current);
      opacity.value = 0;
      translateX.value = dir * preset.shift * 0.85;
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
        () => {
          if (token !== gen.current) return;
          busy.current = false;
          runOnJS(setPaneBusy)(false);
        },
      );
    },
    [opacity, translateX, setPaneBusy, preset.enterMs, preset.shift],
  );

  useEffect(() => {
    if (sectionKey === currentKey.current) {
      setDisplayed(pending.current);
      return;
    }

    if (reduced) {
      currentKey.current = sectionKey;
      setDisplayed(pending.current);
      cancelAnimation(opacity);
      cancelAnimation(translateX);
      opacity.value = 1;
      translateX.value = 0;
      busy.current = false;
      setPaneBusy(false);
      return;
    }

    // Interruptible : annule la transition en cours plutôt qu’un jump sec.
    const nextKey = sectionKey;
    const dir = direction;
    const token = ++gen.current;
    busy.current = true;
    setPaneBusy(true);
    cancelAnimation(opacity);
    cancelAnimation(translateX);

    opacity.value = withTiming(0, {
      duration: preset.exitMs,
      easing: prodayMotion.easing.in,
    });
    translateX.value = withTiming(
      -dir * (preset.shift * 0.45),
      {
        duration: preset.exitMs,
        easing: prodayMotion.easing.in,
      },
      (finished) => {
        // Toujours récupérer si ce token est encore le courant — sinon opacity
        // reste à 0 (écran noir + dock encore utilisable) quand finished=false.
        if (token !== gen.current) return;
        if (!finished) {
          cancelAnimation(opacity);
          cancelAnimation(translateX);
        }
        runOnJS(finishEnter)(nextKey, dir, token);
      },
    );
  }, [
    sectionKey,
    direction,
    reduced,
    opacity,
    translateX,
    finishEnter,
    setPaneBusy,
    preset.exitMs,
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
