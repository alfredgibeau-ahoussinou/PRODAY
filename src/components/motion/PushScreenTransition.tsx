import React, { useEffect, useState } from 'react';
import { StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { getMotionPreset, prodayMotion, useReducedMotion } from '../../motion';
import { useAppTheme } from '../../context/ProductLineContext';

const { width: W } = Dimensions.get('window');

interface PushScreenTransitionProps {
  active: boolean;
  children: React.ReactNode;
  /** Fond plein écran (ex. #000 coach) — défaut thème produit. */
  backgroundColor?: string;
  /**
   * Sortie courte en timing (pas de spring) — évite le double « redo »
   * quand un enfant a déjà une leave locale (ex. sélecteur d’univers).
   */
  directExit?: boolean;
  /** Durée exit en mode directExit (ms). */
  directExitMs?: number;
}

/**
 * Navigation type “stack” / détail — glisse depuis la droite + fade (preset detail).
 */
export const PushScreenTransition: React.FC<PushScreenTransitionProps> = ({
  active,
  children,
  backgroundColor,
  directExit = false,
  directExitMs = 220,
}) => {
  const { colors } = useAppTheme();
  const reduced = useReducedMotion();
  const preset = getMotionPreset('detail');
  const [mounted, setMounted] = useState(active);
  const x = useSharedValue(active ? 0 : W);
  const opacity = useSharedValue(active ? 1 : 0);

  useEffect(() => {
    if (active) {
      setMounted(true);
      if (reduced) {
        x.value = 0;
        opacity.value = 1;
        return;
      }
      x.value = withSpring(0, preset.spring);
      opacity.value = withTiming(1, {
        duration: preset.enterMs,
        easing: prodayMotion.easing.out,
      });
    } else if (mounted) {
      if (reduced) {
        x.value = W;
        opacity.value = 0;
        setMounted(false);
        return;
      }
      if (directExit) {
        const outMs = Math.max(120, Math.min(directExitMs, 280));
        opacity.value = withTiming(0, {
          duration: outMs,
          easing: prodayMotion.easing.in,
        });
        x.value = withTiming(
          W,
          { duration: outMs, easing: prodayMotion.easing.in },
          (finished) => {
            if (finished) {
              runOnJS(setMounted)(false);
            }
          },
        );
        return;
      }
      opacity.value = withTiming(0, {
        duration: preset.exitMs,
        easing: prodayMotion.easing.in,
      });
      x.value = withSpring(W, getMotionPreset('nav').spring, (finished) => {
        if (finished) {
          runOnJS(setMounted)(false);
        }
      });
    }
  }, [
    active,
    directExit,
    directExitMs,
    mounted,
    x,
    opacity,
    reduced,
    preset.spring,
    preset.enterMs,
    preset.exitMs,
  ]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
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
