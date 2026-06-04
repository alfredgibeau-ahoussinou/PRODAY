import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Pressable,
  useWindowDimensions,
  Platform,
} from 'react-native';
import Animated, {
  Easing,
  Extrapolation,
  cancelAnimation,
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
import { PRODAY_WOMAN_BRAND } from '../../../models/ProductLine';
import { Logo } from '../../Logo';
import { motion } from '../../../theme/motion';

const HERO_ASPECT = 0.93;
const REVEAL_MS = 1100;
const EASE = motion.easing.out;
const WORDS = BRAND.tagline.split(' • ');
const WOMAN_ACCENT = '#BE185D';

export type IntroSpaceChoice = 'standard' | 'woman';

interface BrandRevealIntroProps {
  onChooseSpace: (space: IntroSpaceChoice) => void;
}

/**
 * Intro courte — logo puis choix ProDay classique / For women.
 */
export const BrandRevealIntro: React.FC<BrandRevealIntroProps> = ({ onChooseSpace }) => {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const logoW = Math.min(168, width - spacing.xl * 2);
  const logoH = logoW / HERO_ASPECT;
  const [phase, setPhase] = useState<'reveal' | 'choose'>('reveal');
  const t = useSharedValue(0);

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
      style={[styles.root, sceneStyle, { paddingTop: insets.top, paddingBottom: insets.bottom }]}
      accessibilityViewIsModal
    >
      <View style={styles.center}>
        <BrandMark logoW={logoW} logoH={logoH} t={t} compact={phase === 'choose'} />
        {phase === 'reveal' ? <BrandTagline t={t} /> : null}
      </View>

      {phase === 'choose' ? (
        <View style={[styles.choiceDock, { paddingBottom: insets.bottom + spacing.lg }]}>
          <Text style={styles.choiceTitle}>Choisissez votre espace</Text>
          <Text style={styles.choiceSub}>Même application — expérience adaptée à votre univers.</Text>

          <Pressable
            style={[styles.choiceBtn, styles.choiceBtnClassic]}
            onPress={() => onChooseSpace('standard')}
          >
            <Text style={styles.choiceBtnTitle}>{BRAND.name}</Text>
            <Text style={styles.choiceBtnSub}>Football classique — Mercato, matchs, fil</Text>
          </Pressable>

          <Pressable
            style={[styles.choiceBtn, styles.choiceBtnWoman]}
            onPress={() => onChooseSpace('woman')}
          >
            <View style={styles.choiceWomanBg}>
              <Logo background="light" width={152} woman />
              <View style={styles.choiceWomanRow}>
                <Text style={styles.choiceBtnTitleWoman}>{PRODAY_WOMAN_BRAND.name}</Text>
                <Text style={styles.choiceBadge}>{PRODAY_WOMAN_BRAND.entryCta}</Text>
              </View>
              <Text style={styles.choiceBtnSubWoman}>Foot au féminin — même app, univers rose</Text>
            </View>
          </Pressable>
        </View>
      ) : null}
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
      <View style={[styles.logoCard, shadows.card]}>
        <Image
          source={BRANDING_LOGOS.transparent}
          style={{ width: logoW, height: logoH }}
          resizeMode="contain"
          accessibilityLabel={BRAND.name}
        />
      </View>
      <Text style={styles.brandName}>{BRAND.name}</Text>
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
  choiceDock: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  choiceTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.text,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  choiceSub: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: spacing.sm,
  },
  choiceBtn: {
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
  },
  choiceBtnClassic: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  choiceBtnWoman: {
    backgroundColor: '#FDF2F8',
    borderColor: '#FBCFE8',
    overflow: 'hidden',
    padding: 0,
  },
  choiceWomanBg: {
    padding: spacing.md,
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: '#FDF2F8',
  },
  choiceWomanRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  choiceBtnTitle: { fontSize: 16, fontWeight: '900', color: colors.text },
  choiceBtnSub: { fontSize: 12, color: colors.textSecondary, marginTop: 4, lineHeight: 17 },
  choiceBtnTitleWoman: { fontSize: 16, fontWeight: '900', color: WOMAN_ACCENT },
  choiceBtnSubWoman: { fontSize: 12, color: '#9D174D', marginTop: 4, lineHeight: 17 },
  choiceBadge: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
    backgroundColor: WOMAN_ACCENT,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
});
