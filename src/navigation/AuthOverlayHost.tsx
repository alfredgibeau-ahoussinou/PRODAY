import React, { useEffect, useState, useCallback, useRef } from 'react';
import { StyleSheet, Dimensions } from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { AuthScreen } from '../screens/AuthScreen';
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

const { height: SCREEN_H } = Dimensions.get('window');
const ENTER_DURATION = 220;
const EXIT_DURATION = 180;

/**
 * Auth plein écran — fade + léger rise (pas de slide agressif).
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
  const translateY = useSharedValue(reduced ? 0 : 18);
  const scale = useSharedValue(reduced ? 1 : 0.99);
  const [mounted, setMounted] = useState(true);
  const isClosing = useRef(false);

  useEffect(() => {
    if (reduced) {
      opacity.value = 1;
      translateY.value = 0;
      scale.value = 1;
      return;
    }
    cancelAnimation(opacity);
    cancelAnimation(translateY);
    cancelAnimation(scale);

    opacity.value = withTiming(1, {
      duration: ENTER_DURATION,
      easing: prodayMotion.easing.out,
    });
    translateY.value = withTiming(0, {
      duration: ENTER_DURATION,
      easing: prodayMotion.easing.out,
    });
    scale.value = withTiming(1, {
      duration: ENTER_DURATION,
      easing: prodayMotion.easing.out,
    });
  }, [opacity, reduced, scale, translateY]);

  const handleDismiss = useCallback(() => {
    if (isClosing.current) return;
    isClosing.current = true;

    if (reduced) {
      onDismiss();
      return;
    }

    cancelAnimation(opacity);
    cancelAnimation(translateY);
    cancelAnimation(scale);

    opacity.value = withTiming(0, {
      duration: EXIT_DURATION,
      easing: prodayMotion.easing.in,
    });
    translateY.value = withTiming(12, {
      duration: EXIT_DURATION,
      easing: prodayMotion.easing.in,
    });
    scale.value = withTiming(0.99, {
      duration: EXIT_DURATION,
      easing: prodayMotion.easing.in,
    }, (finished) => {
      if (finished) {
        runOnJS(onDismiss)();
      }
    });

    setTimeout(() => {
      onDismiss();
    }, EXIT_DURATION + 60);
  }, [onDismiss, opacity, reduced, scale, translateY]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  if (!mounted) return null;

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
        onDismiss={handleDismiss}
      />
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
