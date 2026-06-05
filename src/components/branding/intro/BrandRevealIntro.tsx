import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  useWindowDimensions,
  Platform,
  ScrollView,
} from 'react-native';
import Animated, {
  Easing,
  Extrapolation,
  cancelAnimation,
  FadeIn,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BRANDING_LOGOS } from '../../../content/brandingAssets';
import { BRAND, colors, spacing, radius, shadows } from '../../../theme/designTokens';
import { UniverseChoiceCard } from './UniverseChoiceCard';
import type { ProductLineId } from '../../../models/ProductLine';

const HERO_ASPECT = 0.93;
const REVEAL_MS = 1100;
const WORDS = BRAND.tagline.split(' • ');

export type IntroSpaceChoice = ProductLineId;

interface BrandRevealIntroProps {
  onChooseSpace: (space: IntroSpaceChoice) => void;
}

const UNIVERSE_ORDER: ProductLineId[] = ['homme', 'woman', 'pro'];

/**
 * Intro — choix ProDay Homme / Woman / Pro avec mini-présentation par carte.
 */
export const BrandRevealIntro: React.FC<BrandRevealIntroProps> = ({ onChooseSpace }) => {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const logoW = Math.min(168, width - spacing.xl * 2);
  const logoH = logoW / HERO_ASPECT;
  const [phase, setPhase] = useState<'reveal' | 'choose'>('reveal');
  const t = useSharedValue(0);
  const compactHeader = height < 740;

  const showChoice = useCallback(() => setPhase('choose'), []);

  useEffect(() => {
    t.value = 0;
    t.value = withTiming(1, { duration: REVEAL_MS, easing: Easing.out(Easing.cubic) }, (done) => {
      if (done) runOnJS(showChoice)();
    });
    return () => cancelAnimation(t);
  }, [showChoice, t]);

  const sceneStyle = useAnimatedStyle(() => ({
    opacity: phase === 'choose' ? 1 : interpolate(t.value, [0, 0.12], [0, 1], Extrapolation.CLAMP),
  }));

  return (
    <Animated.View
      style={[styles.root, sceneStyle, { paddingTop: insets.top }]}
      accessibilityViewIsModal
    >
      {phase === 'reveal' ? (
        <View style={[styles.center, { paddingBottom: insets.bottom }]}>
          <BrandMark logoW={logoW} logoH={logoH} t={t} compact={false} />
          <BrandTagline t={t} />
        </View>
      ) : (
        <Animated.View entering={FadeIn.duration(400)} style={styles.chooseRoot}>
          <View style={[styles.chooseHeader, compactHeader && styles.chooseHeaderCompact]}>
            <BrandMark logoW={compactHeader ? 72 : 88} logoH={(compactHeader ? 72 : 88) / HERO_ASPECT} t={t} compact />
            <Text style={styles.choiceTitle}>Choisissez votre univers</Text>
            <Text style={styles.choiceSub}>
              Une app ProDay — trois expériences distinctes, même exigence.
            </Text>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: insets.bottom + spacing.xl },
            ]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {UNIVERSE_ORDER.map((line, index) => (
              <UniverseChoiceCard
                key={line}
                line={line}
                index={index}
                onPress={() => onChooseSpace(line)}
              />
            ))}
          </ScrollView>
        </Animated.View>
      )}
    </Animated.View>
  );
};

const BrandMark: React.FC<{
  logoW: number;
  logoH: number;
  t: SharedValue<number>;
  compact: boolean;
}> = ({ logoW, logoH, t, compact }) => {
  const wrap = useAnimatedStyle(() => ({
    opacity: interpolate(t.value, [0, 0.2], [0, 1], Extrapolation.CLAMP),
    transform: [
      { translateY: interpolate(t.value, [0, 0.35], [compact ? 0 : 16, 0], Extrapolation.CLAMP) },
      { scale: interpolate(t.value, [0, 0.35], [0.92, 1], Extrapolation.CLAMP) },
    ],
  }));

  return (
    <Animated.View style={[styles.markWrap, wrap]}>
      <View style={[styles.logoCard, compact && styles.logoCardCompact, shadows.card]}>
        <Image
          source={BRANDING_LOGOS.transparent}
          style={{ width: logoW, height: logoH }}
          resizeMode="contain"
          accessibilityLabel={BRAND.name}
        />
      </View>
      {!compact ? <Text style={styles.brandName}>{BRAND.name}</Text> : null}
    </Animated.View>
  );
};

const BrandTagline: React.FC<{ t: SharedValue<number> }> = ({ t }) => {
  const wrap = useAnimatedStyle(() => ({
    opacity: interpolate(t.value, [0.45, 0.7], [0, 1], Extrapolation.CLAMP),
  }));

  return (
    <Animated.View style={[styles.taglineBlock, wrap]}>
      <View style={styles.taglineRow}>
        {WORDS.map((word) => (
          <Text key={word} style={styles.word}>
            {word}
          </Text>
        ))}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
    elevation: 1000,
    backgroundColor: colors.background,
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
  chooseHeader: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  chooseHeaderCompact: {
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    gap: spacing.md,
  },
  markWrap: { alignItems: 'center' },
  logoCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
  logoCardCompact: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.lg,
  },
  brandName: {
    marginTop: spacing.md,
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.5,
  },
  taglineBlock: { marginTop: spacing.lg, alignItems: 'center' },
  taglineRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 4 },
  word: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 2.2,
    textTransform: 'uppercase',
    color: colors.textMuted,
    ...Platform.select({ android: { includeFontPadding: false } }),
  },
  choiceTitle: {
    marginTop: spacing.sm,
    fontSize: 20,
    fontWeight: '900',
    color: colors.text,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  choiceSub: {
    marginTop: 4,
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 300,
  },
});
