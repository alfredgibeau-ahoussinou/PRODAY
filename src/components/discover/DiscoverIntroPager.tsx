import React, { useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ImageBackground,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';
import { DISCOVER_INTRO_SLIDES, type IntroSlideAction } from '../../content/discoverChapters';
import { CarouselDot } from './CarouselDot';
import { PressableSpring } from './PressableSpring';
import { Icon } from '../ui/Icon';
import { Logo } from '../Logo';
import { colors, spacing, radius, shadows } from '../../theme/designTokens';

const { width: W } = Dimensions.get('window');
const PAGER_H = 440;

interface DiscoverIntroPagerProps {
  statsLabel?: string;
  onAction: (action: IntroSlideAction) => void;
  onPageChange?: (index: number) => void;
}

export const DiscoverIntroPager: React.FC<DiscoverIntroPagerProps> = ({
  statsLabel,
  onAction,
  onPageChange,
}) => {
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
      const clamped = Math.max(0, Math.min(index, DISCOVER_INTRO_SLIDES.length - 1));
      scrollRef.current?.scrollTo({ x: clamped * W, animated: true });
      onPageChange?.(clamped);
    },
    [onPageChange]
  );

  useEffect(() => {
    stopAuto();
    autoTimer.current = setInterval(() => {
      if (pausedRef.current) return;
      const next = (Math.round(scrollX.value / W) + 1) % DISCOVER_INTRO_SLIDES.length;
      goToPage(next);
    }, 5200);
    return stopAuto;
  }, [goToPage, scrollX, stopAuto]);

  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / W);
    onPageChange?.(i);
  };

  return (
    <View style={styles.wrap}>
      <Animated.ScrollView
        ref={scrollRef}
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
        {DISCOVER_INTRO_SLIDES.map((slide, index) => (
          <IntroSlide
            key={slide.id}
            slide={slide}
            index={index}
            scrollX={scrollX}
            statsLabel={index === 1 ? statsLabel : undefined}
            onCta={() => onAction(slide.action)}
          />
        ))}
      </Animated.ScrollView>

      <View style={styles.footer}>
        <View style={styles.dots}>
          {DISCOVER_INTRO_SLIDES.map((s, i) => (
            <CarouselDot
              key={s.id}
              index={i}
              scrollX={scrollX}
              snap={W}
              onPress={() => goToPage(i)}
            />
          ))}
        </View>
        <Text style={styles.swipeHint}>Glissez pour explorer →</Text>
      </View>
    </View>
  );
};

const IntroSlide: React.FC<{
  slide: (typeof DISCOVER_INTRO_SLIDES)[0];
  index: number;
  scrollX: SharedValue<number>;
  statsLabel?: string;
  onCta: () => void;
}> = ({ slide, index, scrollX, statsLabel, onCta }) => {
  const pageX = index * W;

  const cardStyle = useAnimatedStyle(() => {
    const dx = scrollX.value - pageX;
    return {
      transform: [
        { translateY: interpolate(dx, [-W, 0, W], [24, 0, 24], Extrapolation.CLAMP) },
        { scale: interpolate(dx, [-W, 0, W], [0.92, 1, 0.92], Extrapolation.CLAMP) },
      ],
      opacity: interpolate(
        dx,
        [-W, -W * 0.35, 0, W * 0.35, W],
        [0.35, 0.75, 1, 0.75, 0.35],
        Extrapolation.CLAMP
      ),
    };
  });

  const imageStyle = useAnimatedStyle(() => {
    const dx = scrollX.value - pageX;
    return {
      transform: [
        { translateX: interpolate(dx, [-W, 0, W], [-40, 0, 40], Extrapolation.CLAMP) },
        { scale: interpolate(dx, [-W, 0, W], [1.08, 1, 1.08], Extrapolation.CLAMP) },
      ],
    };
  });

  const isWelcome = slide.id === 'welcome';

  return (
    <View style={[styles.page, { width: W }]}>
      <Animated.View style={[styles.card, shadows.interactive, cardStyle]}>
        <ImageBackground source={slide.image} style={styles.bg} imageStyle={styles.bgImg}>
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
        </ImageBackground>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { height: PAGER_H },
  page: { height: PAGER_H, paddingHorizontal: spacing.lg, paddingTop: spacing.md },
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
    position: 'absolute',
    bottom: spacing.md,
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: spacing.sm,
  },
  dots: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  swipeHint: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
});
