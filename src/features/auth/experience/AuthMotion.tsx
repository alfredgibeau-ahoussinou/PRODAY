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
 * Secours : force visible après délai max (évite écran noir si Reanimated rate).
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
    const forceVisible = () => {
      opacity.value = 1;
      scale.value = 1;
      translateY.value = 0;
    };

    if (reduced) {
      forceVisible();
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

    const safety = setTimeout(forceVisible, delayMs + AUTH_XP.motionNormal + 200);
    if (delayMs <= 0) {
      start();
      return () => clearTimeout(safety);
    }
    const t = setTimeout(start, delayMs);
    return () => {
      clearTimeout(t);
      clearTimeout(safety);
    };
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
    const safety = setTimeout(() => {
      opacity.value = 1;
      translateY.value = 0;
    }, AUTH_XP.motionFast + AUTH_XP.motionNormal + 200);
    return () => {
      clearTimeout(t);
      clearTimeout(safety);
    };
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
