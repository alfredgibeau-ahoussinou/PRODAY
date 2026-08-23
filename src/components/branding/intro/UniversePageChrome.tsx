import React from 'react';
import { View, Text, StyleSheet, Platform, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { spacing, radius } from '../../../theme/designTokens';
import { PressableSpring } from '../../motion';
import { Icon } from '../../ui/Icon';
import { ProDaySymbol } from '../ProDaySymbol';
import type { CarouselPoleId } from '../../../models/CarouselPole';
import { UNIVERSE_ACCENT, UNIVERSE_SHORT } from './universeIntroAccents';
import { universeEnterCtaLabel } from './universePoleBrand';

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
}

const Dot: React.FC<{
  index: number;
  active: boolean;
  accent: string;
  onPress: () => void;
  disabled?: boolean;
  label: string;
}> = ({ active, accent, onPress, disabled, label }) => (
  <Pressable
    onPress={onPress}
    disabled={disabled}
    hitSlop={8}
    accessibilityLabel={label}
    accessibilityState={{ selected: active }}
    style={[
      styles.dot,
      active
        ? { backgroundColor: accent, width: 18 }
        : { backgroundColor: 'rgba(255,255,255,0.28)' },
    ]}
  />
);

/**
 * Header brand + CTA contextualisé.
 * Symbole master inchangé ; accent pôle sur le CTA uniquement.
 */
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
}) => {
  const insets = useSafeAreaInsets();
  const activeLine = lines[activeIndex] ?? lines[0];
  const accent = UNIVERSE_ACCENT[activeLine];
  const ctaLabel = universeEnterCtaLabel(activeLine);
  const isLightCta = activeLine === 'president';

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
          <ProDaySymbol size={cinematic ? 36 : 28} variant="master" tone="white" showAccentBar={false} />
          <View style={styles.headerActions}>
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
        </View>

        <Text style={[styles.title, cinematic && styles.titleWide]}>
          Choisissez votre univers
        </Text>
        <Text style={[styles.subtitle, cinematic && styles.subtitleWide]}>
          Une plateforme. Plusieurs façons de vivre le football.
        </Text>
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
            <Dot
              key={line}
              index={index}
              active={index === activeIndex}
              accent={UNIVERSE_ACCENT[line]}
              label={UNIVERSE_SHORT[line]}
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
              { backgroundColor: accent },
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

        <Text style={styles.hint}>Glissez ou touchez un point · le swipe n’est pas obligatoire</Text>
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
    gap: spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  headerActions: {
    minHeight: 28,
    justifyContent: 'center',
  },
  skip: {
    fontSize: 14,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.88)',
  },
  skipSpacer: {
    width: 48,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.6,
    color: '#FFFFFF',
    ...Platform.select({ android: { includeFontPadding: false } }),
  },
  titleWide: {
    fontSize: 34,
    letterSpacing: -0.8,
    maxWidth: 520,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.55)',
    maxWidth: 320,
    ...Platform.select({ android: { includeFontPadding: false } }),
  },
  subtitleWide: {
    fontSize: 16,
    lineHeight: 24,
    maxWidth: 440,
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
    width: 6,
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
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 16,
    elevation: 8,
  },
  ctaOnLightAccent: {
    shadowColor: '#FBBF24',
    shadowOpacity: 0.28,
  },
  ctaText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    flexShrink: 1,
    ...Platform.select({ android: { includeFontPadding: false } }),
  },
  ctaTextDark: {
    color: '#0A0A0A',
  },
  hint: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.4)',
    textAlign: 'center',
  },
});
