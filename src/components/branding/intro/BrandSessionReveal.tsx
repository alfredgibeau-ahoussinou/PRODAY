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
import { prodayHaptics } from '../../../utils/prodayHaptics';
import {
  BRAND_SESSION_COPY,
  BRAND_SESSION_REVEAL,
  type BrandSessionTone,
} from './launchIntroFlow';

type BrandSessionRevealProps = {
  tone: BrandSessionTone;
  onComplete: () => void;
  /** Overlay plein écran (connect/disconnect) vs scène déjà cadrée (intro). */
  fillScreen?: boolean;
};

/**
 * Transition session : lockup composé (pas de PNG carré) + Bienvenue | Au revoir.
 * Même qualité que le cold-start BrandWelcomeReveal.
 */
export const BrandSessionReveal: React.FC<BrandSessionRevealProps> = ({
  tone,
  onComplete,
  fillScreen = true,
}) => {
  const reduced = useReducedMotion();
  const { width } = useWindowDimensions();
  const doneRef = useRef(false);
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const safetyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const rootOpacity = useSharedValue(1);
  const logoOpacity = useSharedValue(reduced ? 1 : 0);
  const logoScale = useSharedValue(reduced ? 1 : BRAND_SESSION_REVEAL.logoScaleFrom);
  const messageOpacity = useSharedValue(reduced ? 1 : 0);
  const messageY = useSharedValue(reduced ? 0 : BRAND_SESSION_REVEAL.messageRisePx);

  const copy = BRAND_SESSION_COPY[tone];
  const a11yLabel =
    tone === 'welcome' ? 'Bienvenue sur ProDay' : 'Au revoir — ProDay';

  const finish = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    onComplete();
  }, [onComplete]);

  const beginExit = useCallback(
    (outMs: number) => {
      rootOpacity.value = withTiming(
        BRAND_SESSION_REVEAL.exitFloor,
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
      messageDelayMs,
      messageInMs,
      holdMs,
      holdReducedMs,
      exitMs,
      exitReducedMs,
    } = BRAND_SESSION_REVEAL;

    if (tone === 'welcome') prodayHaptics.confirm();
    else prodayHaptics.tabSwitch();

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

    messageOpacity.value = withDelay(
      messageDelayMs,
      withTiming(1, {
        duration: messageInMs,
        easing: prodayMotion.easing.out,
      }),
    );
    messageY.value = withDelay(
      messageDelayMs,
      withTiming(0, {
        duration: messageInMs,
        easing: prodayMotion.easing.out,
      }),
    );

    const exitAt = messageDelayMs + messageInMs + holdMs;
    holdTimerRef.current = setTimeout(() => beginExit(exitMs), exitAt);

    return () => {
      if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
      if (safetyTimerRef.current) clearTimeout(safetyTimerRef.current);
    };
  }, [
    beginExit,
    logoOpacity,
    logoScale,
    messageOpacity,
    messageY,
    reduced,
    tone,
  ]);

  const rootStyle = useAnimatedStyle(() => ({
    opacity: rootOpacity.value,
  }));

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  const messageStyle = useAnimatedStyle(() => ({
    opacity: messageOpacity.value,
    transform: [{ translateY: messageY.value }],
  }));

  const lockupWidth = Math.min(220, Math.max(168, width * 0.52));

  return (
    <Animated.View
      style={[fillScreen ? styles.root : styles.embedded, rootStyle]}
      accessibilityViewIsModal={fillScreen}
      accessibilityLabel={a11yLabel}
    >
      <View style={styles.stage}>
        <Animated.View style={[styles.logoBlock, logoStyle]}>
          <ProDayLogo
            width={lockupWidth}
            variant="master"
            onDark
            layout="stacked"
            showPoleLabel={false}
            showTagline={false}
          />
        </Animated.View>
        <Animated.View style={messageStyle}>
          <ProDayText variant="title" style={styles.message}>
            {copy}
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
    zIndex: 50,
  },
  embedded: {
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
  message: {
    color: PRODAY_MASTER.white,
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: -0.35,
    textAlign: 'center',
  },
});
