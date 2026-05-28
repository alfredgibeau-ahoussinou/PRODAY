import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, ImageBackground } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { Logo } from '../Logo';
import { BRAND } from '../../theme/designTokens';
import { discover } from '../../theme/discoverTheme';
import { colors, spacing } from '../../theme/designTokens';
import { EASE_OUT } from './animationConfig';
import { SHOWCASE_IMAGES } from '../../content/showcaseAssets';

const { width: SCREEN_W } = Dimensions.get('window');

interface DiscoverHeroAnimatedProps {
  scrollY: SharedValue<number>;
  pitch: string;
}

export const DiscoverHeroAnimated: React.FC<DiscoverHeroAnimatedProps> = ({
  scrollY,
  pitch,
}) => {
  const lineWidth = useSharedValue(0);
  const pitchOpacity = useSharedValue(0);
  const livePulse = useSharedValue(0);

  useEffect(() => {
    lineWidth.value = withDelay(200, withTiming(1, { duration: 900, easing: EASE_OUT }));
    pitchOpacity.value = withDelay(500, withTiming(1, { duration: 700 }));
    livePulse.value = withRepeat(withTiming(1, { duration: 1400 }), -1, true);
  }, [lineWidth, pitchOpacity, livePulse]);

  const heroParallax = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(scrollY.value, [0, 180], [0, -24], Extrapolation.CLAMP) },
    ],
  }));

  const lineStyle = useAnimatedStyle(() => ({
    width: `${lineWidth.value * 100}%`,
  }));

  const pitchStyle = useAnimatedStyle(() => ({
    opacity: pitchOpacity.value,
    transform: [
      { translateY: interpolate(pitchOpacity.value, [0, 1], [8, 0]) },
    ],
  }));

  const dotStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(livePulse.value, [0, 1], [1, 1.35]) }],
    opacity: interpolate(livePulse.value, [0, 1], [0.85, 1]),
  }));

  return (
    <Animated.View style={[styles.heroWrap, heroParallax]}>
      <ImageBackground
        source={SHOWCASE_IMAGES.discoverHero}
        style={styles.hero}
        imageStyle={styles.heroImage}
      >
        <View style={styles.overlay} />

        {/* Filigrane logo transparent — fond photo */}
        <View style={styles.watermarkLayer} pointerEvents="none">
          <Logo background="photo" width={SCREEN_W * 0.72} watermark />
        </View>

        <View style={styles.heroContent}>
          <View style={styles.grid}>
            {Array.from({ length: 6 }).map((_, i) => (
              <View key={i} style={[styles.gridLine, { left: `${(i + 1) * 16}%` }]} />
            ))}
          </View>

          <View style={styles.badge}>
            <Animated.View style={[styles.badgeDot, dotStyle]} />
            <Text style={styles.badgeText}>PRODAY · LIVE</Text>
          </View>

          <Logo background="photo" width={180} showTagline={false} />
          <Text style={styles.brandTag}>{BRAND.tagline}</Text>

          <Animated.View style={[styles.accentLine, lineStyle]} />

          <Animated.Text style={[styles.pitch, pitchStyle]}>{pitch}</Animated.Text>
        </View>
      </ImageBackground>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  heroWrap: { overflow: 'hidden' },
  hero: {
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl + spacing.md,
    paddingHorizontal: spacing.lg,
    minHeight: 300,
    overflow: 'hidden',
  },
  heroImage: { opacity: 0.55 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.48)',
  },
  watermarkLayer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ translateY: -24 }, { rotate: '-6deg' }],
  },
  heroContent: { zIndex: 1 },
  grid: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.08,
  },
  gridLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: discover.heroText,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    alignSelf: 'flex-start',
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: discover.heroLine,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.accent,
  },
  badgeText: {
    color: colors.accent,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  brandTag: {
    color: discover.heroMuted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2.5,
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  accentLine: {
    height: 3,
    backgroundColor: colors.accent,
    borderRadius: 2,
    marginBottom: spacing.lg,
    maxWidth: SCREEN_W * 0.5,
  },
  pitch: {
    color: discover.heroText,
    fontSize: 22,
    lineHeight: 30,
    fontWeight: '700',
    letterSpacing: -0.3,
    maxWidth: 320,
  },
});
