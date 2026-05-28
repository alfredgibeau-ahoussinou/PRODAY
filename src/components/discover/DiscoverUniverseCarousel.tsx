import React, { useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, ImageBackground } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';
import {
  DISCOVER_UNIVERSE_CARDS,
  type DiscoverUniverseCard,
} from '../../content/discoverChapters';
import { CarouselDot } from './CarouselDot';
import { PressableSpring } from './PressableSpring';
import { DiscoverSectionHeader } from './DiscoverSectionHeader';
import { Icon } from '../ui/Icon';
import type { ProDayModuleId } from '../../content/prodayModules';
import { colors, spacing, radius, shadows, brandOverlay } from '../../theme/designTokens';

const { width: W } = Dimensions.get('window');
const CARD_W = W - spacing.lg * 2;
const SNAP = CARD_W + spacing.md;

interface DiscoverUniverseCarouselProps {
  onModulePress: (id: ProDayModuleId) => void;
  showHeader?: boolean;
}

export const DiscoverUniverseCarousel: React.FC<DiscoverUniverseCarouselProps> = ({
  onModulePress,
  showHeader = true,
}) => {
  const scrollRef = useRef<Animated.ScrollView>(null);
  const scrollX = useSharedValue(0);

  const onScroll = useAnimatedScrollHandler({
    onScroll: (e) => {
      scrollX.value = e.contentOffset.x;
    },
  });

  const goTo = (index: number) => {
    scrollRef.current?.scrollTo({ x: index * SNAP, animated: true });
  };

  return (
    <View style={styles.wrap}>
      {showHeader ? (
        <DiscoverSectionHeader
          label="Univers ProDay"
          title="4 mondes, un seul tap"
          subtitle="Swipez — chaque carte ouvre un aperçu"
          compact
        />
      ) : null}

      <Animated.ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={SNAP}
        decelerationRate="fast"
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentContainerStyle={styles.rail}
      >
        {DISCOVER_UNIVERSE_CARDS.map((card, index) => (
          <UniverseCard
            key={card.id}
            card={card}
            index={index}
            scrollX={scrollX}
            onPress={() => onModulePress(card.id)}
          />
        ))}
      </Animated.ScrollView>

      <View style={styles.dots}>
        {DISCOVER_UNIVERSE_CARDS.map((c, i) => (
          <CarouselDot key={c.id} index={i} scrollX={scrollX} snap={SNAP} onPress={() => goTo(i)} />
        ))}
      </View>
    </View>
  );
};

const UniverseCard: React.FC<{
  card: DiscoverUniverseCard;
  index: number;
  scrollX: SharedValue<number>;
  onPress: () => void;
}> = ({ card, index, scrollX, onPress }) => {
  const offset = index * SNAP;

  const style = useAnimatedStyle(() => {
    const dx = scrollX.value - offset;
    return {
      transform: [
        { rotate: `${interpolate(dx, [-SNAP, 0, SNAP], [-3, 0, 3], Extrapolation.CLAMP)}deg` },
        { scale: interpolate(dx, [-SNAP, 0, SNAP], [0.94, 1, 0.94], Extrapolation.CLAMP) },
      ],
    };
  });

  return (
    <Animated.View style={[styles.cardWrap, style]}>
      <PressableSpring onPress={onPress} scaleTo={0.96}>
        <View style={[styles.card, shadows.interactive]}>
          <ImageBackground source={card.image} style={styles.hero} imageStyle={styles.heroImg}>
            <View style={styles.overlay} />
            <View style={[styles.badge, { borderColor: card.accent }]}>
              <Icon name={card.icon} size={18} color={colors.brandInverse} variant="filled" />
            </View>
            <View style={styles.copy}>
              <Text style={styles.title}>{card.title}</Text>
              <Text style={styles.sub}>{card.subtitle}</Text>
              <View style={styles.tapRow}>
                <Text style={styles.tapText}>Toucher pour explorer</Text>
                <Icon name="chevron-forward" size={16} color={colors.brandInverse} />
              </View>
            </View>
          </ImageBackground>
        </View>
      </PressableSpring>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrap: { marginTop: spacing.xl },
  rail: { paddingHorizontal: spacing.lg, gap: spacing.md, paddingBottom: spacing.sm },
  cardWrap: { width: CARD_W },
  card: {
    borderRadius: radius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 260,
    backgroundColor: colors.surface,
  },
  hero: { flex: 1, justifyContent: 'flex-end', minHeight: 260 },
  heroImg: { opacity: 0.92 },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: brandOverlay(0.35) },
  badge: {
    position: 'absolute',
    top: spacing.lg,
    left: spacing.lg,
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
    borderWidth: 0,
  },
  copy: { padding: spacing.lg },
  title: { fontSize: 26, fontWeight: '800', color: colors.brandInverse, letterSpacing: -0.5 },
  sub: { marginTop: 4, fontSize: 14, fontWeight: '600', color: 'rgba(255,255,255,0.9)' },
  tapRow: {
    marginTop: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tapText: { fontSize: 12, fontWeight: '800', color: 'rgba(255,255,255,0.9)' },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
  },
});
