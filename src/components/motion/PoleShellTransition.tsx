import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { motion, prodayMotion, useReducedMotion, getMotionPreset } from '../../motion';
import { sanitizeHostChildren } from '../../motion/sanitizeHostChildren';

export type PoleShellId = 'parent' | 'supporter' | 'club' | 'president';

const TAB_PRESET = getMotionPreset('tab');
const ENTER_MS = TAB_PRESET.enterMs;
const SHIFT = TAB_PRESET.shift;

/** Parent → Supporter = 1 ; Club → Président = 1 ; retours = -1. */
export function poleShellTransitionDirection(
  from: PoleShellId,
  to: PoleShellId,
): 1 | -1 {
  if (from === to) return 1;
  if (from === 'parent' && to === 'supporter') return 1;
  if (from === 'supporter' && to === 'parent') return -1;
  if (from === 'club' && to === 'president') return 1;
  if (from === 'president' && to === 'club') return -1;
  return to === 'supporter' || to === 'president' ? 1 : -1;
}

interface PoleShellTransitionProps {
  shellKey: PoleShellId;
  children: React.ReactNode;
}

/**
 * Transition légère Parent ↔ Supporter / Club ↔ Président.
 * Une phase (slide + opacity), plancher holdOpacity, timeout de secours.
 */
export const PoleShellTransition: React.FC<PoleShellTransitionProps> = ({
  shellKey,
  children,
}) => {
  const reduced = useReducedMotion();
  const safeChildren = sanitizeHostChildren(children);
  const [displayed, setDisplayed] = useState(safeChildren);
  const currentKey = useRef(shellKey);
  const pendingChildren = useRef(safeChildren);
  const busy = useRef(false);
  const gen = useRef(0);
  pendingChildren.current = safeChildren;

  const opacity = useSharedValue(1);
  const translateX = useSharedValue(0);

  const clearBusy = useCallback((token: number) => {
    if (token !== gen.current) return;
    busy.current = false;
  }, []);

  useEffect(() => {
    if (shellKey === currentKey.current) {
      setDisplayed(pendingChildren.current);
      return;
    }

    const dir = poleShellTransitionDirection(currentKey.current, shellKey);
    currentKey.current = shellKey;
    setDisplayed(pendingChildren.current);

    if (reduced) {
      cancelAnimation(opacity);
      cancelAnimation(translateX);
      opacity.value = 1;
      translateX.value = 0;
      busy.current = false;
      return;
    }

    const token = ++gen.current;
    busy.current = true;
    cancelAnimation(opacity);
    cancelAnimation(translateX);
    opacity.value = prodayMotion.holdOpacity;
    translateX.value = dir * SHIFT;
    opacity.value = withTiming(1, {
      duration: ENTER_MS,
      easing: motion.easing.out,
    });
    translateX.value = withTiming(
      0,
      { duration: ENTER_MS, easing: motion.easing.out },
      (finished) => {
        if (token !== gen.current) return;
        if (!finished) {
          cancelAnimation(opacity);
          cancelAnimation(translateX);
          opacity.value = 1;
          translateX.value = 0;
        }
        runOnJS(clearBusy)(token);
      },
    );

    const safety = setTimeout(() => {
      if (token !== gen.current) return;
      cancelAnimation(opacity);
      cancelAnimation(translateX);
      opacity.value = 1;
      translateX.value = 0;
      busy.current = false;
    }, ENTER_MS + 200);
    return () => clearTimeout(safety);
  }, [shellKey, reduced, opacity, translateX, clearBusy]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View style={styles.host}>
      <Animated.View style={[styles.shell, style]}>
        {sanitizeHostChildren(displayed)}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  host: { flex: 1, overflow: 'hidden' },
  shell: { flex: 1 },
});
