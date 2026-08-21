import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { getMotionPreset } from '../presets';
import { prodayMotion } from '../tokens';
import type { MotionContext } from '../types';

type Props = {
  active: boolean;
  children: React.ReactNode;
  /** `detail` (défaut) ou `form`. */
  context?: Extract<MotionContext, 'detail' | 'form'>;
};

/**
 * Sensation de profondeur pour vues détail / formulaires inline.
 * Forward = scale + slide ; back = inverse.
 */
export function DetailTransition({
  active,
  children,
  context = 'detail',
}: Props) {
  const reduced = useReducedMotion();
  const preset = getMotionPreset(context);
  const progress = useSharedValue(active ? 1 : 0);

  useEffect(() => {
    if (reduced) {
      progress.value = active ? 1 : 0;
      return;
    }
    if (active) {
      progress.value = withSpring(1, preset.spring);
    } else {
      progress.value = withTiming(0, {
        duration: preset.exitMs,
        easing: prodayMotion.easing.in,
      });
    }
  }, [active, reduced, progress, preset.spring, preset.exitMs]);

  const style = useAnimatedStyle(() => {
    const p = progress.value;
    return {
      opacity: 0.55 + p * 0.45,
      transform: [
        { translateX: (1 - p) * preset.shift },
        {
          scale: preset.scaleFrom + (1 - preset.scaleFrom) * p,
        },
      ],
    };
  });

  return <Animated.View style={[styles.fill, style]}>{children}</Animated.View>;
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
});
