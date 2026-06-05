import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  useWindowDimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Platform,
} from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';
import { getDiscoverIntroSlides } from '../../content/discoverContentByLine';
import type { IntroSlideAction, DiscoverIntroSlide } from '../../content/discoverChapters';
import { useAppTheme } from '../../context/ProductLineContext';
import { CarouselDot } from './CarouselDot';
import { PressableSpring } from './PressableSpring';
import { ShowcaseImageBackground } from '../ui/ShowcaseImageBackground';
import { Icon } from '../ui/Icon';
import { Logo } from '../Logo';
import { colors, spacing, radius, shadows } from '../../theme/designTokens';
import { discoverPalette, discoverLayout } from './discoverStyles';
import { useDiscoverMetrics } from './useDiscoverMetrics';

interface DiscoverIntroPagerProps {
  statsLabel?: string;
  onAction: (action: IntroSlideAction) => void;
  onPageChange?: (index: number) => void;
  /** Défilement auto des slides — désactivé par défaut (UX sobre) */
  autoAdvance?: boolean;
  /** Hauteur réduite dans la feuille accueil */
  compact?: boolean;
  /** Cartes claires image + texte (style accueil éditorial) */
  variant?: 'dark' | 'editorial';
  /** Hauteur fixe du bloc (mobile) */
  height?: number;
  /** Points sous le carrousel — désactivé si le parent affiche déjà des dots */
  showFooter?: boolean;
}

export const DiscoverIntroPager: React.FC<DiscoverIntroPagerProps> = ({
  statsLabel,
  onAction,
  onPageChange,
  autoAdvance = false,
  compact = false,
  variant = 'dark',
  height: heightProp,
  showFooter = true,
}) => {
  const { width: pageWidth } = useWindowDimensions();
  const { productLine } = useAppTheme();
  const slides = useMemo(() => getDiscoverIntroSlides(productLine), [productLine]);
  const metrics = useDiscoverMetrics();
  const scrollRef = useRef<Animated.ScrollView>(null);
  const scrollX = useSharedValue(0);
  const pausedRef = useRef(false);
  const autoTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const onScroll = useAnimatedScrollHandler({
    onScroll: (e) => {
      scrollX.value = e.contentOffset.x;
    },
  });

  const stopAuto = useCallback(() => {
    if (autoTimer.current) {
      clearInterval(autoTimer.current);
      autoTimer.current = null;
    }
  }, []);

  const goToPage = useCallback(
    (index: number) => {
      const clamped = Math.max(0, Math.min(index, slides.length - 1));
      scrollRef.current?.scrollTo({ x: clamped * pageWidth, animated: true });
      onPageChange?.(clamped);
    },
    [onPageChange, pageWidth, slides.length]
  );

  useEffect(() => {
    if (!autoAdvance) return undefined;
    stopAuto();
    autoTimer.current = setInterval(() => {
      if (pausedRef.current) return;
      const next = (Math.round(scrollX.value / pageWidth) + 1) % slides.length;
      goToPage(next);
    }, 5200);
    return stopAuto;
  }, [autoAdvance, goToPage, scrollX, stopAuto, slides.length]);

  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / pageWidth);
    onPageChange?.(i);
  };

  const pagerH = heightProp ?? metrics.introPagerHeight;
  const introFooterH = showFooter ? 40 : 0;
  const slideH = pagerH - introFooterH;

  return (
    <View style={[styles.wrap, { height: pagerH }]}>
      <Animated.ScrollView
        ref={scrollRef}
        style={[styles.pager, showFooter && { height: slideH }]}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        onMomentumScrollEnd={onScrollEnd}
        scrollEventThrottle={16}
        decelerationRate="fast"
        onTouchStart={() => {
          pausedRef.current = true;
          stopAuto();
        }}
        onTouchEnd={() => {
          pausedRef.current = false;
        }}
      >
        {slides.map((slide, index) => (
          <IntroSlide
            key={slide.id}
            slide={slide}
            index={index}
            scrollX={scrollX}
            pageWidth={pageWidth}
            pageHeight={slideH}
            metrics={metrics}
            statsLabel={index === 1 ? statsLabel : undefined}
            onCta={() => onAction(slide.action)}
            variant={variant}
          />
        ))}
      </Animated.ScrollView>

      {showFooter ? (
        <View style={styles.footer}>
          <View style={styles.dots}>
            {slides.map((s, i) => (
              <CarouselDot
                key={s.id}
                index={i}
                scrollX={scrollX}
                snap={pageWidth}
                onPress={() => goToPage(i)}
              />
            ))}
          </View>
          <Text style={styles.swipeHint}>Glissez pour explorer →</Text>
        </View>
      ) : null}
    </View>
  );
};

const IntroSlide: React.FC<{
  slide: DiscoverIntroSlide;
  index: number;
  scrollX: SharedValue<number>;
  pageWidth: number;
  pageHeight: number;
  metrics: ReturnType<typeof useDiscoverMetrics>;
  statsLabel?: string;
  onCta: () => void;
  variant: 'dark' | 'editorial';
}> = ({ slide, index, scrollX, pageWidth, pageHeight, metrics, statsLabel, onCta, variant }) => {
  const pageX = index * pageWidth;

  const cardStyle = useAnimatedStyle(() => {
    const dx = scrollX.value - pageX;
    return {
      opacity: interpolate(
        dx,
        [-pageWidth, 0, pageWidth],
        [0.55, 1, 0.55],
        Extrapolation.CLAMP
      ),
      transform: [
        {
          scale: interpolate(dx, [-pageWidth, 0, pageWidth], [0.97, 1, 0.97], Extrapolation.CLAMP),
        },
      ],
    };
  });

  const imageStyle = useAnimatedStyle(() => {
    const dx = scrollX.value - pageX;
    return {
      transform: [
        {
          scale: interpolate(dx, [-pageWidth, 0, pageWidth], [1.04, 1, 1.04], Extrapolation.CLAMP),
        },
      ],
    };
  });

  const isWelcome = slide.id === 'welcome';

  if (variant === 'editorial') {
    const cardW = metrics.cardWidth;
    const cardH = Math.max(260, pageHeight - spacing.xs);
    const heroH = Math.round(cardH * (metrics.compact ? 0.3 : 0.32));

    return (
      <View style={[styles.page, styles.pageCentered, { width: pageWidth, height: pageHeight }]}>
        <Animated.View
          style={[
            styles.cardEditorial,
            shadows.card,
            { width: cardW, height: cardH },
            cardStyle,
          ]}
        >
          <ShowcaseImageBackground
            source={slide.image}
            variant="card"
            style={[styles.editorialHero, { height: heroH }]}
            imageStyle={styles.editorialHeroImg}
          >
            <View style={styles.editorialKicker}>
              <Icon name={slide.icon} size={14} color={discoverPalette.ink} />
              <Text style={styles.editorialKickerText}>{slide.kicker}</Text>
            </View>
          </ShowcaseImageBackground>
          <View
            style={[
              styles.editorialBody,
              {
                paddingHorizontal: metrics.introBodyPad,
                paddingVertical: metrics.compact ? spacing.sm : spacing.md,
              },
            ]}
          >
            <Text
              style={[
                styles.editorialTitle,
                {
                  fontSize: metrics.introTitleSize,
                  lineHeight: metrics.introTitleLine,
                },
              ]}
            >
              {slide.title}
            </Text>
            <Text
              style={[
                styles.editorialBodyText,
                {
                  fontSize: metrics.introBodySize,
                  lineHeight: metrics.introBodyLine,
                },
              ]}
            >
              {slide.body}
            </Text>
            {statsLabel ? (
              <View style={styles.editorialStats}>
                <View style={styles.statsDotEditorial} />
                <Text style={styles.editorialStatsText} numberOfLines={2}>
                  {statsLabel}
                </Text>
              </View>
            ) : null}
            <PressableSpring style={styles.ctaEditorial} onPress={onCta} scaleTo={0.97}>
              <Text style={styles.ctaEditorialText}>{slide.cta}</Text>
              <Icon name="chevron-forward" size={18} color={colors.brandInverse} />
            </PressableSpring>
          </View>
        </Animated.View>
      </View>
    );
  }

  return (
    <View style={[styles.page, { width: pageWidth, height: pageHeight, paddingHorizontal: metrics.pad }]}>
      <Animated.View style={[styles.card, shadows.interactive, cardStyle]}>
        <ShowcaseImageBackground source={slide.image} variant="hero" style={styles.bg} imageStyle={styles.bgImg}>
          <Animated.View style={[styles.bgMotion, imageStyle]} />
          <View style={styles.overlay} />

          <View style={styles.topRow}>
            {isWelcome ? (
              <Logo background="photo" width={120} showTagline={false} />
            ) : (
              <View style={styles.kickerPill}>
                <Icon name={slide.icon} size={14} color={colors.accent} />
                <Text style={styles.kicker}>{slide.kicker}</Text>
              </View>
            )}
          </View>

          <View style={styles.copy}>
            <Text style={styles.title}>{slide.title}</Text>
            <Text style={styles.body}>{slide.body}</Text>
            {statsLabel ? (
              <View style={styles.statsPill}>
                <View style={styles.statsDot} />
                <Text style={styles.statsText}>{statsLabel}</Text>
              </View>
            ) : null}
            <PressableSpring style={styles.cta} onPress={onCta} scaleTo={0.94}>
              <Text style={styles.ctaText}>{slide.cta}</Text>
              <Icon name="chevron-forward" size={18} color={colors.brandInverse} />
            </PressableSpring>
          </View>
        </ShowcaseImageBackground>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    overflow: 'hidden',
  },
  pager: {
    flex: 1,
  },
  page: {
    paddingTop: spacing.xs,
  },
  pageCentered: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: spacing.xs,
  },
  card: {
    flex: 1,
    borderRadius: radius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  bg: { flex: 1, justifyContent: 'space-between' },
  bgImg: { opacity: 0.88 },
  bgMotion: { ...StyleSheet.absoluteFillObject },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.42)' },
  topRow: { padding: spacing.lg, paddingBottom: 0 },
  kickerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  kicker: { fontSize: 10, fontWeight: '900', color: colors.ink, letterSpacing: 1.6 },
  copy: { padding: spacing.lg },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: colors.brandInverse,
    letterSpacing: -1,
    lineHeight: 36,
  },
  body: {
    marginTop: spacing.sm,
    fontSize: 14,
    lineHeight: 21,
    color: 'rgba(255,255,255,0.88)',
    fontWeight: '600',
    maxWidth: 300,
  },
  statsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.md,
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  statsDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.accent },
  statsText: { fontSize: 10, fontWeight: '800', color: colors.accent },
  cta: {
    marginTop: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.brandInverse,
  },
  ctaText: { color: colors.brandInverse, fontWeight: '900', fontSize: 14, letterSpacing: 0.3 },
  footer: {
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  dots: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  swipeHint: {
    fontSize: 8,
    fontWeight: '700',
    color: discoverPalette.faint,
    letterSpacing: 1,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  cardEditorial: {
    borderRadius: discoverLayout.cardRadius,
    overflow: 'hidden',
    backgroundColor: discoverPalette.card,
    borderWidth: 1,
    borderColor: discoverPalette.cardBorder,
  },
  editorialHero: {
    width: '100%',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: spacing.sm,
  },
  editorialHeroImg: { opacity: 1 },
  editorialLogo: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.9)',
    padding: spacing.sm,
    borderRadius: radius.md,
  },
  editorialKicker: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'center',
    backgroundColor: discoverPalette.card,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  editorialKickerText: {
    fontSize: 10,
    fontWeight: '900',
    color: discoverPalette.ink,
    letterSpacing: 1.4,
  },
  editorialBody: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    width: '100%',
    gap: spacing.sm,
    minHeight: 0,
  },
  editorialTitle: {
    fontWeight: '900',
    color: discoverPalette.ink,
    letterSpacing: -0.6,
    textAlign: 'center',
    width: '100%',
    ...Platform.select({ android: { includeFontPadding: false } }),
  },
  editorialBodyText: {
    color: discoverPalette.muted,
    fontWeight: '500',
    textAlign: 'center',
    width: '100%',
    ...Platform.select({ android: { includeFontPadding: false } }),
  },
  editorialStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: spacing.xs,
    paddingVertical: 8,
    paddingHorizontal: spacing.md,
    backgroundColor: discoverPalette.canvasDeep,
    borderRadius: radius.pill,
    alignSelf: 'center',
  },
  statsDotEditorial: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: discoverPalette.live,
  },
  editorialStatsText: {
    fontSize: 12,
    fontWeight: '700',
    color: discoverPalette.ink,
    textAlign: 'center',
    flexShrink: 1,
  },
  ctaEditorial: {
    marginTop: spacing.xs,
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: discoverPalette.ink,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    minHeight: 48,
  },
  ctaEditorialText: {
    color: colors.brandInverse,
    fontWeight: '800',
    fontSize: 14,
    textAlign: 'center',
  },
});
