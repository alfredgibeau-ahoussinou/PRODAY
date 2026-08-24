import React, { useEffect } from 'react';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  cancelAnimation,
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
  const opacity = useSharedValue(reduced ? 1 : prodayMotion.holdOpacity);
  const scale = useSharedValue(reduced ? 1 : 0.98);
  const translateY = useSharedValue(reduced ? 0 : 8);

  useEffect(() => {
    const forceVisible = () => {
      cancelAnimation(opacity);
      cancelAnimation(scale);
      cancelAnimation(translateY);
      opacity.value = 1;
      scale.value = 1;
      translateY.value = 0;
    };

    if (reduced) {
      forceVisible();
      return;
    }

    const start = () => {
      opacity.value = withTiming(
        1,
        {
          duration: AUTH_XP.motionNormal,
          easing: prodayMotion.easing.out,
        },
        (finished) => {
          if (!finished) {
            cancelAnimation(opacity);
            cancelAnimation(scale);
            cancelAnimation(translateY);
            opacity.value = 1;
            scale.value = 1;
            translateY.value = 0;
          }
        },
      );
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
 * Crossfade login ↔ teaser signup — une phase, jamais opacity 0.
 */
export const AuthModeSwitch: React.FC<AuthModeSwitchProps> = ({ modeKey, children }) => {
  const reduced = useReducedMotion();
  const opacity = useSharedValue(1);
  const translateY = useSharedValue(0);
  const keyRef = React.useRef(modeKey);
  const gen = React.useRef(0);
  const [displayed, setDisplayed] = React.useState(children);

  useEffect(() => {
    if (modeKey === keyRef.current) {
      setDisplayed(children);
      return;
    }
    keyRef.current = modeKey;
    setDisplayed(children);

    if (reduced) {
      cancelAnimation(opacity);
      cancelAnimation(translateY);
      opacity.value = 1;
      translateY.value = 0;
      return;
    }

    const token = ++gen.current;
    cancelAnimation(opacity);
    cancelAnimation(translateY);
    opacity.value = prodayMotion.holdOpacity;
    translateY.value = 6;
    opacity.value = withTiming(
      1,
      { duration: AUTH_XP.motionNormal, easing: prodayMotion.easing.out },
      (finished) => {
        if (token !== gen.current) return;
        if (!finished) {
          cancelAnimation(opacity);
          cancelAnimation(translateY);
          opacity.value = 1;
          translateY.value = 0;
        }
      },
    );
    translateY.value = withTiming(0, {
      duration: AUTH_XP.motionNormal,
      easing: prodayMotion.easing.out,
    });

    const safety = setTimeout(() => {
      if (token !== gen.current) return;
      cancelAnimation(opacity);
      cancelAnimation(translateY);
      opacity.value = 1;
      translateY.value = 0;
    }, AUTH_XP.motionNormal + 200);
    return () => clearTimeout(safety);
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
