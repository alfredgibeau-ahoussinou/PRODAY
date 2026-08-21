import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useReducedMotion } from '../../../hooks/useReducedMotion';
import { adminMotion } from './adminMotion';

type Props = {
  /** true = détail ouvert (push profondeur). */
  active: boolean;
  children: React.ReactNode;
};

/**
 * Sensation de profondeur pour vues détail inline (devis, formulaires).
 * Forward = léger scale-up + slide ; back = inverse.
 */
export function AdminDetailTransition({ active, children }: Props) {
  const reduced = useReducedMotion();
  const progress = useSharedValue(active ? 1 : 0);

  useEffect(() => {
    if (reduced) {
      progress.value = active ? 1 : 0;
      return;
    }
    if (active) {
      progress.value = withSpring(1, adminMotion.spring.smooth);
    } else {
      progress.value = withTiming(0, {
        duration: adminMotion.duration.exit,
        easing: adminMotion.easing.in,
      });
    }
  }, [active, reduced, progress]);

  const style = useAnimatedStyle(() => {
    const p = progress.value;
    return {
      opacity: 0.55 + p * 0.45,
      transform: [
        { translateX: (1 - p) * adminMotion.detailShift },
        {
          scale:
            adminMotion.detailScaleFrom +
            (1 - adminMotion.detailScaleFrom) * p,
        },
      ],
    };
  });

  return <Animated.View style={[styles.fill, style]}>{children}</Animated.View>;
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
});
