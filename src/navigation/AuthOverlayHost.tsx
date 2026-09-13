import React, { useEffect, useState, useCallback, useRef } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { AuthScreen } from '../screens/AuthScreen';
import { AppErrorBoundary } from '../components/AppErrorBoundary';
import type { AuthIntent } from '../context/TabNavigationContext';
import type { UserRole } from '../models/User';
import type { CarouselPoleId } from '../models/CarouselPole';
import type { ProductLineId } from '../models/ProductLine';
import { prodayMotion, useReducedMotion } from '../motion';

type Props = {
  intent: AuthIntent;
  signupProductLine?: ProductLineId;
  signupInitialRole?: UserRole;
  initialPole?: CarouselPoleId;
  onDismiss: () => void;
};

const ENTER_DURATION = 260;
const EXIT_DURATION = 200;

/**
 * Auth plein écran — fade doux (pas de slide agressif / flash double).
 */
export function AuthOverlayHost({
  intent,
  signupProductLine,
  signupInitialRole,
  initialPole,
  onDismiss,
}: Props) {
  const reduced = useReducedMotion();
  const opacity = useSharedValue(reduced ? 1 : 0);
  const translateY = useSharedValue(reduced ? 0 : 10);
  const [mounted, setMounted] = useState(true);
  const isClosing = useRef(false);
  const mountedRef = useRef(true);
  const dismissFallback = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (reduced) {
      opacity.value = 1;
      translateY.value = 0;
      return;
    }
    cancelAnimation(opacity);
    cancelAnimation(translateY);

    opacity.value = withTiming(1, {
      duration: ENTER_DURATION,
      easing: prodayMotion.easing.out,
    });
    translateY.value = withTiming(0, {
      duration: ENTER_DURATION,
      easing: prodayMotion.easing.out,
    });
  }, [opacity, reduced, translateY]);

  const finishDismiss = useCallback(() => {
    if (dismissFallback.current) {
      clearTimeout(dismissFallback.current);
      dismissFallback.current = null;
    }
    if (!mountedRef.current) return;
    mountedRef.current = false;
    setMounted(false);
    onDismiss();
  }, [onDismiss]);

  const handleDismiss = useCallback(() => {
    if (isClosing.current) return;
    isClosing.current = true;

    if (reduced) {
      finishDismiss();
      return;
    }

    cancelAnimation(opacity);
    cancelAnimation(translateY);

    opacity.value = withTiming(0, {
      duration: EXIT_DURATION,
      easing: prodayMotion.easing.in,
    });
    translateY.value = withTiming(6, {
      duration: EXIT_DURATION,
      easing: prodayMotion.easing.in,
    }, (finished) => {
      if (finished) {
        runOnJS(finishDismiss)();
      }
    });

    dismissFallback.current = setTimeout(() => {
      finishDismiss();
    }, EXIT_DURATION + 80);
  }, [finishDismiss, opacity, reduced, translateY]);

  useEffect(
    () => () => {
      if (dismissFallback.current) clearTimeout(dismissFallback.current);
    },
    [],
  );

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  if (!mounted) return null;

  return (
    <Animated.View
      style={[styles.fill, style]}
      pointerEvents="auto"
      accessibilityViewIsModal
      accessibilityLabel="Connexion"
    >
      <AppErrorBoundary>
        <AuthScreen
          key={`${intent}-${initialPole ?? 'default'}`}
          initialIntent={intent}
          initialPole={initialPole}
          signupProductLine={signupProductLine}
          signupInitialRole={signupInitialRole}
          onDismiss={handleDismiss}
        />
      </AppErrorBoundary>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  fill: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000',
    zIndex: 200,
    elevation: 200,
  },
});
