import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ShowcaseImageBackground } from '../ui/ShowcaseImageBackground';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';
import { AUTO_CAROUSEL_MS } from './animationConfig';
import {
  getDiscoverCarouselCopy,
  getDiscoverUniverseCards,
} from '../../content/discoverContentByLine';
import {
  type DiscoverUniverseCard,
} from '../../content/discoverChapters';
import { useAppTheme } from '../../context/ProductLineContext';
import { CarouselDot } from './CarouselDot';
import { PressableSpring } from '../motion';
import { DiscoverSectionHeader } from './DiscoverSectionHeader';
import { Icon } from '../ui/Icon';
import type { ProDayModuleId } from '../../content/prodayModules';
import { spacing, radius, shadows, brandOverlay } from '../../theme/designTokens';
import { discoverLayout, getDiscoverPalette, useDiscoverStyles } from './discoverStyles';
import type { AppColors } from '../../theme/universeTheme';
import { useDiscoverMetrics } from './useDiscoverMetrics';

interface DiscoverUniverseCarouselProps {
  onModulePress: (id: ProDayModuleId) => void;
  showHeader?: boolean;
  autoPlay?: boolean;
  variant?: 'dark' | 'editorial';
}

export const DiscoverUniverseCarousel: React.FC<DiscoverUniverseCarouselProps> = ({
  onModulePress,
  showHeader = true,
  autoPlay = false,
  variant = 'dark',
}) => {
  const { palette, colors: c } = useDiscoverStyles();
  const styles = useMemo(() => createCarouselStyles(c, palette), [c, palette]);
  const editorial = variant === 'editorial';
  const { productLine } = useAppTheme();
  const cards = useMemo(() => getDiscoverUniverseCards(productLine), [productLine]);
  const carouselCopy = useMemo(() => getDiscoverCarouselCopy(productLine), [productLine]);
  const { cardWidth, cardSnap, pad, compact } = useDiscoverMetrics();
  const scrollRef = useRef<Animated.ScrollView>(null);
  const scrollX = useSharedValue(0);
  const pausedRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const onScroll = useAnimatedScrollHandler({
    onScroll: (e) => {
      scrollX.value = e.contentOffset.x;
    },
  });

  const goTo = useCallback((index: number) => {
    const clamped = Math.max(0, Math.min(index, cards.length - 1));
    scrollRef.current?.scrollTo({ x: clamped * cardSnap, animated: true });
  }, [cardSnap, cards.length]);

  useEffect(() => {
    if (!autoPlay) return;
    timerRef.current = setInterval(() => {
      if (pausedRef.current) return;
      const i = Math.round(scrollX.value / cardSnap);
      goTo((i + 1) % cards.length);
    }, AUTO_CAROUSEL_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [autoPlay, cardSnap, goTo, scrollX, cards.length]);

  return (
    <View style={[styles.wrap, editorial && styles.wrapEditorial, variant === 'dark' && styles.wrapImmersive]}>
      {showHeader ? (
        <DiscoverSectionHeader
          label={carouselCopy.label}
          title={carouselCopy.title}
          subtitle={carouselCopy.subtitle}
          compact
        />
      ) : null}

      <Animated.ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={cardSnap}
        decelerationRate="fast"
        onScroll={onScroll}
        scrollEventThrottle={16}
        nestedScrollEnabled
        contentContainerStyle={[styles.rail, { paddingHorizontal: pad }]}
        onTouchStart={() => {
          pausedRef.current = true;
        }}
        onTouchEnd={() => {
          pausedRef.current = false;
        }}
      >
        {cards.map((card, index) => (
          <UniverseCard
            key={card.id}
            card={card}
            index={index}
            scrollX={scrollX}
            cardWidth={cardWidth}
            cardSnap={cardSnap}
            onPress={() => onModulePress(card.id)}
            editorial={editorial}
            compact={compact}
          />
        ))}
      </Animated.ScrollView>

      <View style={styles.dots}>
        {cards.map((c, i) => (
            <CarouselDot key={c.id} index={i} scrollX={scrollX} snap={cardSnap} onPress={() => goTo(i)} />
        ))}
      </View>
    </View>
  );
};

const UniverseCard: React.FC<{
  card: DiscoverUniverseCard;
  index: number;
  scrollX: SharedValue<number>;
  cardWidth: number;
  cardSnap: number;
  onPress: () => void;
  editorial: boolean;
  compact: boolean;
}> = ({ card, index, scrollX, cardWidth, cardSnap, onPress, editorial, compact }) => {
  const { palette, colors: c } = useDiscoverStyles();
  const styles = useMemo(() => createCarouselStyles(c, palette), [c, palette]);
  const offset = index * cardSnap;

  const style = useAnimatedStyle(() => {
    const dx = scrollX.value - offset;
    return {
      transform: [
        { rotate: `${interpolate(dx, [-cardSnap, 0, cardSnap], [-4, 0, 4], Extrapolation.CLAMP)}deg` },
        { scale: interpolate(dx, [-cardSnap, 0, cardSnap], [0.9, 1, 0.9], Extrapolation.CLAMP) },
        {
          translateY: interpolate(dx, [-cardSnap, 0, cardSnap], [14, 0, 14], Extrapolation.CLAMP),
        },
      ],
      opacity: interpolate(dx, [-cardSnap, 0, cardSnap], [0.55, 1, 0.55], Extrapolation.CLAMP),
    };
  });

  if (editorial) {
    return (
    <Animated.View style={[styles.cardWrap, { width: cardWidth }, style]}>
      <PressableSpring onPress={onPress} scaleTo={0.98}>
          <View style={[styles.cardEditorial, shadows.card, compact && styles.cardEditorialCompact]}>
            <ShowcaseImageBackground
              source={card.image}
              variant="card"
              style={styles.editorialImg}
              imageStyle={styles.editorialImgInner}
            />
            <View style={styles.editorialCopy}>
              <View style={styles.editorialBadge}>
                <Icon name={card.icon} size={16} color={palette.ink} variant="filled" />
              </View>
              <Text style={styles.editorialTitle}>{card.title}</Text>
              <Text style={styles.editorialSub}>{card.subtitle}</Text>
              <Text style={styles.editorialTap}>Ouvrir →</Text>
            </View>
          </View>
        </PressableSpring>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[styles.cardWrap, { width: cardWidth }, style]}>
      <PressableSpring onPress={onPress} scaleTo={0.96}>
        <View style={[styles.card, shadows.interactive]}>
          <ShowcaseImageBackground source={card.image} variant="hero" style={styles.hero} imageStyle={styles.heroImg}>
            <View style={styles.overlay} />
            <View style={[styles.badge, { borderColor: card.accent }]}>
              <Icon name={card.icon} size={18} color={c.brandInverse} variant="filled" />
            </View>
            <View style={styles.copy}>
              <Text style={styles.title}>{card.title}</Text>
              <Text style={styles.sub}>{card.subtitle}</Text>
              <View style={styles.tapRow}>
                <Text style={styles.tapText}>Ouvrir</Text>
                <Icon name="chevron-forward" size={16} color={c.brandInverse} />
              </View>
            </View>
          </ShowcaseImageBackground>
        </View>
      </PressableSpring>
    </Animated.View>
  );
};

function createCarouselStyles(c: AppColors, palette: ReturnType<typeof getDiscoverPalette>) {
  return StyleSheet.create({
  wrap: { marginTop: spacing.xl },
  wrapEditorial: { marginTop: spacing.md },
  wrapImmersive: { marginTop: spacing.sm },
  rail: { gap: spacing.md, paddingBottom: spacing.sm },
  cardWrap: {},
  card: {
    borderRadius: radius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: c.border,
    minHeight: 260,
    backgroundColor: c.surface,
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
    backgroundColor: c.accent,
    borderWidth: 0,
  },
  copy: { padding: spacing.lg },
  title: { fontSize: 26, fontWeight: '800', color: c.brandInverse, letterSpacing: -0.5 },
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
  cardEditorial: {
    borderRadius: discoverLayout.cardRadius,
    overflow: 'hidden',
    backgroundColor: palette.card,
    borderWidth: 1,
    borderColor: palette.cardBorder,
    minHeight: 220,
  },
  cardEditorialCompact: { minHeight: 200 },
  editorialImg: { height: 130 },
  editorialImgInner: { opacity: 0.95 },
  editorialCopy: {
    padding: spacing.lg,
    gap: 4,
    alignItems: 'center',
  },
  editorialBadge: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: palette.canvasDeep,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  editorialTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: palette.ink,
    letterSpacing: -0.5,
    textAlign: 'center',
    width: '100%',
  },
  editorialSub: {
    fontSize: 13,
    fontWeight: '500',
    color: palette.muted,
    textAlign: 'center',
    width: '100%',
  },
  editorialTap: {
    marginTop: spacing.sm,
    fontSize: 12,
    fontWeight: '800',
    color: palette.ink,
    textAlign: 'center',
  },
  });
}
