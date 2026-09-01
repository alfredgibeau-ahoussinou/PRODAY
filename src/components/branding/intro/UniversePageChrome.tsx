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
import { UniverseGuideModal } from './UniverseGuideModal';

interface UniversePageChromeProps {
  lines: CarouselPoleId[];
  activeIndex: number;
  touring: boolean;
  interactionLocked?: boolean;
  /** Confirmation en cours — verrouille le CTA en état pressé. */
  confirming?: boolean;
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

const DOT_INACTIVE = 'rgba(255,255,255,0.22)';

export const UniversePageChrome: React.FC<UniversePageChromeProps> = ({
  lines,
  activeIndex,
  touring,
  interactionLocked = false,
  confirming = false,
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
  const [guideVisible, setGuideVisible] = React.useState(false);
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
  const ctaConfirm = useSharedValue(0);

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

  useEffect(() => {
    if (reducedMotion) {
      ctaConfirm.value = confirming ? 1 : 0;
      return;
    }
    ctaConfirm.value = withTiming(confirming ? 1 : 0, {
      duration: 100,
      easing: prodayMotion.easing.out,
    });
  }, [confirming, ctaConfirm, reducedMotion]);

  const copyStyle = useAnimatedStyle(() => ({
    opacity: copyOpacity.value,
    transform: [{ scale: copyScale.value }],
  }));

  const ctaConfirmStyle = useAnimatedStyle(() => ({
    opacity: 1 - ctaConfirm.value * 0.12,
    transform: [{ scale: 1 - ctaConfirm.value * 0.035 }],
  }));

  if (!activeLine) {
    return null;
  }

  const cta = (
    <Animated.View style={ctaConfirmStyle}>
      <PressableSpring
        onPress={() => onChoose(activeLine)}
        scaleTo={0.97}
        haptic
        disabled={interactionLocked || confirming}
        style={styles.ctaWrap}
        accessibilityRole="button"
        accessibilityLabel={ctaLabel}
        accessibilityState={{ busy: confirming }}
      >
        <View
          style={[
            styles.cta,
            { backgroundColor: activeAccent },
            isLightCta && styles.ctaOnLightAccent,
          ]}
        >
          <Text style={[styles.ctaText, isLightCta && styles.ctaTextDark]} numberOfLines={1}>
            {ctaLabel.toUpperCase()}
          </Text>
          <Icon name="chevron-forward" size={20} color={isLightCta ? '#07100C' : '#07100C'} />
        </View>
      </PressableSpring>
    </Animated.View>
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
      <Text style={styles.tagline} numberOfLines={2}>
        {tagline}
      </Text>
    </Animated.View>
  );

  return (
    <View style={styles.root} pointerEvents="box-none">
      {/* Top Header — Fitness Park Style */}
      <View
        style={[
          styles.top,
          {
            paddingTop: insets.top + (cinematic ? spacing.lg : spacing.xs),
            paddingHorizontal: cinematic ? spacing.xl * 1.5 : spacing.lg,
          },
        ]}
      >
        <View style={styles.headerRow}>
          <View style={styles.headerCopy}>
            <View style={styles.kickerRow}>
              <View style={[styles.kickerDot, { backgroundColor: activeAccent }]} />
              <Text style={styles.kicker}>ATHLETIC PASS & ESPACES</Text>
            </View>
            <Text style={[styles.title, cinematic && styles.titleWide]} numberOfLines={1}>
              Choisis ton pass
            </Text>
            <Pressable
              onPress={() => setGuideVisible(true)}
              style={[styles.guideTrigger, { borderColor: `${activeAccent}50`, backgroundColor: `${activeAccent}15` }]}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Ouvrir le guide des univers"
            >
              <Icon name="star-four-points" size={13} color={activeAccent} />
              <Text style={[styles.guideTriggerText, { color: activeAccent }]}>
                Comparer les accès
              </Text>
            </Pressable>
          </View>
          {showHeaderAction ? (
            <Pressable
              onPress={touring ? onSkip : onDismiss}
              disabled={!touring && interactionLocked}
              hitSlop={20}
              style={styles.skipBtn}
              accessibilityRole="button"
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
              paddingBottom: insets.bottom + spacing.sm,
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
                          ? { width: 28, backgroundColor: activeAccent }
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
            <Text style={styles.hint}>Glissez horizontalement pour changer de pass</Text>
          ) : null}
        </View>
      )}

      <UniverseGuideModal
        visible={guideVisible}
        onClose={() => setGuideVisible(false)}
        onSelectPole={(pole) => {
          const idx = lines.indexOf(pole);
          if (idx >= 0) {
            onJumpToIndex(idx);
          }
        }}
      />
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
    gap: 3,
  },
  kickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  kickerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  kicker: {
    fontFamily: 'System',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
    color: 'rgba(255, 255, 255, 0.7)',
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.6,
    color: '#FFFFFF',
    textTransform: 'uppercase',
    ...Platform.select({ android: { includeFontPadding: false } }),
  },
  skipBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  skip: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.85)',
  },
  skipSpacer: {
    width: 48,
  },
  guideTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  guideTriggerText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  titleWide: {
    fontSize: 28,
    letterSpacing: -0.5,
    maxWidth: 520,
  },
  bottom: {
    gap: spacing.sm,
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
    gap: 3,
    paddingHorizontal: 16,
  },
  poleName: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.5,
    textAlign: 'center',
    textTransform: 'uppercase',
    ...Platform.select({ android: { includeFontPadding: false } }),
  },
  tagline: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.2,
    lineHeight: 18,
    color: 'rgba(255,255,255,0.65)',
    textAlign: 'center',
    maxWidth: 320,
    ...Platform.select({ android: { includeFontPadding: false } }),
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginVertical: 2,
  },
  dot: {
    height: 5,
    borderRadius: 2.5,
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
    minHeight: 56,
    borderRadius: radius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  ctaOnLightAccent: {
    shadowColor: '#FFFFFF',
    shadowOpacity: 0.25,
  },
  ctaText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#07100C',
    letterSpacing: 0.8,
    textAlign: 'center',
    ...Platform.select({ android: { includeFontPadding: false } }),
  },
  ctaTextDark: {
    color: '#07100C',
  },
  hint: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.38)',
    textAlign: 'center',
  },
});
