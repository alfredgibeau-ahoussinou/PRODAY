import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { motion, useReducedMotion } from '../../motion';

export type PoleShellId = 'parent' | 'supporter' | 'club' | 'president';

const ENTER_MS = motion.duration.slow; // 300
const EXIT_MS = motion.duration.normal; // 220
const SHIFT = 40;
const SCALE_OUT = 0.99;
const SCALE_IN = 0.985;

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
 * Transition légère au swap Parent ↔ Supporter (crossfade + slide/scale discrets).
 * Conserve l’ancien shell le temps du fade-out pour un vrai croisement.
 */
export const PoleShellTransition: React.FC<PoleShellTransitionProps> = ({
  shellKey,
  children,
}) => {
  const reduced = useReducedMotion();
  const [displayed, setDisplayed] = useState(children);
  const currentKey = useRef(shellKey);
  const pendingChildren = useRef(children);
  const busy = useRef(false);
  pendingChildren.current = children;

  const opacity = useSharedValue(1);
  const translateX = useSharedValue(0);
  const scale = useSharedValue(1);

  const finishEnter = useCallback(
    (nextKey: PoleShellId, dir: 1 | -1) => {
      currentKey.current = nextKey;
      setDisplayed(pendingChildren.current);
      opacity.value = 0;
      translateX.value = dir * SHIFT;
      scale.value = SCALE_IN;
      opacity.value = withTiming(1, { duration: ENTER_MS, easing: motion.easing.out });
      translateX.value = withTiming(0, {
        duration: ENTER_MS,
        easing: motion.easing.out,
      });
      scale.value = withTiming(
        1,
        { duration: ENTER_MS, easing: motion.easing.out },
        () => {
          busy.current = false;
        },
      );
    },
    [opacity, translateX, scale],
  );

  useEffect(() => {
    if (shellKey === currentKey.current) return;

    if (reduced) {
      currentKey.current = shellKey;
      setDisplayed(pendingChildren.current);
      opacity.value = 1;
      translateX.value = 0;
      scale.value = 1;
      busy.current = false;
      return;
    }

    if (busy.current) {
      currentKey.current = shellKey;
      setDisplayed(pendingChildren.current);
      opacity.value = 1;
      translateX.value = 0;
      scale.value = 1;
      busy.current = false;
      return;
    }

    const dir = poleShellTransitionDirection(currentKey.current, shellKey);
    const nextKey = shellKey;
    busy.current = true;

    opacity.value = withTiming(0, { duration: EXIT_MS, easing: motion.easing.in });
    translateX.value = withTiming(-dir * (SHIFT * 0.55), {
      duration: EXIT_MS,
      easing: motion.easing.in,
    });
    scale.value = withTiming(
      SCALE_OUT,
      { duration: EXIT_MS, easing: motion.easing.in },
      (finished) => {
        if (finished) {
          runOnJS(finishEnter)(nextKey, dir);
        } else {
          busy.current = false;
        }
      },
    );
  }, [shellKey, reduced, opacity, translateX, scale, finishEnter]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: translateX.value }, { scale: scale.value }],
  }));

  return (
    <View style={styles.host}>
      <Animated.View style={[styles.shell, style]}>{displayed}</Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  host: { flex: 1, overflow: 'hidden' },
  shell: { flex: 1 },
});
