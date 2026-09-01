import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { AuthScreen } from '../screens/AuthScreen';
import type { AuthIntent } from '../context/TabNavigationContext';
import type { UserRole } from '../models/User';
import type { CarouselPoleId } from '../models/CarouselPole';
import type { ProductLineId } from '../models/ProductLine';
import { prodayMotion, useReducedMotion } from '../motion';
import { AUTH_OVERLAY_ENTER } from './authOverlay';

type Props = {
  intent: AuthIntent;
  signupProductLine?: ProductLineId;
  signupInitialRole?: UserRole;
  initialPole?: CarouselPoleId;
  onDismiss: () => void;
};

/**
 * Auth plein écran par-dessus l’onglet courant.
 * Fade-in léger depuis un plancher > 0. Unmount immédiat au dismiss.
 */
export function AuthOverlayHost({
  intent,
  signupProductLine,
  signupInitialRole,
  initialPole,
  onDismiss,
}: Props) {
  const reduced = useReducedMotion();
  const opacity = useSharedValue(reduced ? 1 : AUTH_OVERLAY_ENTER.fromOpacity);

  useEffect(() => {
    if (reduced) {
      opacity.value = 1;
      return;
    }
    cancelAnimation(opacity);
    opacity.value = AUTH_OVERLAY_ENTER.fromOpacity;
    opacity.value = withTiming(
      1,
      { duration: AUTH_OVERLAY_ENTER.ms, easing: prodayMotion.easing.out },
      (finished) => {
        if (!finished) {
          cancelAnimation(opacity);
          opacity.value = 1;
        }
      },
    );
    const safety = setTimeout(() => {
      cancelAnimation(opacity);
      opacity.value = 1;
    }, AUTH_OVERLAY_ENTER.ms + AUTH_OVERLAY_ENTER.safetyMs);
    return () => clearTimeout(safety);
  }, [opacity, reduced]);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[styles.fill, style]}
      pointerEvents="auto"
      accessibilityViewIsModal
      accessibilityLabel="Connexion"
    >
      <AuthScreen
        key={`${intent}-${initialPole ?? 'default'}`}
        initialIntent={intent}
        initialPole={initialPole}
        signupProductLine={signupProductLine}
        signupInitialRole={signupInitialRole}
        onDismiss={onDismiss}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  fill: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 200,
    elevation: 200,
  },
});
