import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { RecruitmentStats } from '../../services/stats.service';
import { Icon } from '../ui/Icon';
import type { AppColors } from '../../theme/universeTheme';
import type { IconName } from '../ui/Icon';
import { spacing, radius, shadows } from '../../theme/designTokens';

interface MercatoHeroProps {
  colors: AppColors;
  title: string;
  subtitle: string;
  icon: IconName;
  stats: RecruitmentStats | null;
  loading?: boolean;
  applicationsCount?: number;
  playersStatLabel?: string;
  onApplicationsPress?: () => void;
}

export const MercatoHero: React.FC<MercatoHeroProps> = ({
  colors,
  title,
  subtitle,
  icon,
  stats,
  loading,
  applicationsCount,
  playersStatLabel = 'Joueurs',
  onApplicationsPress,
}) => (
  <View
    style={[
      styles.wrap,
      { backgroundColor: colors.brand, borderColor: colors.borderStrong },
      shadows.card,
    ]}
  >
    <View style={styles.top}>
      <View style={[styles.iconBox, { backgroundColor: 'rgba(255,255,255,0.14)' }]}>
        <Icon name={icon} size={24} color={colors.brandInverse} variant="filled" />
      </View>
      <View style={styles.copy}>
        <Text style={[styles.title, { color: colors.brandInverse }]}>{title}</Text>
        <Text style={[styles.sub, { color: colors.heroMuted }]}>{subtitle}</Text>
      </View>
    </View>
    <View style={styles.statsRow}>
      <StatPill
        label={playersStatLabel}
        value={loading ? '…' : String(stats?.players ?? 0)}
        colors={colors}
      />
      <StatPill
        label="Clubs"
        value={loading ? '…' : String(stats?.clubs ?? 0)}
        colors={colors}
      />
      <StatPill
        label="Staff"
        value={
          loading ? '…' : String((stats?.coaches ?? 0) + (stats?.agents ?? 0))
        }
        colors={colors}
      />
      {applicationsCount != null && applicationsCount > 0 ? (
        <StatPill
          label="Candidatures"
          value={String(applicationsCount)}
          colors={colors}
          accent
          onPress={onApplicationsPress}
        />
      ) : null}
    </View>
  </View>
);

const StatPill: React.FC<{
  label: string;
  value: string;
  colors: AppColors;
  accent?: boolean;
  onPress?: () => void;
}> = ({ label, value, colors, accent, onPress }) => {
  const inner = (
    <View
      style={[
        styles.pill,
        accent
          ? { backgroundColor: 'rgba(255,255,255,0.22)' }
          : { backgroundColor: 'rgba(255,255,255,0.1)' },
      ]}
    >
      <Text style={[styles.pillValue, { color: colors.brandInverse }]}>{value}</Text>
      <Text style={[styles.pillLabel, { color: colors.heroMuted }]}>{label}</Text>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
        {inner}
      </TouchableOpacity>
    );
  }
  return inner;
};

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: spacing.lg,
    padding: spacing.lg,
    borderRadius: radius.xl,
    marginBottom: spacing.md,
    borderWidth: 1,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: { flex: 1 },
  title: { fontSize: 20, fontWeight: '900', lineHeight: 26 },
  sub: {
    fontSize: 13,
    lineHeight: 19,
    marginTop: spacing.xs,
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  pill: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minWidth: 72,
  },
  pillValue: { fontSize: 16, fontWeight: '800' },
  pillLabel: { fontSize: 10, fontWeight: '700', marginTop: 2 },
});
