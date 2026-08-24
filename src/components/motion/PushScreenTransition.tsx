import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Dimensions } from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { getMotionPreset, prodayMotion, useReducedMotion } from '../../motion';
import { PUSH_ENTER_SAFETY_MS, PUSH_EXIT_SAFETY_MS } from '../../motion/safety';
import { useAppTheme } from '../../context/ProductLineContext';

const { width: W } = Dimensions.get('window');

export { PUSH_ENTER_SAFETY_MS, PUSH_EXIT_SAFETY_MS } from '../../motion/safety';

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
 * Timing only (pas de spring) — plus court, plus direct.
 * Démontage garanti après exit (timeout de secours).
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
  const exitGen = useRef(0);

  useEffect(() => {
    if (active) {
      const token = ++exitGen.current;
      setMounted(true);
      cancelAnimation(x);
      cancelAnimation(opacity);
      if (reduced) {
        x.value = 0;
        opacity.value = 1;
        return;
      }
      if (opacity.value < prodayMotion.holdOpacity) {
        opacity.value = prodayMotion.holdOpacity;
      }
      x.value = withTiming(0, {
        duration: preset.enterMs,
        easing: prodayMotion.easing.out,
      });
      opacity.value = withTiming(
        1,
        {
          duration: preset.enterMs,
          easing: prodayMotion.easing.out,
        },
        (finished) => {
          if (token !== exitGen.current) return;
          if (!finished) {
            cancelAnimation(x);
            cancelAnimation(opacity);
            x.value = 0;
            opacity.value = 1;
          }
        },
      );
      const enterSafety = setTimeout(() => {
        if (token !== exitGen.current) return;
        cancelAnimation(x);
        cancelAnimation(opacity);
        x.value = 0;
        opacity.value = 1;
      }, preset.enterMs + PUSH_ENTER_SAFETY_MS);
      return () => clearTimeout(enterSafety);
    }

    if (!mounted) return;

    const token = ++exitGen.current;
    const forceUnmount = () => {
      if (token !== exitGen.current) return;
      cancelAnimation(x);
      cancelAnimation(opacity);
      opacity.value = 0;
      x.value = W;
      setMounted(false);
    };

    if (reduced) {
      forceUnmount();
      return;
    }

    const outMs = directExit
      ? Math.max(120, Math.min(directExitMs, 280))
      : Math.max(preset.exitMs, 180);

    cancelAnimation(x);
    cancelAnimation(opacity);
    opacity.value = withTiming(0, {
      duration: outMs,
      easing: prodayMotion.easing.in,
    });
    x.value = withTiming(
      W,
      { duration: outMs, easing: prodayMotion.easing.in },
      (finished) => {
        if (token !== exitGen.current) return;
        if (finished) runOnJS(forceUnmount)();
      },
    );

    const safety = setTimeout(forceUnmount, outMs + PUSH_EXIT_SAFETY_MS);
    return () => clearTimeout(safety);
  }, [
    active,
    directExit,
    directExitMs,
    mounted,
    x,
    opacity,
    reduced,
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
