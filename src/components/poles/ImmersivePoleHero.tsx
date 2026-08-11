import React, { useMemo } from 'react';
import { StyleSheet, View, type ViewStyle, type StyleProp } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ProDayText } from '../ui/ProDayText';
import { PressableSpring, AnimatedEntrance } from '../motion';
import { useAppTheme } from '../../context/ProductLineContext';
import { radius, spacing } from '../../theme/designTokens';
import type { AppColors } from '../../theme/universeTheme';
import {
  ImmersivePitchScene,
  type ImmersivePitchMood,
} from './ImmersivePitchScene';

type Props = {
  kicker: string;
  title: string;
  support?: string;
  primaryLabel?: string;
  onPrimaryPress?: () => void;
  secondaryLabel?: string;
  onSecondaryPress?: () => void;
  /** Ambiance terrain (âge joueur / pôle). */
  mood?: ImmersivePitchMood;
  /** Accent optionnel (hex) pour glow / CTA. */
  accentHex?: string;
  /** Affiche la scène 2.5D terrain + ballon. */
  showPitch?: boolean;
  style?: StyleProp<ViewStyle>;
};

/**
 * Hero pôle immersif — accroche + CTA + scène terrain animée (pas de dashboard chips).
 */
export function ImmersivePoleHero({
  kicker,
  title,
  support,
  primaryLabel,
  onPrimaryPress,
  secondaryLabel,
  onSecondaryPress,
  mood = 'dynamic_competitive',
  accentHex,
  showPitch = true,
  style,
}: Props) {
  const { colors: c } = useAppTheme();
  const styles = useMemo(() => createStyles(c), [c]);
  const accent = accentHex ?? c.brand;
  const deep: [string, string] =
    mood === 'warm_playful'
      ? ['#1A3D2A', '#0D2418']
      : mood === 'precise_performance'
        ? ['#071510', '#020806']
        : mood === 'club'
          ? ['#0C2418', '#06140D']
          : mood === 'coach'
            ? ['#0A1F16', '#050F0B']
            : ['#0E2A1C', '#071810'];

  return (
    <AnimatedEntrance kind="fadeUp">
      <View style={[styles.wrap, style]}>
        <LinearGradient colors={deep} style={StyleSheet.absoluteFillObject} />
        {showPitch ? <ImmersivePitchScene mood={mood} height={128} /> : null}
        <View style={[styles.glow, { backgroundColor: accent }]} />
        <View style={styles.content}>
          <ProDayText variant="eyebrow" style={[styles.kicker, { color: accent }]}>
            {kicker}
          </ProDayText>
          <ProDayText variant="hero" style={styles.title}>
            {title}
          </ProDayText>
          {support ? (
            <ProDayText variant="body" style={styles.support}>
              {support}
            </ProDayText>
          ) : null}
          {primaryLabel && onPrimaryPress ? (
            <View style={styles.ctaRow}>
              <PressableSpring
                style={[styles.ctaPrimary, { backgroundColor: accent }]}
                onPress={onPrimaryPress}
                scaleTo={0.97}
                haptic
              >
                <ProDayText variant="caption" inverse style={styles.ctaLabel}>
                  {primaryLabel}
                </ProDayText>
              </PressableSpring>
              {secondaryLabel && onSecondaryPress ? (
                <PressableSpring
                  style={styles.ctaSecondary}
                  onPress={onSecondaryPress}
                  scaleTo={0.97}
                >
                  <ProDayText variant="caption" style={styles.ctaSecondaryLabel}>
                    {secondaryLabel}
                  </ProDayText>
                </PressableSpring>
              ) : null}
            </View>
          ) : null}
        </View>
      </View>
    </AnimatedEntrance>
  );
}

function createStyles(_c: AppColors) {
  return StyleSheet.create({
    wrap: {
      position: 'relative',
      overflow: 'hidden',
      borderRadius: radius.xl,
      minHeight: 220,
      marginBottom: spacing.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: 'rgba(255,255,255,0.12)',
    },
    glow: {
      position: 'absolute',
      top: -50,
      right: -30,
      width: 180,
      height: 180,
      borderRadius: 90,
      opacity: 0.28,
    },
    content: {
      padding: spacing.lg,
      paddingBottom: spacing.lg + 56,
      gap: spacing.sm,
      zIndex: 2,
    },
    kicker: {
      letterSpacing: 1.5,
      textTransform: 'uppercase',
      fontSize: 10,
      fontWeight: '800',
    },
    title: {
      fontSize: 28,
      lineHeight: 32,
      letterSpacing: -0.6,
      fontWeight: '800',
      maxWidth: '94%',
      color: '#F7FBF8',
    },
    support: {
      maxWidth: '95%',
      lineHeight: 20,
      color: 'rgba(247,251,248,0.78)',
    },
    ctaRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
      marginTop: spacing.xs,
    },
    ctaPrimary: {
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    ctaSecondary: {
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: 'rgba(255,255,255,0.35)',
      backgroundColor: 'rgba(0,0,0,0.25)',
    },
    ctaLabel: { fontWeight: '800' },
    ctaSecondaryLabel: { fontWeight: '700', color: '#F7FBF8' },
  });
}
