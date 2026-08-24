import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { ProDaySymbol } from '../../../components/branding/ProDaySymbol';
import { prodayMotion, useReducedMotion } from '../../../motion';
import { AUTH_XP } from './tokens';

type AuthPostLoginRevealProps = {
  active: boolean;
  onDone: () => void;
};

/**
 * Micro-transition post-login ~480ms : logo → fade → destination.
 * Springs prodayMotion ; reduced motion = cut court sans flash.
 * Secours timeout : ne jamais laisser le voile noir bloquer l’UI.
 */
export const AuthPostLoginReveal: React.FC<AuthPostLoginRevealProps> = ({
  active,
  onDone,
}) => {
  const reduced = useReducedMotion();
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.94);
  const doneRef = React.useRef(false);

  useEffect(() => {
    if (!active) {
      doneRef.current = false;
      return;
    }

    doneRef.current = false;
    const finish = () => {
      if (doneRef.current) return;
      doneRef.current = true;
      opacity.value = 0;
      onDone();
    };

    if (reduced) {
      opacity.value = 1;
      scale.value = 1;
      const t = setTimeout(finish, AUTH_XP.motionFast);
      return () => clearTimeout(t);
    }

    opacity.value = withTiming(1, {
      duration: AUTH_XP.motionNormal,
      easing: prodayMotion.easing.out,
    });
    scale.value = withSpring(1, prodayMotion.spring.smooth);

    const t = setTimeout(() => {
      opacity.value = withTiming(
        0,
        { duration: AUTH_XP.motionFast, easing: prodayMotion.easing.in },
        (finished) => {
          if (finished) runOnJS(finish)();
        },
      );
      scale.value = withTiming(1.02, {
        duration: AUTH_XP.motionFast,
        easing: prodayMotion.easing.in,
      });
    }, AUTH_XP.motionReveal);

    const safety = setTimeout(finish, AUTH_XP.motionReveal + AUTH_XP.motionFast + 250);
    return () => {
      clearTimeout(t);
      clearTimeout(safety);
    };
  }, [active, onDone, opacity, reduced, scale]);

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
