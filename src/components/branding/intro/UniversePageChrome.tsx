import React from 'react';
import { View, Text, StyleSheet, Platform, Pressable } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated';
import { spacing, radius } from '../../../theme/designTokens';
import { PressableSpring } from '../../motion';
import { Icon } from '../../ui/Icon';
import type { ProductLineId } from '../../../models/ProductLine';
import { getUniverseIdentity } from '../../../content/brandExperience';
import { UNIVERSE_ACCENT } from './universeIntroAccents';

interface UniversePageChromeProps {
  lines: ProductLineId[];
  scrollX: SharedValue<number>;
  pageWidth: number;
  touring: boolean;
  onSkip: () => void;
  onChoose: (line: ProductLineId) => void;
  getActiveLine: () => ProductLineId;
  onNext: () => void;
  canGoNext: boolean;
}

const StorySegment: React.FC<{
  index: number;
  scrollX: SharedValue<number>;
  pageWidth: number;
  line: ProductLineId;
}> = ({ index, scrollX, pageWidth, line }) => {
  const accent = UNIVERSE_ACCENT[line];

  const fillStyle = useAnimatedStyle(() => {
    if (pageWidth <= 0) return { width: '0%' };
    const page = scrollX.value / pageWidth;
    let ratio = 0;
    if (page >= index + 1) ratio = 1;
    else if (page > index) ratio = page - index;
    return { width: `${ratio * 100}%` };
  });

  return (
    <View style={[styles.segmentTrack, { backgroundColor: `${accent}44` }]}>
      <Animated.View style={[styles.segmentFill, { backgroundColor: accent }, fillStyle]} />
    </View>
  );
};

const CtaLabelLayer: React.FC<{
  line: ProductLineId;
  index: number;
  scrollX: SharedValue<number>;
  pageWidth: number;
}> = ({ line, index, scrollX, pageWidth }) => {
  const identity = getUniverseIdentity(line);

  const style = useAnimatedStyle(() => {
    if (pageWidth <= 0) return { opacity: index === 0 ? 1 : 0 };
    const page = scrollX.value / pageWidth;
    const opacity = interpolate(
      page,
      [index - 0.45, index, index + 0.45],
      [0, 1, 0],
      Extrapolation.CLAMP
    );
    return { opacity };
  });

  return (
    <Animated.Text style={[styles.ctaLabel, style]} numberOfLines={1}>
      Choisir {identity.productName}
    </Animated.Text>
  );
};

/** Chrome fixe — barres de progression, CTA et navigation. */
export const UniversePageChrome: React.FC<UniversePageChromeProps> = ({
  lines,
  scrollX,
  pageWidth,
  touring,
  onSkip,
  onChoose,
  getActiveLine,
  onNext,
  canGoNext,
}) => {
  return (
    <View style={styles.root} pointerEvents="box-none">
      <View style={styles.top}>
        <View style={styles.segments}>
          {lines.map((line, index) => (
            <StorySegment
              key={line}
              line={line}
              index={index}
              scrollX={scrollX}
              pageWidth={pageWidth}
            />
          ))}
        </View>
        {touring ? (
          <Pressable onPress={onSkip} hitSlop={12} accessibilityLabel="Passer la présentation">
            <Text style={styles.skip}>Passer</Text>
          </Pressable>
        ) : (
          <View style={styles.skipSpacer} />
        )}
      </View>

      <View style={styles.bottom} pointerEvents="box-none">
        <View style={styles.bottomRow}>
          <PressableSpring
            onPress={() => onChoose(getActiveLine())}
            scaleTo={0.98}
            haptic
            style={styles.cta}
          >
            {lines.map((line, index) => (
              <CtaLabelLayer
                key={line}
                line={line}
                index={index}
                scrollX={scrollX}
                pageWidth={pageWidth}
              />
            ))}
          </PressableSpring>

          {canGoNext ? (
            <PressableSpring onPress={onNext} scaleTo={0.94} haptic style={styles.nextBtn}>
              <Icon name="chevron-forward" size={22} color="#fff" />
            </PressableSpring>
          ) : null}
        </View>

        <Text style={styles.hint}>
          {touring ? 'Glissez pour changer de page' : 'Glissez ou utilisez la flèche'}
        </Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  segments: {
    flex: 1,
    flexDirection: 'row',
    gap: 5,
  },
  segmentTrack: {
    flex: 1,
    height: 3,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  segmentFill: {
    height: '100%',
    borderRadius: radius.pill,
  },
  skip: {
    fontSize: 14,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.88)',
  },
  skipSpacer: {
    width: 48,
  },
  bottom: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  cta: {
    flex: 1,
    minHeight: 54,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  ctaLabel: {
    position: 'absolute',
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
    ...Platform.select({ android: { includeFontPadding: false } }),
  },
  nextBtn: {
    width: 54,
    height: 54,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hint: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.62)',
    textAlign: 'center',
  },
});
