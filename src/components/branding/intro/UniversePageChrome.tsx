import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Platform, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { spacing, radius } from '../../../theme/designTokens';
import { PressableSpring } from '../../motion';
import { Icon } from '../../ui/Icon';
import { prodayMotion, useReducedMotion } from '../../../motion';
import type { CarouselPoleId } from '../../../models/CarouselPole';
import { UNIVERSE_ACCENT, UNIVERSE_SHORT } from './universeIntroAccents';
import { UNIVERSE_AMBIENT_FALLBACK } from './universePagerSnap';
import {
  universeEnterCtaLabel,
  universePoleDisplayName,
  universePoleTagline,
} from './universePoleBrand';

interface UniversePageChromeProps {
  lines: CarouselPoleId[];
  activeIndex: number;
  touring: boolean;
  interactionLocked?: boolean;
  showDismiss?: boolean;
  cinematic?: boolean;
  onDismiss?: () => void;
  onSkip: () => void;
  onChoose: (line: CarouselPoleId) => void;
  onJumpToIndex: (index: number) => void;
  /** Masque le pager mobile (dots) — tablette utilise la liste. */
  hidePagerDots?: boolean;
  /** Contenu latéral tablette (liste compacte). */
  sideRail?: React.ReactNode;
}

const DOT_INACTIVE = 'rgba(255,255,255,0.28)';

/** Header + copie + CTA — accent unique = univers actif (React, pas worklet Record). */
export const UniversePageChrome: React.FC<UniversePageChromeProps> = ({
  lines,
  activeIndex,
  touring,
  interactionLocked = false,
  showDismiss = false,
  cinematic = false,
  onDismiss,
  onSkip,
  onChoose,
  onJumpToIndex,
  hidePagerDots = false,
  sideRail,
}) => {
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const activeLine = lines[activeIndex] ?? lines[0];
  const activeAccent =
    (activeLine ? UNIVERSE_ACCENT[activeLine] : undefined) ?? UNIVERSE_AMBIENT_FALLBACK;
  const isLightCta = activeAccent.toUpperCase() === '#FFFFFF';
  const ctaLabel = activeLine ? universeEnterCtaLabel(activeLine) : '';
  const poleName = activeLine ? universePoleDisplayName(activeLine) : '';
  const tagline = activeLine ? universePoleTagline(activeLine) : '';
  const linesCount = lines.length;
  const showHeaderAction = touring || (showDismiss && onDismiss);

  const copyOpacity = useSharedValue(1);
  const copyScale = useSharedValue(1);

  useEffect(() => {
    if (reducedMotion) {
      copyOpacity.value = 1;
      copyScale.value = 1;
      return;
    }
    copyOpacity.value = 0.42;
    copyScale.value = 0.985;
    copyOpacity.value = withTiming(1, {
      duration: prodayMotion.duration.slow,
      easing: prodayMotion.easing.out,
    });
    copyScale.value = withSpring(1, prodayMotion.spring.smooth);
  }, [activeIndex, copyOpacity, copyScale, reducedMotion]);

  const copyStyle = useAnimatedStyle(() => ({
    opacity: copyOpacity.value,
    transform: [{ scale: copyScale.value }],
  }));

  if (!activeLine) {
    return null;
  }

  const cta = (
    <PressableSpring
      onPress={() => onChoose(activeLine)}
      scaleTo={0.98}
      haptic
      disabled={interactionLocked}
      style={styles.ctaWrap}
      accessibilityRole="button"
      accessibilityLabel={ctaLabel}
    >
      <View
        style={[
          styles.cta,
          { backgroundColor: activeAccent },
          isLightCta && styles.ctaOnLightAccent,
        ]}
      >
        <Text style={[styles.ctaText, isLightCta && styles.ctaTextDark]} numberOfLines={1}>
          {ctaLabel}
        </Text>
        <Icon name="chevron-forward" size={18} color={isLightCta ? '#0A0A0A' : '#FFFFFF'} />
      </View>
    </PressableSpring>
  );

  const copyBlock = (
    <Animated.View style={[styles.copyBlock, copyStyle]} accessibilityLiveRegion="polite">
      <Text
        style={[styles.poleName, { color: activeAccent }]}
        numberOfLines={1}
        accessibilityRole="header"
      >
        {poleName}
      </Text>
      <Text style={styles.tagline} numberOfLines={1}>
        {tagline}
      </Text>
    </Animated.View>
  );

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
          <View style={styles.headerCopy}>
            <Text style={[styles.title, cinematic && styles.titleWide]} numberOfLines={1}>
              Changer d’univers
            </Text>
          </View>
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

      {cinematic && sideRail ? (
        <View
          style={[
            styles.cinematicBody,
            {
              paddingHorizontal: spacing.xl * 1.5,
              paddingBottom: insets.bottom + spacing.md,
            },
          ]}
          pointerEvents="box-none"
        >
          <View style={styles.railCol}>{sideRail}</View>
          <View style={styles.previewCol} pointerEvents="box-none">
            {copyBlock}
            <View style={styles.ctaSlot}>{cta}</View>
          </View>
        </View>
      ) : (
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
          {copyBlock}

          {!hidePagerDots && linesCount > 1 ? (
            <View style={styles.dots} accessibilityRole="tablist">
              {lines.map((line, index) => {
                const selected = index === activeIndex;
                return (
                  <Pressable
                    key={line}
                    onPress={() => onJumpToIndex(index)}
                    disabled={interactionLocked}
                    hitSlop={8}
                    accessibilityRole="tab"
                    accessibilityLabel={UNIVERSE_SHORT[line]}
                    accessibilityState={{ selected }}
                  >
                    <View
                      style={[
                        styles.dot,
                        selected
                          ? { width: 18, backgroundColor: activeAccent }
                          : { width: 6, backgroundColor: DOT_INACTIVE },
                      ]}
                    />
                  </Pressable>
                );
              })}
            </View>
          ) : null}

          {cta}

          {linesCount > 1 ? (
            <Text style={styles.hint}>Glissez ou touchez pour changer</Text>
          ) : null}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    zIndex: 2,
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
  headerCopy: {
    flex: 1,
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
  cinematicBody: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: spacing.xl,
    paddingTop: spacing.md,
  },
  railCol: {
    width: 220,
    maxWidth: '34%',
    justifyContent: 'center',
  },
  previewCol: {
    flex: 1,
    justifyContent: 'flex-end',
    gap: spacing.lg,
    paddingBottom: spacing.sm,
  },
  copyBlock: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  poleName: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
    textAlign: 'center',
    ...Platform.select({ android: { includeFontPadding: false } }),
  },
  tagline: {
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 0.1,
    lineHeight: 20,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    maxWidth: 280,
    ...Platform.select({ android: { includeFontPadding: false } }),
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
  ctaSlot: {
    alignItems: 'stretch',
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
    shadowColor: '#FFFFFF',
    shadowOpacity: 0.18,
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
