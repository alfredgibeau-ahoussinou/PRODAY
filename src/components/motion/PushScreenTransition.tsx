import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Dimensions } from 'react-native';
import Animated, {
  cancelAnimation,
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
 * Garantit le démontage après exit (timeout de secours) pour ne jamais laisser
 * un voile noir bloquer les touches / le contenu des onglets.
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
      exitGen.current += 1;
      setMounted(true);
      cancelAnimation(x);
      cancelAnimation(opacity);
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
      return;
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

    if (directExit) {
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
    } else {
      opacity.value = withTiming(0, {
        duration: preset.exitMs,
        easing: prodayMotion.easing.in,
      });
      x.value = withSpring(W, getMotionPreset('nav').spring, (finished) => {
        if (token !== exitGen.current) return;
        if (finished) runOnJS(forceUnmount)();
      });
    }

    // Secours : si le callback Reanimated ne fire pas, on démonte quand même.
    const safety = setTimeout(forceUnmount, outMs + 120);
    return () => clearTimeout(safety);
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
