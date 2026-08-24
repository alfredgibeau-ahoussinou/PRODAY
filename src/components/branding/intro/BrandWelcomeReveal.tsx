import React, { useCallback, useEffect, useRef } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { ProDayLogo } from '../ProDayLogo';
import { ProDayText } from '../../ui/ProDayText';
import { prodayMotion, useReducedMotion } from '../../../motion';
import { PRODAY_MASTER } from '../../../theme/prodayBrand';
import { BRAND_WELCOME_REVEAL } from './launchIntroFlow';

const WELCOME_COPY = 'Bienvenue';

type BrandWelcomeRevealProps = {
  onComplete: () => void;
};

/**
 * Première peinture cold-start : lockup composé (pas de carré PNG) + Bienvenue,
 * puis sortie fluide vers le sélecteur d’univers.
 */
export const BrandWelcomeReveal: React.FC<BrandWelcomeRevealProps> = ({ onComplete }) => {
  const reduced = useReducedMotion();
  const { width } = useWindowDimensions();
  const doneRef = useRef(false);
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const safetyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const rootOpacity = useSharedValue(1);
  const logoOpacity = useSharedValue(reduced ? 1 : 0);
  const logoScale = useSharedValue(reduced ? 1 : BRAND_WELCOME_REVEAL.logoScaleFrom);
  const welcomeOpacity = useSharedValue(reduced ? 1 : 0);
  const welcomeY = useSharedValue(reduced ? 0 : BRAND_WELCOME_REVEAL.welcomeRisePx);

  const finish = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    onComplete();
  }, [onComplete]);

  const beginExit = useCallback(
    (outMs: number) => {
      rootOpacity.value = withTiming(
        BRAND_WELCOME_REVEAL.exitFloor,
        { duration: outMs, easing: prodayMotion.easing.in },
        (finished) => {
          'worklet';
          if (finished) runOnJS(finish)();
        },
      );
      if (!reduced) {
        logoScale.value = withTiming(0.985, {
          duration: outMs,
          easing: prodayMotion.easing.in,
        });
      }
      safetyTimerRef.current = setTimeout(finish, outMs + 80);
    },
    [finish, logoScale, reduced, rootOpacity],
  );

  useEffect(() => {
    const {
      logoInMs,
      welcomeDelayMs,
      welcomeInMs,
      holdMs,
      holdReducedMs,
      exitMs,
      exitReducedMs,
    } = BRAND_WELCOME_REVEAL;

    if (reduced) {
      holdTimerRef.current = setTimeout(
        () => beginExit(exitReducedMs),
        holdReducedMs,
      );
      return () => {
        if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
        if (safetyTimerRef.current) clearTimeout(safetyTimerRef.current);
      };
    }

    logoOpacity.value = withTiming(1, {
      duration: logoInMs,
      easing: prodayMotion.easing.out,
    });
    logoScale.value = withSpring(1, prodayMotion.spring.smooth);

    welcomeOpacity.value = withDelay(
      welcomeDelayMs,
      withTiming(1, {
        duration: welcomeInMs,
        easing: prodayMotion.easing.out,
      }),
    );
    welcomeY.value = withDelay(
      welcomeDelayMs,
      withTiming(0, {
        duration: welcomeInMs,
        easing: prodayMotion.easing.out,
      }),
    );

    const exitAt = welcomeDelayMs + welcomeInMs + holdMs;
    holdTimerRef.current = setTimeout(() => beginExit(exitMs), exitAt);

    return () => {
      if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
      if (safetyTimerRef.current) clearTimeout(safetyTimerRef.current);
    };
  }, [
    beginExit,
    logoOpacity,
    logoScale,
    reduced,
    welcomeOpacity,
    welcomeY,
  ]);

  const rootStyle = useAnimatedStyle(() => ({
    opacity: rootOpacity.value,
  }));

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  const welcomeStyle = useAnimatedStyle(() => ({
    opacity: welcomeOpacity.value,
    transform: [{ translateY: welcomeY.value }],
  }));

  const lockupWidth = Math.min(220, Math.max(168, width * 0.52));

  return (
    <Animated.View
      style={[styles.root, rootStyle]}
      accessibilityViewIsModal
      accessibilityLabel="Bienvenue sur ProDay"
    >
      <View style={styles.stage}>
        <Animated.View style={[styles.logoBlock, logoStyle]}>
          {/* Symbole + PRODAY composé — pas de tagline (évite le conflit avec Bienvenue). */}
          <ProDayLogo
            width={lockupWidth}
            variant="master"
            onDark
            layout="stacked"
            showPoleLabel={false}
            showTagline={false}
          />
        </Animated.View>
        <Animated.View style={welcomeStyle}>
          <ProDayText variant="title" style={styles.welcome}>
            {WELCOME_COPY}
          </ProDayText>
        </Animated.View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: PRODAY_MASTER.black,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stage: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 28,
  },
  logoBlock: {
    alignItems: 'center',
  },
  welcome: {
    color: PRODAY_MASTER.white,
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: -0.35,
    textAlign: 'center',
  },
});
