import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Dimensions } from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { prodayMotion, useReducedMotion } from '../../motion';
import { PUSH_ENTER_SAFETY_MS, PUSH_EXIT_SAFETY_MS } from '../../motion/safety';
import { useAppTheme } from '../../context/ProductLineContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export { PUSH_ENTER_SAFETY_MS, PUSH_EXIT_SAFETY_MS } from '../../motion/safety';

interface PushScreenTransitionProps {
  active: boolean;
  children: React.ReactNode;
  /** Fond plein écran */
  backgroundColor?: string;
  directExit?: boolean;
  directExitMs?: number;
  /** `fade` = fondu premium (overlays dashboard) ; `push` = slide (détail). */
  variant?: 'push' | 'fade';
}

const PUSH_ENTER_MS = 280;
const PUSH_EXIT_MS = 240;
const FADE_ENTER_MS = 260;
const FADE_EXIT_MS = 200;

/**
 * Navigation type “stack” / détail — push (slide) ou fade overlay.
 */
export const PushScreenTransition: React.FC<PushScreenTransitionProps> = ({
  active,
  children,
  backgroundColor,
  directExit = false,
  directExitMs = 200,
  variant = 'push',
}) => {
  const { colors } = useAppTheme();
  const reduced = useReducedMotion();
  const fade = variant === 'fade';
  const [mounted, setMounted] = useState(active);
  const enterMs = fade ? FADE_ENTER_MS : PUSH_ENTER_MS;
  const exitMs = fade ? FADE_EXIT_MS : PUSH_EXIT_MS;
  const x = useSharedValue(active || fade ? 0 : SCREEN_WIDTH * 0.35);
  const opacity = useSharedValue(active ? 1 : 0);
  const scale = useSharedValue(active || fade ? 1 : 0.985);
  const exitGen = useRef(0);

  useEffect(() => {
    if (active) {
      const token = ++exitGen.current;
      setMounted(true);
      cancelAnimation(x);
      cancelAnimation(opacity);
      cancelAnimation(scale);

      if (reduced) {
        x.value = 0;
        opacity.value = 1;
        scale.value = 1;
        return;
      }

      if (!fade) {
        x.value = withTiming(0, {
          duration: enterMs,
          easing: prodayMotion.easing.out,
        });
        scale.value = withTiming(1, {
          duration: enterMs,
          easing: prodayMotion.easing.out,
        });
      } else {
        x.value = 0;
        scale.value = 1;
      }
      opacity.value = withTiming(
        1,
        {
          duration: fade ? enterMs : enterMs - 40,
          easing: prodayMotion.easing.out,
        },
        (finished) => {
          if (token !== exitGen.current) return;
          if (!finished) {
            cancelAnimation(x);
            cancelAnimation(opacity);
            cancelAnimation(scale);
            x.value = 0;
            opacity.value = 1;
            scale.value = 1;
          }
        },
      );

      const enterSafety = setTimeout(() => {
        if (token !== exitGen.current) return;
        cancelAnimation(x);
        cancelAnimation(opacity);
        cancelAnimation(scale);
        x.value = 0;
        opacity.value = 1;
        scale.value = 1;
      }, enterMs + PUSH_ENTER_SAFETY_MS);

      return () => clearTimeout(enterSafety);
    }

    if (!mounted) return;

    const token = ++exitGen.current;
    const forceUnmount = () => {
      if (token !== exitGen.current) return;
      cancelAnimation(x);
      cancelAnimation(opacity);
      cancelAnimation(scale);
      opacity.value = 0;
      x.value = fade ? 0 : SCREEN_WIDTH * 0.35;
      scale.value = fade ? 1 : 0.985;
      setMounted(false);
    };

    if (reduced) {
      forceUnmount();
      return;
    }

    const outMs = directExit
      ? Math.max(140, Math.min(directExitMs, 260))
      : exitMs;

    cancelAnimation(x);
    cancelAnimation(opacity);
    cancelAnimation(scale);

    if (!fade) {
      opacity.value = withTiming(0, {
        duration: outMs,
        easing: prodayMotion.easing.in,
      });
      x.value = withTiming(
        SCREEN_WIDTH * 0.35,
        { duration: outMs, easing: prodayMotion.easing.in },
        (finished) => {
          if (token !== exitGen.current) return;
          runOnJS(forceUnmount)();
        },
      );
      scale.value = withTiming(0.985, {
        duration: outMs,
        easing: prodayMotion.easing.in,
      });
    } else {
      opacity.value = withTiming(
        0,
        { duration: outMs, easing: prodayMotion.easing.in },
        (finished) => {
          if (token !== exitGen.current) return;
          runOnJS(forceUnmount)();
        },
      );
    }

    const safety = setTimeout(forceUnmount, outMs + PUSH_EXIT_SAFETY_MS);
    return () => clearTimeout(safety);
  }, [
    active,
    directExit,
    directExitMs,
    mounted,
    x,
    opacity,
    scale,
    reduced,
    fade,
    enterMs,
    exitMs,
  ]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: fade
      ? []
      : [{ translateX: x.value }, { scale: scale.value }],
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
