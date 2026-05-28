import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ImageBackground, Dimensions } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  interpolate,
  FadeInDown,
} from 'react-native-reanimated';
import { Logo } from '../Logo';
import { PressableSpring } from './PressableSpring';
import { MarqueePillars } from './MarqueePillars';
import { ShimmerCTA } from './ShimmerCTA';
import { SHOWCASE_IMAGES } from '../../content/showcaseAssets';
import { colors, spacing, radius, shadows, surfaces, BRAND, brandOverlay } from '../../theme/designTokens';

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
  const breathe = useSharedValue(0);

  useEffect(() => {
    breathe.value = withRepeat(withTiming(1, { duration: 3600 }), -1, true);
  }, [breathe]);

  const photoAnim = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(breathe.value, [0, 1], [1, 1.05]) }],
  }));

  return (
    <View style={styles.root}>
      <Animated.View entering={FadeInDown.springify()} style={styles.photoWrap}>
        <ImageBackground
          source={SHOWCASE_IMAGES.discoverHero}
          style={styles.photo}
          imageStyle={styles.photoImg}
        >
          <Animated.View style={[styles.photoMotion, photoAnim]} />
          <View style={styles.photoOverlay} />
        </ImageBackground>
      </Animated.View>

      <Animated.View
        entering={FadeInDown.delay(60).springify()}
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

      <Animated.View entering={FadeInDown.delay(120).springify()} style={styles.actions}>
        <PressableSpring style={styles.nextBtn} onPress={onNext} scaleTo={0.97}>
          <Text style={styles.nextText}>Découvrir ProDay</Text>
        </PressableSpring>
        <ShimmerCTA label="Créer mon compte — gratuit" onPress={onSignup} variant="secondary" />
      </Animated.View>

      <MarqueePillars />
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
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
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  cardAccent: {
    height: 4,
    backgroundColor: colors.accent,
  },
  cardBody: {
    padding: spacing.xl,
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  tagline: {
    marginTop: spacing.sm,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    color: colors.textMuted,
  },
  pitch: {
    marginTop: spacing.md,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '600',
    color: colors.textSecondary,
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
    backgroundColor: colors.accent,
  },
  statsText: { fontSize: 12, fontWeight: '700', color: colors.accent },
  actions: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  nextBtn: {
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
    paddingVertical: spacing.md + 2,
    alignItems: 'center',
    ...shadows.interactive,
  },
  nextText: { color: colors.brandInverse, fontWeight: '800', fontSize: 16 },
});
