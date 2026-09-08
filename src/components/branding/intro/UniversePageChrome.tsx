import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Platform, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { spacing, radius } from '../../../theme/designTokens';
import { PressableSpring } from '../../motion';
import { Icon } from '../../ui/Icon';
import { prodayMotion, useReducedMotion } from '../../../motion';
import type { CarouselPoleId } from '../../../models/CarouselPole';
import { UNIVERSE_SHORT } from './universeIntroAccents';
import {
  UNIVERSE_ENTRY_ACCENT,
  UNIVERSE_ENTRY_INK_ON_ACCENT,
} from './universeEntryAuth';
import {
  universeEnterCtaLabel,
  universePoleDisplayName,
} from './universePoleBrand';
import { UniverseGuideModal } from './UniverseGuideModal';
import { UNIVERSE_SIDE_RAIL_WIDTH } from './universePagerSnap';

interface UniversePageChromeProps {
  lines: CarouselPoleId[];
  activeIndex: number;
  touring: boolean;
  interactionLocked?: boolean;
  confirming?: boolean;
  showDismiss?: boolean;
  cinematic?: boolean;
  onDismiss?: () => void;
  onSkip: () => void;
  onChoose: (line: CarouselPoleId) => void;
  onJumpToIndex: (index: number) => void;
  hidePagerDots?: boolean;
  sideRail?: React.ReactNode;
}

const DOT_INACTIVE = 'rgba(255,255,255,0.18)';

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
  // Chrome d’entrée unifié look Club (émeraude) — plus de CTA blanc/or disparates.
  const activeAccent = UNIVERSE_ENTRY_ACCENT;
  const ctaLabel = activeLine ? universeEnterCtaLabel(activeLine) : '';
  const linesCount = lines.length;
  const showHeaderAction = touring || (showDismiss && onDismiss);
  const hasSideRail = Boolean(sideRail);

  const ctaConfirm = useSharedValue(0);

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

  const ctaConfirmStyle = useAnimatedStyle(() => ({
    opacity: 1 - ctaConfirm.value * 0.12,
    transform: [{ scale: 1 - ctaConfirm.value * 0.03 }],
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
          ]}
        >
          <Text style={styles.ctaText} numberOfLines={1}>
            {ctaLabel}
          </Text>
          <Icon name="chevron-forward" size={18} color={UNIVERSE_ENTRY_INK_ON_ACCENT} />
        </View>
      </PressableSpring>
    </Animated.View>
  );

  const mainPadLeft = hasSideRail ? UNIVERSE_SIDE_RAIL_WIDTH + 8 : 20;

  return (
    <View style={styles.root} pointerEvents="box-none">
      {hasSideRail ? (
        <View
          style={[
            styles.sideRailHost,
            {
              width: UNIVERSE_SIDE_RAIL_WIDTH,
              paddingTop: insets.top + 56,
              paddingBottom: insets.bottom + 24,
            },
          ]}
          pointerEvents="box-none"
        >
          {sideRail}
        </View>
      ) : null}

      {/* Header minimaliste épuré */}
      <View
        style={[
          styles.top,
          {
            paddingTop: insets.top + 8,
            paddingLeft: mainPadLeft,
            paddingRight: 20,
          },
        ]}
      >
        <View style={styles.headerRow}>
          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle}>
              {cinematic ? 'Choisissez votre univers' : 'Sélectionnez votre univers'}
            </Text>
            {cinematic && activeLine ? (
              <Text style={styles.headerActive} numberOfLines={1}>
                {universePoleDisplayName(activeLine)}
              </Text>
            ) : null}
          </View>
          {showHeaderAction ? (
            <Pressable
              onPress={touring ? onSkip : onDismiss}
              disabled={!touring && interactionLocked}
              hitSlop={16}
              style={styles.actionBtn}
              accessibilityRole="button"
              accessibilityLabel={touring ? 'Passer' : 'Fermer'}
            >
              <Text style={styles.actionBtnText}>{touring ? 'Passer' : 'Fermer'}</Text>
            </Pressable>
          ) : (
            <View style={styles.actionSpacer} />
          )}
        </View>
      </View>

      {/* Footer : dots (mobile) + CTA + guide */}
      <View
        style={[
          styles.bottom,
          {
            paddingBottom: insets.bottom + 16,
            paddingLeft: mainPadLeft,
            paddingRight: 20,
          },
        ]}
        pointerEvents="box-none"
      >
        {!hidePagerDots && linesCount > 1 ? (
          <View style={styles.dots} accessibilityRole="tablist">
            {lines.map((line, index) => {
              const selected = index === activeIndex;
              return (
                <Pressable
                  key={line}
                  onPress={() => onJumpToIndex(index)}
                  disabled={interactionLocked}
                  hitSlop={10}
                  accessibilityRole="tab"
                  accessibilityLabel={UNIVERSE_SHORT[line]}
                  accessibilityState={{ selected }}
                >
                  <View
                    style={[
                      styles.dot,
                      selected
                        ? { width: 22, backgroundColor: activeAccent }
                        : { width: 6, backgroundColor: DOT_INACTIVE },
                    ]}
                  />
                </Pressable>
              );
            })}
          </View>
        ) : null}

        {cta}

        <PressableSpring
          onPress={() => setGuideVisible(true)}
          scaleTo={0.97}
          haptic
          style={styles.quizTriggerBtn}
          accessibilityRole="button"
          accessibilityLabel="Trouver mon pôle avec le Quiz Express"
        >
          <View style={styles.quizTriggerBadge}>
            <Text style={styles.quizTriggerBadgeText}>QUIZ EXPRESS</Text>
          </View>
          <Text style={styles.quizTriggerText}>Quel pôle choisir ? Guide 10s</Text>
          <Icon name="chevron-forward" size={14} color="#F5D04A" />
        </PressableSpring>
      </View>

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
  sideRailHost: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    zIndex: 4,
    paddingLeft: spacing.md,
    justifyContent: 'center',
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  top: {
    zIndex: 3,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 40,
  },
  headerTitleWrap: {
    flex: 1,
    gap: 2,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.75)',
    letterSpacing: -0.2,
  },
  headerActive: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.45)',
  },
  actionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  actionSpacer: {
    width: 40,
  },
  bottom: {
    gap: 12,
    alignItems: 'stretch',
    zIndex: 3,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  dot: {
    height: 4,
    borderRadius: 2,
  },
  ctaWrap: {
    borderRadius: radius.pill,
    overflow: 'hidden',
    alignSelf: 'center',
    width: '100%',
    maxWidth: 380,
  },
  cta: {
    minHeight: 54,
    borderRadius: radius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  ctaText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#07100C',
    letterSpacing: 0.2,
    textAlign: 'center',
    ...Platform.select({ android: { includeFontPadding: false } }),
  },
  ctaTextDark: {
    color: '#000000',
  },
  quizTriggerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(245, 208, 74, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(245, 208, 74, 0.35)',
    alignSelf: 'center',
    marginTop: 8,
  },
  quizTriggerBadge: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 6,
    backgroundColor: '#F5D04A',
  },
  quizTriggerBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#000000',
    letterSpacing: 0.5,
  },
  quizTriggerText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
});
