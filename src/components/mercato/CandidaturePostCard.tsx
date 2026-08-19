import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { PressableSpring } from '../motion/PressableSpring';
import { Icon } from '../ui/Icon';
import { useAppTheme } from '../../context/ProductLineContext';
import { spacing, radius } from '../../theme/designTokens';
import { fontFamily } from '../../theme/typography';
import { useJoueurTheme } from '../../hooks/useJoueurTheme';
import { FUT18_PREMIUM } from '../../theme/fut18PremiumPalette';
import { JOUEUR_SURFACES } from '../../theme/joueurDesignSystem';

interface CandidaturePostCardProps {
  clubName: string;
  title: string;
  position: string;
  category: string;
  level: string;
  city: string;
  timeLabel: string;
  iaScore?: number;
  fitLabel?: string;
  onPress: () => void;
  variant?: 'default' | 'joueur';
}

export const CandidaturePostCard: React.FC<CandidaturePostCardProps> = ({
  clubName,
  title,
  position,
  category,
  level,
  city,
  timeLabel,
  iaScore,
  fitLabel,
  onPress,
  variant = 'joueur',
}) => {
  const { colors } = useAppTheme();
  const joueurTheme = useJoueurTheme();
  const joueur = variant === 'joueur';
  const styles = useMemo(
    () => createStyles(colors, joueur, joueurTheme),
    [colors, joueur, joueurTheme],
  );
  const meta = [position, category, level].filter(Boolean).join(' · ');
  const accent = joueur ? joueurTheme.accent : colors.accent;

  return (
    <PressableSpring
      style={styles.card}
      onPress={onPress}
      scaleTo={0.98}
      haptic
    >
      {joueur ? <View style={[styles.bar, { backgroundColor: accent }]} /> : null}
      <View style={styles.avatar}>
        <Text style={[styles.initial, { color: accent }]}>{clubName.charAt(0).toUpperCase()}</Text>
      </View>

      <View style={styles.body}>
        <View style={styles.head}>
          <Text style={styles.club} numberOfLines={1}>
            {clubName}
          </Text>
          {iaScore != null ? (
            <View style={[styles.matchBadge, { backgroundColor: joueur ? FUT18_PREMIUM.chipBg : colors.accentSoft }]}>
              <Text style={[styles.matchText, { color: accent }]}>{iaScore}%</Text>
            </View>
          ) : (
            <Text style={styles.time}>{timeLabel}</Text>
          )}
        </View>

        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>

        <Text style={styles.meta} numberOfLines={1}>
          {meta}
        </Text>

        {fitLabel ? (
          <Text style={styles.fit} numberOfLines={1}>
            {fitLabel}
          </Text>
        ) : null}

        <View style={styles.footer}>
          <View style={styles.location}>
            <Icon name="location" size={13} color={joueur ? joueurTheme.inkMuted : colors.textMuted} />
            <Text style={styles.locationText} numberOfLines={1}>
              {city}
            </Text>
          </View>
          <View style={styles.cta}>
            <Text style={[styles.ctaText, { color: accent }]}>Postuler</Text>
            <Icon name="chevron-forward" size={14} color={accent} />
          </View>
        </View>
      </View>
    </PressableSpring>
  );
};

function createStyles(
  c: { accent: string; text: string; textMuted: string; textSecondary: string; surface: string; border: string; accentSoft: string },
  joueur: boolean,
  joueurTheme: ReturnType<typeof useJoueurTheme>,
) {
  const ink = joueur ? joueurTheme.ink : c.text;
  const inkMuted = joueur ? joueurTheme.inkMuted : c.textMuted;
  const inkSecondary = joueur ? joueurTheme.inkMuted : c.textSecondary;

  return StyleSheet.create({
    card: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.md,
      borderRadius: joueur ? joueurTheme.cardRadius : radius.lg,
      padding: spacing.md,
      marginBottom: spacing.sm,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: joueur ? joueurTheme.border : c.border,
      backgroundColor: joueur ? JOUEUR_SURFACES.card : c.surface,
      overflow: 'hidden',
    },
    bar: {
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      width: 3,
    },
    avatar: {
      width: 44,
      height: 44,
      borderRadius: radius.md,
      backgroundColor: joueur ? FUT18_PREMIUM.chipBg : c.accentSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    initial: {
      fontFamily: fontFamily.bold,
      fontSize: 18,
      fontWeight: '800',
    },
    body: { flex: 1, minWidth: 0, gap: 4 },
    head: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
    },
    club: {
      flex: 1,
      fontSize: 11,
      fontWeight: '700',
      color: inkMuted,
      letterSpacing: 0.3,
      ...Platform.select({ android: { includeFontPadding: false } }),
    },
    time: {
      fontSize: 10,
      fontWeight: '600',
      color: inkMuted,
    },
    title: {
      fontSize: 15,
      fontWeight: '800',
      color: ink,
      letterSpacing: -0.2,
      lineHeight: 20,
    },
    meta: {
      fontSize: 12,
      fontWeight: '600',
      color: inkSecondary,
    },
    fit: {
      fontSize: 11,
      fontWeight: '600',
      color: inkMuted,
      fontStyle: 'italic',
    },
    footer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 4,
      gap: spacing.sm,
    },
    location: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    locationText: {
      flex: 1,
      fontSize: 11,
      fontWeight: '600',
      color: inkMuted,
    },
    matchBadge: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: radius.pill,
    },
    matchText: {
      fontSize: 11,
      fontWeight: '800',
    },
    cta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
    },
    ctaText: {
      fontSize: 12,
      fontWeight: '800',
    },
  });
}
