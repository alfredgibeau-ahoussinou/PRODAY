import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import type { RecruitmentStats } from '../../services/stats.service';
import { formatCount } from '../../services/stats.service';
import { colors, spacing, radius } from '../../theme/designTokens';

interface DashboardCommunityStripProps {
  stats: RecruitmentStats | null;
  loading: boolean;
  onRecruitment: () => void;
}

export const DashboardCommunityStrip: React.FC<DashboardCommunityStripProps> = ({
  stats,
  loading,
  onRecruitment,
}) => (
  <View style={styles.wrap}>
    <Text style={styles.eyebrow}>ÉCOSYSTÈME PRODAY</Text>
    {loading ? (
      <ActivityIndicator color={colors.accent} style={styles.loader} />
    ) : stats ? (
      <TouchableOpacity style={styles.row} onPress={onRecruitment} activeOpacity={0.9}>
        <Metric value={String(stats.players)} label="Joueurs" />
        <View style={styles.divider} />
        <Metric value={String(stats.clubs)} label="Clubs" />
        <View style={styles.divider} />
        <Metric value={String(stats.recruitment_posts_open)} label="Annonces" />
      </TouchableOpacity>
    ) : null}
    {stats ? (
      <Text style={styles.footer}>
        {formatCount(stats.players, 'joueur actif', 'joueurs actifs')} sur la plateforme
      </Text>
    ) : null}
  </View>
);

const Metric: React.FC<{ value: string; label: string }> = ({ value, label }) => (
  <View style={styles.metric}>
    <Text style={styles.metricValue}>{value}</Text>
    <Text style={styles.metricLabel}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.xl },
  eyebrow: { fontSize: 10, fontWeight: '800', color: colors.accent, letterSpacing: 1, marginBottom: spacing.sm },
  loader: { paddingVertical: spacing.lg },
  row: {
    flexDirection: 'row',
    backgroundColor: colors.ink,
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  metric: { flex: 1, alignItems: 'center' },
  metricValue: { color: colors.brandInverse, fontSize: 24, fontWeight: '900' },
  metricLabel: { color: colors.heroMuted, fontSize: 11, fontWeight: '700', marginTop: 4 },
  divider: { width: 2, backgroundColor: 'rgba(255,255,255,0.15)' },
  footer: {
    textAlign: 'center',
    fontSize: 11,
    color: colors.textMuted,
    marginTop: spacing.sm,
    fontWeight: '600',
  },
});
