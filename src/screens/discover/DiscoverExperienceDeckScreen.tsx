import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions, ImageBackground } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { Icon } from '../../components/ui/Icon';
import { colors, spacing, radius, shadows } from '../../theme/designTokens';
import { SHOWCASE_IMAGES } from '../../content/showcaseAssets';

const { width: W } = Dimensions.get('window');

interface DiscoverExperienceDeckScreenProps {
  onBack: () => void;
}

type Slide = {
  key: string;
  kicker: string;
  title: string;
  body: string;
  image: any;
  icon: Parameters<typeof Icon>[0]['name'];
};

export const DiscoverExperienceDeckScreen: React.FC<DiscoverExperienceDeckScreenProps> = ({
  onBack,
}) => {
  const x = useSharedValue(0);

  const slides: Slide[] = useMemo(
    () => [
      {
        key: 'pulse',
        kicker: 'VIBES EN DIRECT',
        title: 'ProDay Pulse',
        body: 'Des chiffres réels, une vibe de saison — et un feed qui bouge.',
        image: SHOWCASE_IMAGES.expPulse,
        icon: 'star-four-points',
      },
      {
        key: 'arena',
        kicker: 'ARENA',
        title: 'Tournois qui claquent',
        body: 'Inscription club, statut live, palmarès publié par l’organisateur.',
        image: SHOWCASE_IMAGES.expArena,
        icon: 'trophy',
      },
      {
        key: 'sponsors',
        kicker: 'SPONSORS',
        title: 'Partenaires & objectifs',
        body: 'Offres, campagnes, contributions — du concret pour financer la saison.',
        image: SHOWCASE_IMAGES.expSponsors,
        icon: 'star',
      },
    ],
    []
  );

  const onScroll = useAnimatedScrollHandler({
    onScroll: (e) => {
      x.value = e.contentOffset.x;
    },
  });

  return (
    <View style={styles.root}>
      <ScreenHeader title="Expérience" subtitle="Deck interactif" onBack={onBack} />

      <Animated.ScrollView
        horizontal
        pagingEnabled
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.rail}
      >
        {slides.map((s, i) => (
          <DeckSlide key={s.key} slide={s} index={i} x={x} />
        ))}
      </Animated.ScrollView>

      <DeckDots count={slides.length} x={x} />
    </View>
  );
};

const DeckSlide: React.FC<{ slide: Slide; index: number; x: SharedValue<number> }> = ({
  slide,
  index,
  x,
}) => {
  const pageX0 = index * W;

  const cardStyle = useAnimatedStyle(() => {
    const dx = x.value - pageX0;
    return {
      transform: [
        { translateY: interpolate(dx, [-W, 0, W], [18, 0, 18], Extrapolation.CLAMP) },
        { rotate: `${interpolate(dx, [-W, 0, W], [-2.5, 0, 2.5], Extrapolation.CLAMP)}deg` },
        { scale: interpolate(dx, [-W, 0, W], [0.96, 1, 0.96], Extrapolation.CLAMP) },
      ],
      opacity: interpolate(dx, [-W, -W * 0.2, 0, W * 0.2, W], [0, 0.75, 1, 0.75, 0], Extrapolation.CLAMP),
    };
  });

  const imageStyle = useAnimatedStyle(() => {
    const dx = x.value - pageX0;
    return {
      transform: [
        { translateX: interpolate(dx, [-W, 0, W], [-28, 0, 28], Extrapolation.CLAMP) },
        { scale: interpolate(dx, [-W, 0, W], [1.06, 1, 1.06], Extrapolation.CLAMP) },
      ],
    };
  });

  return (
    <View style={styles.page}>
      <Animated.View style={[styles.card, shadows.card, cardStyle]}>
        <ImageBackground
          source={slide.image}
          style={styles.hero}
          imageStyle={styles.heroImg}
        >
          <Animated.View style={[styles.heroMotion, imageStyle]} />
          <View style={styles.heroOverlay} />

          <View style={styles.badgeRow}>
            <View style={styles.badge}>
              <Icon name={slide.icon} size={16} color={colors.accent} />
              <Text style={styles.badgeText}>{slide.kicker}</Text>
            </View>
          </View>

          <View style={styles.copy}>
            <Text style={styles.title}>{slide.title}</Text>
            <Text style={styles.body}>{slide.body}</Text>
          </View>
        </ImageBackground>
      </Animated.View>
    </View>
  );
};

const DeckDots: React.FC<{ count: number; x: SharedValue<number> }> = ({ count, x }) => (
  <View style={styles.dots}>
    {Array.from({ length: count }).map((_, i) => (
      <DeckDot key={i} index={i} x={x} />
    ))}
  </View>
);

const DeckDot: React.FC<{ index: number; x: SharedValue<number> }> = ({ index, x }) => {
  const style = useAnimatedStyle(() => {
    const px = index * W;
    const d = Math.abs(x.value - px);
    const t = Math.max(0, 1 - d / W);
    return {
      width: 8 + t * 14,
      opacity: 0.35 + t * 0.65,
      backgroundColor: t > 0.55 ? colors.accent : colors.inkFaint,
    };
  });
  return <Animated.View style={[styles.dot, style]} />;
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  rail: { alignItems: 'center' },
  page: { width: W, padding: spacing.lg, paddingTop: spacing.md },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 430,
  },
  hero: { flex: 1, justifyContent: 'flex-end' },
  heroImg: { opacity: 0.82 },
  heroMotion: {
    ...StyleSheet.absoluteFillObject,
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.38)',
  },
  badgeRow: { padding: spacing.lg, paddingBottom: spacing.sm },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  badgeText: { fontSize: 11, fontWeight: '900', color: colors.ink, letterSpacing: 1.4 },
  copy: { padding: spacing.lg, paddingTop: 0 },
  title: { fontSize: 26, fontWeight: '900', color: colors.brandInverse, letterSpacing: -0.6 },
  body: {
    marginTop: spacing.sm,
    fontSize: 14,
    lineHeight: 21,
    color: 'rgba(255,255,255,0.86)',
    maxWidth: 320,
    fontWeight: '600',
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingBottom: spacing.lg,
    paddingTop: spacing.sm,
  },
  dot: {
    height: 8,
    borderRadius: 999,
  },
});

