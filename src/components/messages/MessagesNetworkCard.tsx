import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import type { SocialProfileSuggestion } from '../../features/v3/engines/socialRecommendation.engine';
import { PressableSpring } from '../motion';
import { Icon } from '../ui/Icon';
import { ProDayGradient } from '../ui/ProDayGradient';
import { useAppTheme } from '../../context/ProductLineContext';
import { spacing, radius } from '../../theme/designTokens';
import { fontFamily } from '../../theme/typography';

interface MessagesNetworkCardProps {
  suggestion: SocialProfileSuggestion;
  isSaved?: boolean;
  onPress: () => void;
}

export const MessagesNetworkCard: React.FC<MessagesNetworkCardProps> = ({
  suggestion,
  isSaved,
  onPress,
}) => {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const initial = suggestion.displayName.charAt(0).toUpperCase();
  const ctaLabel =
    suggestion.kind === 'mercato'
      ? 'Parcourir'
      : suggestion.kind === 'community'
        ? 'Explorer'
        : 'Découvrir';

  return (
    <PressableSpring
      onPress={onPress}
      scaleTo={0.98}
      haptic
      style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
    >
      <ProDayGradient kind="cta" style={styles.accent} />
      <View style={styles.body}>
        <View style={[styles.avatar, { backgroundColor: colors.accentSoft }]}>
          <Text style={[styles.initial, { color: colors.accent }]}>{initial}</Text>
          {isSaved ? (
            <View style={[styles.savedBadge, { backgroundColor: colors.accent }]}>
              <Icon name="bookmark" size={10} color={colors.brandInverse} />
            </View>
          ) : null}
        </View>

        <View style={styles.copy}>
          <View style={styles.head}>
            <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
              {suggestion.displayName}
            </Text>
            <View style={[styles.score, { backgroundColor: colors.accentSoft }]}>
              <Text style={[styles.scoreText, { color: colors.accent }]}>
                {suggestion.matchScore}%
              </Text>
            </View>
          </View>

          <Text style={[styles.role, { color: colors.textSecondary }]} numberOfLines={1}>
            {suggestion.role}
          </Text>

          <Text style={[styles.reason, { color: colors.textMuted }]} numberOfLines={2}>
            {suggestion.reason}
          </Text>

          <View style={styles.footer}>
            <View style={styles.cta}>
              <Text style={[styles.ctaText, { color: colors.accent }]}>{ctaLabel}</Text>
              <Icon name="chevron-forward" size={14} color={colors.accent} />
            </View>
          </View>
        </View>
      </View>
    </PressableSpring>
  );
};

function createStyles(_c: { accent: string }) {
  return StyleSheet.create({
    card: {
      borderRadius: radius.lg,
      borderWidth: StyleSheet.hairlineWidth,
      overflow: 'hidden',
      marginBottom: spacing.sm,
    },
    accent: { height: 3, width: '100%' },
    body: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.md,
      padding: spacing.md,
    },
    avatar: {
      width: 48,
      height: 48,
      borderRadius: radius.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    savedBadge: {
      position: 'absolute',
      right: -4,
      bottom: -4,
      width: 18,
      height: 18,
      borderRadius: 9,
      alignItems: 'center',
      justifyContent: 'center',
    },
    initial: {
      fontFamily: fontFamily.extrabold,
      fontSize: 18,
      fontWeight: '800',
      ...Platform.select({ android: { includeFontPadding: false } }),
    },
    copy: { flex: 1, minWidth: 0, gap: 3 },
    head: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
    },
    name: {
      flex: 1,
      fontFamily: fontFamily.extrabold,
      fontSize: 16,
      fontWeight: '800',
      letterSpacing: -0.2,
      ...Platform.select({ android: { includeFontPadding: false } }),
    },
    score: {
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
      borderRadius: radius.pill,
    },
    scoreText: {
      fontFamily: fontFamily.extrabold,
      fontSize: 11,
      fontWeight: '800',
      ...Platform.select({ android: { includeFontPadding: false } }),
    },
    role: {
      fontFamily: fontFamily.semibold,
      fontSize: 13,
      fontWeight: '600',
      ...Platform.select({ android: { includeFontPadding: false } }),
    },
    reason: {
      fontFamily: fontFamily.regular,
      fontSize: 12,
      lineHeight: 17,
      ...Platform.select({ android: { includeFontPadding: false } }),
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      marginTop: 4,
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
