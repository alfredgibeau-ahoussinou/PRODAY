import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { PressableSpring } from '../motion/PressableSpring';
import { Icon } from '../ui/Icon';
import { useAppTheme } from '../../context/ProductLineContext';
import { spacing, radius } from '../../theme/designTokens';
import { fontFamily } from '../../theme/typography';

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
}) => {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const meta = [position, category, level].filter(Boolean).join(' · ');

  return (
    <PressableSpring
      style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
      onPress={onPress}
      scaleTo={0.98}
      haptic
    >
      <View style={[styles.avatar, { backgroundColor: colors.accentSoft }]}>
        <Text style={[styles.initial, { color: colors.accent }]}>{clubName.charAt(0).toUpperCase()}</Text>
      </View>

      <View style={styles.body}>
        <View style={styles.head}>
          <Text style={[styles.club, { color: colors.textMuted }]} numberOfLines={1}>
            {clubName}
          </Text>
          {iaScore != null ? (
            <View style={[styles.matchBadge, { backgroundColor: colors.accentSoft }]}>
              <Text style={[styles.matchText, { color: colors.accent }]}>{iaScore}%</Text>
            </View>
          ) : (
            <Text style={[styles.time, { color: colors.textMuted }]}>{timeLabel}</Text>
          )}
        </View>

        <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
          {title}
        </Text>

        <Text style={[styles.meta, { color: colors.textSecondary }]} numberOfLines={1}>
          {meta}
        </Text>

        {fitLabel ? (
          <Text style={[styles.fit, { color: colors.textMuted }]} numberOfLines={1}>
            {fitLabel}
          </Text>
        ) : null}

        <View style={styles.footer}>
          <View style={styles.location}>
            <Icon name="location" size={13} color={colors.textMuted} />
            <Text style={[styles.locationText, { color: colors.textMuted }]} numberOfLines={1}>
              {city}
            </Text>
          </View>
          <View style={styles.cta}>
            <Text style={[styles.ctaText, { color: colors.accent }]}>Postuler</Text>
            <Icon name="chevron-forward" size={14} color={colors.accent} />
          </View>
        </View>
      </View>
    </PressableSpring>
  );
};

function createStyles(c: { accent: string }) {
  return StyleSheet.create({
    card: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.md,
      borderRadius: radius.lg,
      borderWidth: StyleSheet.hairlineWidth,
      padding: spacing.md,
      marginBottom: spacing.sm,
    },
    avatar: {
      width: 48,
      height: 48,
      borderRadius: radius.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    initial: {
      fontFamily: fontFamily.extrabold,
      fontSize: 18,
      fontWeight: '800',
      ...Platform.select({ android: { includeFontPadding: false } }),
    },
    body: { flex: 1, gap: 4, minWidth: 0 },
    head: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
    },
    club: {
      flex: 1,
      fontFamily: fontFamily.semibold,
      fontSize: 12,
      fontWeight: '600',
      ...Platform.select({ android: { includeFontPadding: false } }),
    },
    time: {
      fontFamily: fontFamily.regular,
      fontSize: 11,
      ...Platform.select({ android: { includeFontPadding: false } }),
    },
    matchBadge: {
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
      borderRadius: radius.pill,
    },
    matchText: {
      fontFamily: fontFamily.extrabold,
      fontSize: 11,
      fontWeight: '800',
      ...Platform.select({ android: { includeFontPadding: false } }),
    },
    title: {
      fontFamily: fontFamily.extrabold,
      fontSize: 16,
      fontWeight: '800',
      lineHeight: 21,
      letterSpacing: -0.2,
      ...Platform.select({ android: { includeFontPadding: false } }),
    },
    meta: {
      fontFamily: fontFamily.regular,
      fontSize: 13,
      lineHeight: 18,
      ...Platform.select({ android: { includeFontPadding: false } }),
    },
    fit: {
      fontFamily: fontFamily.regular,
      fontSize: 12,
      fontStyle: 'italic',
      ...Platform.select({ android: { includeFontPadding: false } }),
    },
    footer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 4,
      gap: spacing.sm,
    },
    location: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      flex: 1,
      minWidth: 0,
    },
    locationText: {
      fontFamily: fontFamily.regular,
      fontSize: 12,
      flex: 1,
      ...Platform.select({ android: { includeFontPadding: false } }),
    },
    cta: { flexDirection: 'row', alignItems: 'center', gap: 2 },
    ctaText: {
      fontFamily: fontFamily.bold,
      fontSize: 13,
      fontWeight: '700',
      ...Platform.select({ android: { includeFontPadding: false } }),
    },
  });
}
