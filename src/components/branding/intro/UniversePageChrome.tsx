import React from 'react';
import { View, Text, StyleSheet, Platform, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated';
import { spacing, radius } from '../../../theme/designTokens';
import { PressableSpring } from '../../motion';
import { Icon } from '../../ui/Icon';
import type { CarouselPoleId } from '../../../models/CarouselPole';
import { UNIVERSE_ACCENT, UNIVERSE_SHORT } from './universeIntroAccents';
import { universeEnterCtaLabel } from './universePoleBrand';

interface UniversePageChromeProps {
  lines: CarouselPoleId[];
  activeIndex: number;
  scrollX: SharedValue<number>;
  itemWidth: number;
  touring: boolean;
  interactionLocked?: boolean;
  showDismiss?: boolean;
  cinematic?: boolean;
  onDismiss?: () => void;
  onSkip: () => void;
  onChoose: (line: CarouselPoleId) => void;
  onJumpToIndex: (index: number) => void;
}

const AnimatedDot: React.FC<{
  index: number;
  activeIndex: number;
  line: CarouselPoleId;
  itemWidth: number;
  scrollX: SharedValue<number>;
  linesCount: number;
  disabled?: boolean;
  onPress: () => void;
}> = ({ index, activeIndex, line, itemWidth, scrollX, linesCount, disabled, onPress }) => {
  const accent = UNIVERSE_ACCENT[line];
  const label = UNIVERSE_SHORT[line];
  const inactive = 'rgba(255,255,255,0.28)';

  const dotStyle = useAnimatedStyle(() => {
    if (itemWidth <= 0 || linesCount <= 1) {
      return { width: 18, opacity: 1, backgroundColor: accent };
    }
    const page = scrollX.value / itemWidth;
    const dist = Math.abs(page - index);
    const width = interpolate(dist, [0, 0.35, 1], [18, 10, 6], Extrapolation.CLAMP);
    const opacity = interpolate(dist, [0, 0.5, 1], [1, 0.72, 0.38], Extrapolation.CLAMP);
    return {
      width,
      opacity,
      backgroundColor: dist < 0.35 ? accent : inactive,
    };
  }, [accent, inactive, index, itemWidth, linesCount]);

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={8}
      accessibilityLabel={label}
      accessibilityState={{ selected: index === activeIndex }}
    >
      <Animated.View style={[styles.dot, dotStyle]} />
    </Pressable>
  );
};

/** Header épuré + CTA accent via état React (liveIndex) — zéro interpolateColor worklet. */
export const UniversePageChrome: React.FC<UniversePageChromeProps> = ({
  lines,
  activeIndex,
  scrollX,
  itemWidth,
  touring,
  interactionLocked = false,
  showDismiss = false,
  cinematic = false,
  onDismiss,
  onSkip,
  onChoose,
  onJumpToIndex,
}) => {
  const insets = useSafeAreaInsets();
  const activeLine = lines[activeIndex] ?? lines[0];
  const isLightCta = activeLine === 'president';
  const activeAccent = UNIVERSE_ACCENT[activeLine];
  const ctaLabel = universeEnterCtaLabel(activeLine);
  const linesCount = lines.length;

  const showHeaderAction = touring || (showDismiss && onDismiss);

  return (
    <View style={styles.root} pointerEvents="box-none">
      <View
        style={[
          styles.top,
          {
            paddingTop: insets.top + (cinematic ? spacing.lg : spacing.md),
            paddingHorizontal: cinematic ? spacing.xl * 1.5 : spacing.lg,
          },
        ]}
      >
        <View style={styles.headerRow}>
          <Text style={[styles.title, cinematic && styles.titleWide]} numberOfLines={2}>
            Choisissez votre univers
          </Text>
          {showHeaderAction ? (
            <Pressable
              onPress={touring ? onSkip : onDismiss}
              disabled={!touring && interactionLocked}
              hitSlop={12}
              accessibilityLabel={
                touring ? 'Passer la présentation' : 'Fermer le sélecteur de pôle'
              }
            >
              <Text style={styles.skip}>{touring ? 'Passer' : 'Fermer'}</Text>
            </Pressable>
          ) : (
            <View style={styles.skipSpacer} />
          )}
        </View>
      </View>

      <View
        style={[
          styles.bottom,
          {
            paddingBottom: insets.bottom + spacing.md,
            paddingHorizontal: cinematic ? spacing.xl * 1.5 : spacing.lg,
          },
        ]}
        pointerEvents="box-none"
      >
        <View style={styles.dots}>
          {lines.map((line, index) => (
            <AnimatedDot
              key={line}
              index={index}
              activeIndex={activeIndex}
              line={line}
              itemWidth={itemWidth}
              scrollX={scrollX}
              linesCount={linesCount}
              disabled={interactionLocked}
              onPress={() => onJumpToIndex(index)}
            />
          ))}
        </View>

        <PressableSpring
          onPress={() => onChoose(activeLine)}
          scaleTo={0.98}
          haptic
          disabled={interactionLocked}
          style={styles.ctaWrap}
        >
          <View
            style={[
              styles.cta,
              { backgroundColor: activeAccent },
              isLightCta && styles.ctaOnLightAccent,
            ]}
          >
            <Text
              style={[styles.ctaText, isLightCta && styles.ctaTextDark]}
              numberOfLines={1}
            >
              {ctaLabel}
            </Text>
            <Icon
              name="chevron-forward"
              size={18}
              color={isLightCta ? '#0A0A0A' : '#FFFFFF'}
            />
          </View>
        </PressableSpring>

        <Text style={styles.hint}>Glissez ou touchez un point</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
  },
  top: {
    gap: spacing.xs,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  skip: {
    fontSize: 14,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.72)',
    paddingTop: 2,
  },
  skipSpacer: {
    width: 48,
  },
  title: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.4,
    color: 'rgba(255,255,255,0.88)',
    ...Platform.select({ android: { includeFontPadding: false } }),
  },
  titleWide: {
    fontSize: 24,
    letterSpacing: -0.5,
    maxWidth: 520,
  },
  bottom: {
    gap: spacing.md,
    alignItems: 'stretch',
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 7,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  ctaWrap: {
    borderRadius: radius.pill,
    overflow: 'hidden',
    alignSelf: 'center',
    width: '100%',
    maxWidth: 420,
  },
  cta: {
    minHeight: 54,
    borderRadius: radius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 12,
    elevation: 6,
  },
  ctaOnLightAccent: {
    shadowColor: '#FBBF24',
    shadowOpacity: 0.22,
  },
  ctaText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    ...Platform.select({ android: { includeFontPadding: false } }),
  },
  ctaTextDark: {
    color: '#0A0A0A',
  },
  hint: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.32)',
    textAlign: 'center',
  },
});
