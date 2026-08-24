import React, { useEffect } from 'react';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { prodayMotion, useReducedMotion } from '../../../motion';
import { AUTH_XP } from './tokens';

type AuthEnterProps = {
  children: React.ReactNode;
  /** Décalage d’entrée (ms) — brand avant form. */
  delayMs?: number;
  style?: StyleProp<ViewStyle>;
  /** Remplit le parent (panneau brand wide). */
  fill?: boolean;
};

/**
 * Entrée légère logo / panneau (opacity + scale) — respect reduced motion.
 */
export const AuthEnter: React.FC<AuthEnterProps> = ({
  children,
  delayMs = 0,
  style,
  fill = false,
}) => {
  const reduced = useReducedMotion();
  const opacity = useSharedValue(reduced ? 1 : 0);
  const scale = useSharedValue(reduced ? 1 : 0.97);
  const translateY = useSharedValue(reduced ? 0 : 10);

  useEffect(() => {
    if (reduced) {
      opacity.value = 1;
      scale.value = 1;
      translateY.value = 0;
      return;
    }
    const start = () => {
      opacity.value = withTiming(1, {
        duration: AUTH_XP.motionNormal,
        easing: prodayMotion.easing.out,
      });
      scale.value = withSpring(1, prodayMotion.spring.smooth);
      translateY.value = withTiming(0, {
        duration: AUTH_XP.motionNormal,
        easing: prodayMotion.easing.out,
      });
    };
    if (delayMs <= 0) {
      start();
      return;
    }
    const t = setTimeout(start, delayMs);
    return () => clearTimeout(t);
  }, [delayMs, opacity, reduced, scale, translateY]);

  const anim = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
  }));

  return (
    <Animated.View style={[fill ? styles.fill : null, style, anim]}>{children}</Animated.View>
  );
};

type AuthModeSwitchProps = {
  modeKey: string;
  children: React.ReactNode;
};

/**
 * Crossfade login ↔ teaser signup — évite le flash de swap brut.
 */
export const AuthModeSwitch: React.FC<AuthModeSwitchProps> = ({ modeKey, children }) => {
  const reduced = useReducedMotion();
  const opacity = useSharedValue(1);
  const translateY = useSharedValue(0);
  const keyRef = React.useRef(modeKey);
  const [displayed, setDisplayed] = React.useState(children);

  useEffect(() => {
    if (modeKey === keyRef.current) {
      setDisplayed(children);
      return;
    }
    keyRef.current = modeKey;
    if (reduced) {
      setDisplayed(children);
      opacity.value = 1;
      translateY.value = 0;
      return;
    }
    opacity.value = withTiming(0, {
      duration: AUTH_XP.motionFast,
      easing: prodayMotion.easing.in,
    });
    translateY.value = withTiming(6, {
      duration: AUTH_XP.motionFast,
      easing: prodayMotion.easing.in,
    });
    const t = setTimeout(() => {
      setDisplayed(children);
      opacity.value = 0;
      translateY.value = 8;
      opacity.value = withTiming(1, {
        duration: AUTH_XP.motionNormal,
        easing: prodayMotion.easing.out,
      });
      translateY.value = withTiming(0, {
        duration: AUTH_XP.motionNormal,
        easing: prodayMotion.easing.out,
      });
    }, AUTH_XP.motionFast);
    return () => clearTimeout(t);
  }, [children, modeKey, opacity, reduced, translateY]);

  const anim = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return <Animated.View style={anim}>{displayed}</Animated.View>;
};

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
});
