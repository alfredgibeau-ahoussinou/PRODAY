import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { SponsorAnalytics } from '../../models/SponsorOffer';
import { SPONSOR_THEME } from '../../content/sponsorExperience';
import { spacing, radius } from '../../theme/designTokens';

interface SponsorAnalyticsPanelProps {
  analytics: SponsorAnalytics;
}

export const SponsorAnalyticsPanel: React.FC<SponsorAnalyticsPanelProps> = ({ analytics }) => (
  <View style={styles.wrap}>
    <View style={styles.headerRow}>
      <Text style={styles.title}>Performance marque</Text>
      {typeof analytics.engagement_score === 'number' ? (
        <View style={styles.scoreBadge}>
          <Text style={styles.scoreLabel}>Score d'engagement</Text>
          <Text style={styles.scoreValue}>{analytics.engagement_score}/100</Text>
        </View>
      ) : null}
    </View>
    <View style={styles.row}>
      <Metric label="Impressions" value={formatNum(analytics.impressions)} />
      <Metric label="Clics offres" value={formatNum(analytics.offer_clicks)} highlight />
      <Metric label="Contacts" value={String(analytics.leads)} />
    </View>
    <View style={styles.row}>
      <Metric label="Clubs touchés" value={String(analytics.clubs_reached)} />
      <Metric label="Taux de clic" value={`${analytics.ctr_rate ?? (analytics.impressions > 0 ? Math.round((analytics.offer_clicks / analytics.impressions) * 100) : 0)} %`} />
      <Metric label="Conversion" value={`${analytics.conversion_rate} %`} />
    </View>
    {analytics.estimated_roi_eur ? (
      <View style={styles.roiBanner}>
        <Text style={styles.roiLabel}>Retombées estimées :</Text>
        <Text style={styles.roiValue}>+{analytics.estimated_roi_eur.toLocaleString('fr-FR')} €</Text>
      </View>
    ) : null}
  </View>
);

const Metric: React.FC<{ label: string; value: string; highlight?: boolean }> = ({
  label,
  value,
  highlight,
}) => (
  <View style={[styles.metric, highlight && styles.metricHighlight]}>
    <Text style={[styles.metricValue, highlight && styles.metricValueHighlight]}>{value}</Text>
    <Text style={styles.metricLabel}>{label}</Text>
  </View>
);

function formatNum(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace('.0', '')}k`;
  return String(n);
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: SPONSOR_THEME.surface,
    borderRadius: radius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: SPONSOR_THEME.borderSubtle,
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 11,
    fontWeight: '800',
    color: SPONSOR_THEME.sectionLabel,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  scoreBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: radius.pill,
    backgroundColor: SPONSOR_THEME.primarySoft,
    borderWidth: 1,
    borderColor: SPONSOR_THEME.primary + '55',
  },
  scoreLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: SPONSOR_THEME.primary,
    textTransform: 'uppercase',
  },
  scoreValue: {
    fontSize: 11,
    fontWeight: '900',
    color: SPONSOR_THEME.primary,
  },
  roiBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    backgroundColor: 'rgba(234, 179, 8, 0.08)',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(234, 179, 8, 0.25)',
    marginTop: 2,
  },
  roiLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: SPONSOR_THEME.textMuted,
  },
  roiValue: {
    fontSize: 12,
    fontWeight: '900',
    color: SPONSOR_THEME.primary,
  },
  row: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  metric: {
    flex: 1,
    backgroundColor: SPONSOR_THEME.surfaceMuted,
    borderRadius: radius.md,
    padding: spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: SPONSOR_THEME.borderSubtle,
  },
  metricHighlight: {
    borderColor: SPONSOR_THEME.primary,
    backgroundColor: SPONSOR_THEME.primarySoft,
  },
  metricValue: { fontSize: 16, fontWeight: '900', color: SPONSOR_THEME.text },
  metricValueHighlight: { color: SPONSOR_THEME.primary },
  metricLabel: {
    fontSize: 8,
    fontWeight: '700',
    color: SPONSOR_THEME.textMuted,
    marginTop: 2,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
});
