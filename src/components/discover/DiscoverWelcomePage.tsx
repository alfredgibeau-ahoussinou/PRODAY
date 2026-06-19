import React, { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { ShowcaseImageBackground } from '../ui/ShowcaseImageBackground';
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { Logo } from '../Logo';
import { PressableSpring } from '../motion';
import { MarqueePillars } from './MarqueePillars';
import { ShimmerCTA } from './ShimmerCTA';
import { useShowcaseImages } from '../../hooks/useShowcaseImages';
import { spacing, radius, shadows, surfaces, BRAND, brandOverlay } from '../../theme/designTokens';
import { useDiscoverStyles } from './discoverStyles';
import type { AppColors } from '../../theme/universeTheme';

const { width: W } = Dimensions.get('window');

interface DiscoverWelcomePageProps {
  statsLabel: string;
  onNext: () => void;
  onSignup: () => void;
}

export const DiscoverWelcomePage: React.FC<DiscoverWelcomePageProps> = ({
  statsLabel,
  onNext,
  onSignup,
}) => {
  const { colors: c } = useDiscoverStyles();
  const styles = useMemo(() => createStyles(c), [c]);
  const showcase = useShowcaseImages();
  const heroIn = useSharedValue(0);

  useEffect(() => {
    heroIn.value = withTiming(1, { duration: 700 });
  }, [heroIn]);

  const photoAnim = useAnimatedStyle(() => ({
    opacity: interpolate(heroIn.value, [0, 1], [0.92, 1]),
    transform: [{ scale: interpolate(heroIn.value, [0, 1], [1.02, 1]) }],
  }));

  return (
    <View style={styles.root}>
      <Animated.View entering={FadeIn.duration(400)} style={styles.photoWrap}>
        <ShowcaseImageBackground
          source={showcase.discoverHero}
          variant="hero"
          style={styles.photo}
          imageStyle={styles.photoImg}
        >
          <Animated.View style={[styles.photoMotion, photoAnim]} />
          <View style={styles.photoOverlay} />
        </ShowcaseImageBackground>
      </Animated.View>

      <Animated.View
        entering={FadeIn.delay(80).duration(420)}
        style={[styles.card, shadows.interactive]}
      >
        <View style={styles.cardAccent} />
        <View style={styles.cardBody}>
          <Logo background="light" width={130} showTagline={false} />
          <Text style={styles.tagline}>{BRAND.tagline}</Text>
          <Text style={styles.pitch}>
            La plateforme qui connecte joueurs, clubs, coachs et sponsors pour toute la saison.
          </Text>
          <View style={styles.statsPill}>
            <View style={styles.liveDot} />
            <Text style={styles.statsText}>{statsLabel}</Text>
          </View>
        </View>
      </Animated.View>

      <Animated.View entering={FadeIn.delay(140).duration(420)} style={styles.actions}>
        <PressableSpring style={styles.nextBtn} onPress={onNext} scaleTo={0.97}>
          <Text style={styles.nextText}>Découvrir ProDay</Text>
        </PressableSpring>
        <ShimmerCTA label="Créer mon compte — gratuit" onPress={onSignup} variant="secondary" />
      </Animated.View>

      <MarqueePillars />
    </View>
  );
};

function createStyles(c: AppColors) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: c.background },
    photoWrap: {
      marginHorizontal: spacing.lg,
      marginTop: spacing.md,
      borderRadius: radius.xl,
      overflow: 'hidden',
      height: 160,
      ...shadows.soft,
    },
    photo: { flex: 1 },
    photoImg: { borderRadius: radius.xl },
    photoMotion: { ...StyleSheet.absoluteFillObject },
    photoOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: brandOverlay(0.25),
    },
    card: {
      marginHorizontal: spacing.lg,
      marginTop: -spacing.xl,
      backgroundColor: c.surface,
      borderRadius: radius.xl,
      borderWidth: 1,
      borderColor: c.border,
      overflow: 'hidden',
    },
    cardAccent: {
      height: 4,
      backgroundColor: c.brand,
    },
    cardBody: {
      padding: spacing.xl,
      alignItems: 'center',
      backgroundColor: c.surface,
    },
    tagline: {
      marginTop: spacing.sm,
      fontSize: 10,
      fontWeight: '700',
      letterSpacing: 2,
      color: c.textMuted,
    },
    pitch: {
      marginTop: spacing.md,
      fontSize: 15,
      lineHeight: 22,
      fontWeight: '600',
      color: c.textSecondary,
      textAlign: 'center',
      maxWidth: W - 96,
    },
    statsPill: {
      ...surfaces.pill,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginTop: spacing.lg,
      paddingHorizontal: spacing.md,
      paddingVertical: 8,
    },
    liveDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: c.brand,
    },
    statsText: { fontSize: 12, fontWeight: '700', color: c.brand },
    actions: {
      paddingHorizontal: spacing.lg,
      marginTop: spacing.lg,
      gap: spacing.sm,
    },
    nextBtn: {
      backgroundColor: c.brand,
      borderRadius: radius.pill,
      paddingVertical: spacing.md + 2,
      alignItems: 'center',
      ...shadows.interactive,
    },
    nextText: { color: c.brandInverse, fontWeight: '800', fontSize: 16 },
  });
}
