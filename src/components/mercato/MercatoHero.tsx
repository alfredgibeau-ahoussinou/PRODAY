import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { RecruitmentStats } from '../../services/stats.service';
import { Icon } from '../ui/Icon';
import { colors, spacing, radius, shadows, surfaces } from '../../theme/designTokens';

interface MercatoHeroProps {
  stats: RecruitmentStats | null;
  loading?: boolean;
  applicationsCount?: number;
}

export const MercatoHero: React.FC<MercatoHeroProps> = ({
  stats,
  loading,
  applicationsCount,
}) => (
  <View style={styles.wrap}>
    <View style={styles.iconBox}>
      <Icon name="search" size={24} color={colors.accent} />
    </View>
    <Text style={styles.title}>Mercato ProDay</Text>
    <Text style={styles.sub}>
      Annonces ciblées, profils vérifiés et candidatures en un tap — votre saison
      commence ici.
    </Text>
  <View style={styles.statsRow}>
      <StatPill
        label="Joueurs"
        value={loading ? '…' : String(stats?.players ?? 0)}
      />
      <StatPill
        label="Clubs"
        value={loading ? '…' : String(stats?.clubs ?? 0)}
      />
      <StatPill
        label="Staff"
        value={
          loading ? '…' : String((stats?.coaches ?? 0) + (stats?.agents ?? 0))
        }
      />
      {applicationsCount != null && applicationsCount > 0 ? (
        <StatPill label="Candidatures" value={String(applicationsCount)} accent />
      ) : null}
    </View>
  </View>
);

const StatPill: React.FC<{ label: string; value: string; accent?: boolean }> = ({
  label,
  value,
  accent,
}) => (
  <View style={[styles.pill, accent && styles.pillAccent]}>
    <Text style={[styles.pillValue, accent && styles.pillValueAccent]}>{value}</Text>
    <Text style={styles.pillLabel}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  wrap: {
    ...surfaces.card,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  title: { fontSize: 20, fontWeight: '800', color: colors.text },
  sub: {
    fontSize: 13,
    color: colors.textSecondary,
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
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minWidth: 72,
  },
  pillAccent: {
    backgroundColor: colors.accentSoft,
  },
  pillValue: { fontSize: 16, fontWeight: '800', color: colors.text },
  pillValueAccent: { color: colors.accent },
  pillLabel: { fontSize: 10, fontWeight: '700', color: colors.textMuted, marginTop: 2 },
});
