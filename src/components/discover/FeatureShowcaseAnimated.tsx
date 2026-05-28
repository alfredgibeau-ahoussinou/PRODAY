import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ScrollView,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Image,
} from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';
import { CarouselDot } from './CarouselDot';
import { DiscoverSectionHeader } from './DiscoverSectionHeader';
import { DISCOVER_FEATURES } from '../../content/founders';
import { FEATURE_IMAGE_KEYS } from '../../content/showcaseExperience';
import { SHOWCASE_IMAGES } from '../../content/showcaseAssets';
import { Icon, type IconName } from '../ui/Icon';
import { PressableSpring } from './PressableSpring';
import { colors, spacing, radius } from '../../theme/designTokens';
import { AUTO_CAROUSEL_MS } from './animationConfig';

const { width: SCREEN_W } = Dimensions.get('window');
/** ~88 % largeur écran : aperçu de la carte suivante sans carte géante */
const CARD_W = Math.round(SCREEN_W * 0.88);
const CARD_GAP = spacing.sm;
const SNAP = CARD_W + CARD_GAP;
const SIDE_PAD = (SCREEN_W - CARD_W) / 2;

const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);

function FeatureCard({
  index,
  scrollX,
  feature,
  onPress,
}: {
  index: number;
  scrollX: SharedValue<number>;
  feature: (typeof DISCOVER_FEATURES)[number];
  onPress: () => void;
}) {
  const cardStyle = useAnimatedStyle(() => {
    const center = index * SNAP;
    const dist = Math.abs(scrollX.value - center);
    const scale = interpolate(dist, [0, SNAP], [1, 0.96], Extrapolation.CLAMP);
    return { transform: [{ scale }] };
  });

  return (
    <Animated.View style={[styles.cardWrap, { width: CARD_W }, cardStyle]}>
      <PressableSpring style={styles.card} onPress={onPress} scaleTo={0.98}>
        {FEATURE_IMAGE_KEYS[feature.id] ? (
          <Image
            source={SHOWCASE_IMAGES[FEATURE_IMAGE_KEYS[feature.id]]}
            style={styles.cover}
            resizeMode="cover"
          />
        ) : null}
        <View style={[styles.stripe, { backgroundColor: feature.color }]} />
        <View style={styles.cardContent}>
          <View style={[styles.iconBox, { borderColor: feature.color }]}>
            <Icon
              name={feature.icon as IconName}
              size={20}
              color={feature.color}
              variant="filled"
            />
          </View>
          <View style={styles.cardBody}>
            <View style={styles.titleRow}>
              <Text style={styles.title} numberOfLines={1}>
                {feature.title}
              </Text>
              <Text style={styles.num}>{String(index + 1).padStart(2, '0')}</Text>
            </View>
            <Text style={styles.desc} numberOfLines={2}>
              {feature.description}
            </Text>
          </View>
        </View>
      </PressableSpring>
    </Animated.View>
  );
}

interface FeatureShowcaseAnimatedProps {
  onFeaturePress?: (id: string) => void;
}

export const FeatureShowcaseAnimated: React.FC<FeatureShowcaseAnimatedProps> = ({
  onFeaturePress,
}) => {
  const scrollX = useSharedValue(0);
  const [active, setActive] = useState(0);
  const listRef = useRef<ScrollView>(null);
  const userScrolling = useRef(false);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (e) => {
      scrollX.value = e.contentOffset.x;
    },
  });

  const goTo = useCallback((i: number) => {
    const idx =
      ((i % DISCOVER_FEATURES.length) + DISCOVER_FEATURES.length) %
      DISCOVER_FEATURES.length;
    listRef.current?.scrollTo({ x: idx * SNAP, animated: true });
    setActive(idx);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      if (!userScrolling.current) goTo(active + 1);
    }, AUTO_CAROUSEL_MS);
    return () => clearInterval(timer);
  }, [active, goTo]);

  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    setActive(Math.round(e.nativeEvent.contentOffset.x / SNAP));
    userScrolling.current = false;
  };

  return (
    <View style={styles.wrap}>
      <DiscoverSectionHeader
        label="Modules"
        title="Tout pour votre saison"
        subtitle="Glissez · 4 piliers"
        compact
      />

      <AnimatedScrollView
        ref={listRef}
        horizontal
        snapToInterval={SNAP}
        decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        onScrollBeginDrag={() => {
          userScrolling.current = true;
        }}
        onMomentumScrollEnd={onScrollEnd}
        contentContainerStyle={[
          styles.scrollPad,
          { paddingHorizontal: SIDE_PAD },
        ]}
      >
        {DISCOVER_FEATURES.map((f, i) => (
          <FeatureCard
            key={f.id}
            index={i}
            scrollX={scrollX}
            feature={f}
            onPress={() => onFeaturePress?.(f.id)}
          />
        ))}
      </AnimatedScrollView>

      <View style={styles.dots}>
        {DISCOVER_FEATURES.map((f, i) => (
          <CarouselDot
            key={f.id}
            index={i}
            scrollX={scrollX}
            snap={SNAP}
            onPress={() => goTo(i)}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { marginTop: spacing.md },
  scrollPad: {
    gap: CARD_GAP,
    paddingVertical: spacing.xs,
  },
  cardWrap: {},
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 168,
    overflow: 'hidden',
  },
  cover: {
    width: '100%',
    height: 72,
  },
  stripe: {
    position: 'absolute',
    left: 0,
    top: 72,
    bottom: 0,
    width: 4,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: spacing.sm,
    paddingBottom: spacing.sm,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
    marginTop: spacing.sm,
  },
  cardBody: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingRight: spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  title: {
    flex: 1,
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
  },
  num: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textMuted,
  },
  desc: {
    fontSize: 12,
    lineHeight: 16,
    color: colors.textSecondary,
    marginTop: 4,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
});
