import React, { useEffect, useState } from 'react';
import { StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { getMotionPreset, useReducedMotion } from '../../motion';
import { useAppTheme } from '../../context/ProductLineContext';

const { width: W } = Dimensions.get('window');

interface PushScreenTransitionProps {
  active: boolean;
  children: React.ReactNode;
  /** Fond plein écran (ex. #000 coach) — défaut thème produit. */
  backgroundColor?: string;
}

/**
 * Navigation type “stack” / détail — glisse depuis la droite (preset detail).
 */
export const PushScreenTransition: React.FC<PushScreenTransitionProps> = ({
  active,
  children,
  backgroundColor,
}) => {
  const { colors } = useAppTheme();
  const reduced = useReducedMotion();
  const preset = getMotionPreset('detail');
  const [mounted, setMounted] = useState(active);
  const x = useSharedValue(active ? 0 : W);

  useEffect(() => {
    if (active) {
      setMounted(true);
      if (reduced) {
        x.value = 0;
        return;
      }
      x.value = withSpring(0, preset.spring);
    } else if (mounted) {
      if (reduced) {
        x.value = W;
        setMounted(false);
        return;
      }
      x.value = withSpring(W, getMotionPreset('nav').spring, (finished) => {
        if (finished) {
          runOnJS(setMounted)(false);
        }
      });
    }
  }, [active, mounted, x, reduced, preset.spring]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }],
  }));

  if (!mounted) return null;

  return (
    <Animated.View
      style={[styles.overlay, { backgroundColor: backgroundColor ?? colors.background }, style]}
      pointerEvents={active ? 'auto' : 'none'}
    >
      {children}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 20,
  },
});
