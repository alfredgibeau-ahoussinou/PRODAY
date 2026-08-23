import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { ProDaySymbol } from '../../../components/branding/ProDaySymbol';
import { AUTH_XP } from './tokens';

type AuthPostLoginRevealProps = {
  active: boolean;
  onDone: () => void;
};

/**
 * Micro-transition post-login 300–600ms : logo → fade → destination.
 * Pas de fake loader 3s.
 */
export const AuthPostLoginReveal: React.FC<AuthPostLoginRevealProps> = ({
  active,
  onDone,
}) => {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.92);

  useEffect(() => {
    if (!active) return;
    opacity.value = withTiming(1, {
      duration: AUTH_XP.motionNormal,
      easing: Easing.out(Easing.cubic),
    });
    scale.value = withTiming(1, {
      duration: AUTH_XP.motionReveal,
      easing: Easing.out(Easing.cubic),
    });
    const t = setTimeout(() => {
      opacity.value = withTiming(
        0,
        { duration: AUTH_XP.motionFast, easing: Easing.in(Easing.cubic) },
        (finished) => {
          if (finished) runOnJS(onDone)();
        },
      );
    }, AUTH_XP.motionReveal);
    return () => clearTimeout(t);
  }, [active, onDone, opacity, scale]);

  const anim = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  if (!active) return null;

  return (
    <View style={styles.overlay} pointerEvents="auto">
      <Animated.View style={[styles.center, anim]}>
        <ProDaySymbol size={72} variant="master" tone="white" />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: AUTH_XP.black,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 50,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
