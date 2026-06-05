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
    <Text style={styles.title}>Performance marque</Text>
    <View style={styles.row}>
      <Metric label="Impressions" value={formatNum(analytics.impressions)} />
      <Metric label="Clics offres" value={formatNum(analytics.offer_clicks)} highlight />
      <Metric label="Contacts" value={String(analytics.leads)} />
    </View>
    <View style={styles.row}>
      <Metric label="Clubs touchés" value={String(analytics.clubs_reached)} />
      <Metric label="Vues profil" value={formatNum(analytics.profile_views)} />
      <Metric label="Conversion" value={`${analytics.conversion_rate} %`} />
    </View>
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
    marginBottom: spacing.sm,
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
