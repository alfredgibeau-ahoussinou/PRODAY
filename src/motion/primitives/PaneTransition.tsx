import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
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
 * Chrome (dock / sidebar) stable ; skip si navigation rapide.
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
  pending.current = safeChildren;

  const opacity = useSharedValue(1);
  const translateX = useSharedValue(0);

  const finishEnter = useCallback(
    (nextKey: string, dir: NavDirection) => {
      currentKey.current = nextKey;
      setDisplayed(pending.current);
      opacity.value = 0;
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
        () => {
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

    if (reduced || busy.current) {
      currentKey.current = sectionKey;
      setDisplayed(pending.current);
      opacity.value = 1;
      translateX.value = 0;
      busy.current = false;
      setPaneBusy(false);
      return;
    }

    const nextKey = sectionKey;
    const dir = direction;
    busy.current = true;
    setPaneBusy(true);

    opacity.value = withTiming(0, {
      duration: preset.exitMs,
      easing: prodayMotion.easing.in,
    });
    translateX.value = withTiming(
      -dir * (preset.shift * 0.55),
      {
        duration: preset.exitMs,
        easing: prodayMotion.easing.in,
      },
      (finished) => {
        if (finished) {
          runOnJS(finishEnter)(nextKey, dir);
        } else {
          busy.current = false;
          runOnJS(setPaneBusy)(false);
        }
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
