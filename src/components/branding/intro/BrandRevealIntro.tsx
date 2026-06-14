import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  useWindowDimensions,
  Platform,
} from 'react-native';
import Animated, {
  Easing,
  Extrapolation,
  cancelAnimation,
  FadeInDown,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BRANDING_LOGOS } from '../../../content/brandingAssets';
import { BRAND, spacing, radius, shadows } from '../../../theme/designTokens';
import { useAppTheme } from '../../../context/ProductLineContext';
import type { AppColors } from '../../../theme/universeTheme';
import { UniverseChoicePager } from './UniverseChoicePager';
import type { ProductLineId } from '../../../models/ProductLine';

const HERO_ASPECT = 0.93;
const LOGO_REVEAL_MS = 1080;

type IntroPhase = 'reveal' | 'choose';

export type IntroSpaceChoice = ProductLineId;

interface BrandRevealIntroProps {
  onChooseSpace: (space: IntroSpaceChoice) => void;
  /** Tour auto Men / Women / Pro (première ouverture uniquement). */
  introTour?: boolean;
}

/**
 * Intro — logo ProDay puis carousel avec tour des trois univers.
 */
export const BrandRevealIntro: React.FC<BrandRevealIntroProps> = ({
  onChooseSpace,
  introTour = false,
}) => {
  const { colors: c } = useAppTheme();
  const styles = useMemo(() => createStyles(c), [c.background, c.border, c.surface, c.text, c.textMuted]);
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const logoW = Math.min(168, width - spacing.xl * 2);
  const logoH = logoW / HERO_ASPECT;
  const [phase, setPhase] = useState<IntroPhase>('reveal');
  const t = useSharedValue(0);

  const showChoice = useCallback(() => setPhase('choose'), []);

  useEffect(() => {
    if (phase !== 'reveal') return undefined;
    t.value = 0;
    t.value = withTiming(
      1,
      { duration: LOGO_REVEAL_MS, easing: Easing.bezier(0.22, 1, 0.36, 1) },
      (done) => {
        if (done) runOnJS(showChoice)();
      }
    );
    return () => cancelAnimation(t);
  }, [phase, showChoice, t]);

  const sceneStyle = useAnimatedStyle(() => ({
    opacity: interpolate(t.value, [0, 0.1], [0, 1], Extrapolation.CLAMP),
  }));

  return (
    <Animated.View
      style={[styles.root, phase === 'reveal' ? sceneStyle : undefined, { paddingTop: insets.top }]}
      accessibilityViewIsModal
    >
      {phase === 'reveal' ? (
        <View style={[styles.center, { paddingBottom: insets.bottom }]}>
          <BrandMark logoW={logoW} logoH={logoH} t={t} />
        </View>
      ) : (
        <Animated.View
          entering={FadeInDown.duration(560).springify().damping(18).stiffness(120)}
          style={[styles.chooseRoot, { paddingBottom: insets.bottom }]}
        >
          <UniverseChoicePager onChoose={onChooseSpace} introTour={introTour} />
        </Animated.View>
      )}
    </Animated.View>
  );
};

const BrandMark: React.FC<{
  logoW: number;
  logoH: number;
  t: SharedValue<number>;
}> = ({ logoW, logoH, t }) => {
  const { colors: c } = useAppTheme();
  const styles = useMemo(() => createStyles(c), [c.background, c.border, c.surface, c.text, c.textMuted]);
  const wrap = useAnimatedStyle(() => ({
    opacity: interpolate(t.value, [0, 0.18], [0, 1], Extrapolation.CLAMP),
    transform: [
      { translateY: interpolate(t.value, [0, 0.5], [32, 0], Extrapolation.CLAMP) },
      { scale: interpolate(t.value, [0, 0.5], [0.86, 1], Extrapolation.CLAMP) },
    ],
  }));

  const nameStyle = useAnimatedStyle(() => ({
    opacity: interpolate(t.value, [0.38, 0.62], [0, 1], Extrapolation.CLAMP),
    transform: [
      { translateY: interpolate(t.value, [0.38, 0.62], [10, 0], Extrapolation.CLAMP) },
    ],
  }));

  const hintStyle = useAnimatedStyle(() => ({
    opacity: interpolate(t.value, [0.52, 0.78], [0, 1], Extrapolation.CLAMP),
    transform: [
      { translateY: interpolate(t.value, [0.52, 0.78], [8, 0], Extrapolation.CLAMP) },
    ],
  }));

  return (
    <Animated.View style={[styles.markWrap, wrap]}>
      <View style={[styles.logoCard, shadows.card]}>
        <Image
          source={BRANDING_LOGOS.transparent}
          style={{ width: logoW, height: logoH }}
          resizeMode="contain"
          accessibilityLabel={BRAND.name}
        />
      </View>
      <Animated.Text style={[styles.brandName, nameStyle]}>{BRAND.name}</Animated.Text>
      <Animated.Text style={[styles.brandHint, hintStyle]}>Men · Women · Pro · Santé</Animated.Text>
    </Animated.View>
  );
};

function createStyles(c: AppColors) {
  return StyleSheet.create({
    root: {
      ...StyleSheet.absoluteFillObject,
      zIndex: 1000,
      elevation: 1000,
      backgroundColor: c.background,
    },
    center: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: spacing.xl,
    },
    chooseRoot: {
      flex: 1,
    },
    markWrap: { alignItems: 'center', gap: spacing.sm },
    logoCard: {
      backgroundColor: c.surface,
      borderRadius: radius.xl,
      borderWidth: 1,
      borderColor: c.border,
      paddingVertical: spacing.lg,
      paddingHorizontal: spacing.lg,
      alignItems: 'center',
    },
    brandName: {
      fontSize: 24,
      fontWeight: '900',
      color: c.text,
      letterSpacing: -0.6,
    },
    brandHint: {
      fontSize: 12,
      fontWeight: '600',
      color: c.textMuted,
      letterSpacing: 0.3,
      ...Platform.select({ android: { includeFontPadding: false } }),
    },
  });
}
