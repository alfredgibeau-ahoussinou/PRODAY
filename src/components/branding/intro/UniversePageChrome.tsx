import React from 'react';
import { View, Text, StyleSheet, Platform, Pressable } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { spacing, radius } from '../../../theme/designTokens';
import { PressableSpring } from '../../motion';
import { Icon } from '../../ui/Icon';
import type { CarouselPoleId } from '../../../models/CarouselPole';
import { getCarouselPoleIdentity } from '../../../content/carouselPoleExperience';
import { UNIVERSE_ACCENT, UNIVERSE_SHORT } from './universeIntroAccents';
import { UNIVERSE_FEATURE_CHIPS } from './universeChoiceShared';

interface UniversePageChromeProps {
  lines: CarouselPoleId[];
  activeIndex: number;
  scrollX: SharedValue<number>;
  pageWidth: number;
  touring: boolean;
  interactionLocked?: boolean;
  showDismiss?: boolean;
  onDismiss?: () => void;
  onSkip: () => void;
  onChoose: (line: CarouselPoleId) => void;
  onJumpToIndex: (index: number) => void;
}

const StorySegment: React.FC<{
  index: number;
  scrollX: SharedValue<number>;
  pageWidth: number;
  line: CarouselPoleId;
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
    <View style={[styles.segmentTrack, { backgroundColor: `${accent}40` }]}>
      <Animated.View style={[styles.segmentFill, { backgroundColor: accent }, fillStyle]} />
    </View>
  );
};

/** Barres de progression, compteur et CTA contextualisé. */
export const UniversePageChrome: React.FC<UniversePageChromeProps> = ({
  lines,
  activeIndex,
  scrollX,
  pageWidth,
  touring,
  interactionLocked = false,
  showDismiss = false,
  onDismiss,
  onSkip,
  onChoose,
  onJumpToIndex,
}) => {
  const insets = useSafeAreaInsets();
  const activeLine = lines[activeIndex];
  const identity = getCarouselPoleIdentity(activeLine);

  return (
    <View style={styles.root} pointerEvents="box-none">
      <View style={[styles.top, { paddingTop: insets.top + spacing.sm }]}>
        <View style={styles.segments}>
          {lines.map((line, index) => (
            <Pressable
              key={line}
              style={styles.segmentHit}
              disabled={interactionLocked}
              onPress={() => onJumpToIndex(index)}
              accessibilityLabel={UNIVERSE_SHORT[line]}
              accessibilityState={{ selected: index === activeIndex }}
            >
              <StorySegment
                line={line}
                index={index}
                scrollX={scrollX}
                pageWidth={pageWidth}
              />
            </Pressable>
          ))}
        </View>
        {touring ? (
          <Pressable onPress={onSkip} hitSlop={12} accessibilityLabel="Passer la présentation">
            <Text style={styles.skip}>Passer</Text>
          </Pressable>
        ) : showDismiss && onDismiss ? (
          <Pressable
            onPress={onDismiss}
            disabled={interactionLocked}
            hitSlop={12}
            accessibilityLabel="Fermer le sélecteur de pôle"
          >
            <Text style={styles.skip}>Fermer</Text>
          </Pressable>
        ) : (
          <View style={styles.skipSpacer} />
        )}
      </View>

      <View style={[styles.bottom, { paddingBottom: insets.bottom + spacing.md }]} pointerEvents="box-none">
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.5)']}
          style={styles.bottomFade}
          pointerEvents="none"
        />

        <Text style={styles.counter}>
          {String(activeIndex + 1).padStart(2, '0')} / {String(lines.length).padStart(2, '0')}
          <Text style={styles.counterSep}> · </Text>
          {UNIVERSE_SHORT[activeLine]}
        </Text>

        <View style={styles.chips}>
          {UNIVERSE_FEATURE_CHIPS[activeLine].map((chip) => (
            <View
              key={chip}
              style={[
                styles.chip,
                activeLine === 'sponsor' && styles.chipSponsor,
              ]}
            >
              <Text
                style={[
                  styles.chipText,
                  activeLine === 'sponsor' && styles.chipTextSponsor,
                ]}
              >
                {chip}
              </Text>
            </View>
          ))}
        </View>

        <PressableSpring
          onPress={() => onChoose(activeLine)}
          scaleTo={0.98}
          haptic
          disabled={interactionLocked}
          style={[styles.cta, activeLine === 'sponsor' && styles.ctaSponsor]}
        >
          <Text style={styles.ctaText} numberOfLines={1}>
            Continuer · {identity.productName}
          </Text>
          <Icon name="chevron-forward" size={18} color="#0A0A0A" />
        </PressableSpring>

        <Text style={styles.hint}>Glissez pour parcourir les pôles</Text>
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
  },
  segments: {
    flex: 1,
    flexDirection: 'row',
    gap: 4,
  },
  segmentHit: {
    flex: 1,
  },
  segmentTrack: {
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
    gap: spacing.sm,
    alignItems: 'stretch',
  },
  bottomFade: {
    ...StyleSheet.absoluteFillObject,
    top: -40,
  },
  counter: {
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.55)',
    ...Platform.select({ android: { includeFontPadding: false } }),
  },
  counterSep: {
    color: 'rgba(255,255,255,0.28)',
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 2,
  },
  chip: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  chipSponsor: {
    backgroundColor: 'rgba(212, 175, 55, 0.16)',
    borderColor: 'rgba(212, 175, 55, 0.45)',
  },
  chipText: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.82)',
    letterSpacing: 0.2,
    ...Platform.select({ android: { includeFontPadding: false } }),
  },
  chipTextSponsor: {
    color: '#F5D76E',
  },
  cta: {
    minHeight: 54,
    borderRadius: radius.pill,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 16,
    elevation: 8,
  },
  ctaSponsor: {
    backgroundColor: '#D4AF37',
    shadowColor: '#D4AF37',
    shadowOpacity: 0.35,
  },
  ctaText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0A0A0A',
    flexShrink: 1,
    ...Platform.select({ android: { includeFontPadding: false } }),
  },
  hint: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.45)',
    textAlign: 'center',
    marginTop: 2,
  },
});
