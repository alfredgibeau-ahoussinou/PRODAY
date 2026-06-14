import React from 'react';
import { View, StyleSheet } from 'react-native';
import { PressableSpring } from '../motion/PressableSpring';
import { ProDayGradient } from '../ui/ProDayGradient';
import { ProDayText } from '../ui/ProDayText';
import { Icon } from '../ui/Icon';
import { useAppTheme } from '../../context/ProductLineContext';
import { spacing, radius, shadows } from '../../theme/designTokens';

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

  return (
    <PressableSpring
      style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }, shadows.card]}
      onPress={onPress}
      scaleTo={0.96}
      haptic
    >
      <ProDayGradient kind="cta" style={styles.accent} />
      <View style={styles.body}>
        <View style={styles.top}>
          <View style={[styles.avatar, { backgroundColor: colors.accentSoft }]}>
            <ProDayText variant="title" accent>
              {clubName.charAt(0).toUpperCase()}
            </ProDayText>
          </View>
          <View style={styles.headCopy}>
            <ProDayText variant="caption" muted numberOfLines={1}>
              {clubName}
            </ProDayText>
            <ProDayText variant="section" numberOfLines={2}>
              {title}
            </ProDayText>
          </View>
          <View style={[styles.timeBadge, { backgroundColor: colors.surfaceMuted }]}>
            {iaScore != null ? (
              <ProDayText variant="caption" accent style={styles.iaText}>
                IA {iaScore}%
              </ProDayText>
            ) : (
              <ProDayText variant="caption" muted>
                {timeLabel}
              </ProDayText>
            )}
          </View>
        </View>

        {fitLabel ? (
          <ProDayText variant="caption" muted style={styles.fitLabel}>
            {fitLabel} pour votre profil
          </ProDayText>
        ) : null}

        <View style={styles.chips}>
          <Chip label={position} />
          <Chip label={category} />
          <Chip label={level} />
        </View>

        <View style={styles.footer}>
          <View style={styles.location}>
            <Icon name="location" size={14} color={colors.textMuted} />
            <ProDayText variant="caption" muted>
              {city}
              {iaScore != null ? ` · ${timeLabel}` : ''}
            </ProDayText>
          </View>
          <View style={styles.cta}>
            <ProDayText variant="caption" accent style={styles.ctaText}>
              Postuler
            </ProDayText>
            <Icon name="chevron-forward" size={14} color={colors.accent} />
          </View>
        </View>
      </View>
    </PressableSpring>
  );
};

const Chip: React.FC<{ label: string }> = ({ label }) => {
  const { colors } = useAppTheme();
  return (
    <View style={[styles.chip, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}>
      <ProDayText variant="caption" numberOfLines={1}>
        {label}
      </ProDayText>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.xl,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  accent: {
    height: 3,
    width: '100%',
  },
  body: { padding: spacing.md },
  top: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headCopy: { flex: 1, gap: 2, minWidth: 0 },
  timeBadge: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  iaText: { fontWeight: '800', fontSize: 10 },
  fitLabel: { marginBottom: spacing.xs, fontStyle: 'italic' },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
    borderWidth: 1,
    maxWidth: '48%',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  location: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cta: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  ctaText: { fontWeight: '800' },
});
