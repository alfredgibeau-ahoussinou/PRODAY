import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { prodayMotion, useReducedMotion } from '../../motion';
import { CROSSFADE_SAFETY_MS } from '../../motion/safety';
import { sanitizeHostChildren } from '../../motion/sanitizeHostChildren';

interface CrossfadeSwitchProps {
  /** Clé qui déclenche la transition (ex. user id ou mode guest/logged) */
  switchKey: string;
  children: React.ReactNode;
}

export const CROSSFADE_HOLD_OPACITY = prodayMotion.holdOpacity;
export const CROSSFADE_MS = prodayMotion.duration.tab;
export { CROSSFADE_SAFETY_MS };

/** Fondu entre deux états — une phase, jamais opacity 0. */
export const CrossfadeSwitch: React.FC<CrossfadeSwitchProps> = ({ switchKey, children }) => {
  const reduced = useReducedMotion();
  const safeChildren = sanitizeHostChildren(children);
  const [displayed, setDisplayed] = useState(safeChildren);
  const currentKey = useRef(switchKey);
  const pending = useRef(safeChildren);
  const gen = useRef(0);
  pending.current = safeChildren;

  const opacity = useSharedValue(1);

  const forceVisible = useCallback(() => {
    cancelAnimation(opacity);
    opacity.value = 1;
  }, [opacity]);

  useEffect(() => {
    if (currentKey.current === switchKey) {
      setDisplayed(pending.current);
      return;
    }

    currentKey.current = switchKey;
    setDisplayed(pending.current);

    if (reduced) {
      forceVisible();
      return;
    }

    const token = ++gen.current;
    cancelAnimation(opacity);
    opacity.value = CROSSFADE_HOLD_OPACITY;
    opacity.value = withTiming(
      1,
      { duration: CROSSFADE_MS, easing: prodayMotion.easing.out },
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
      forceVisible();
    }, CROSSFADE_MS + CROSSFADE_SAFETY_MS);
    return () => clearTimeout(safety);
  }, [switchKey, opacity, reduced, forceVisible]);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View style={[styles.fill, style]}>
      {sanitizeHostChildren(displayed)}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  fill: { flex: 1 },
});
