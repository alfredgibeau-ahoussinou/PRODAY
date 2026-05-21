import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { useSponsorsData } from '../hooks/useAppData';
import { colors, spacing, radius } from '../theme/designTokens';

interface SponsorsScreenProps {
  onBack?: () => void;
}

export const SponsorsScreen: React.FC<SponsorsScreenProps> = ({ onBack }) => {
  const { offers, goals, loading } = useSponsorsData();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {onBack ? (
        <ScreenHeader title="Sponsors" subtitle="Partenaires locaux & financement" onBack={onBack} />
      ) : (
        <Text style={styles.title}>Sponsors</Text>
      )}

      <Text style={styles.section}>Offres partenaires</Text>
      {loading ? (
        <ActivityIndicator color={colors.brand} />
      ) : offers.length === 0 ? (
        <Text style={styles.hint}>Aucune offre active — exécutez le seed Firestore.</Text>
      ) : (
        offers.map((o) => (
          <View key={o.id} style={styles.offer}>
            <Text style={styles.offerTitle}>{o.company_name}</Text>
            <Text style={styles.offerDesc}>{o.description}</Text>
            {o.value ? <Text style={styles.offerValue}>{o.value}</Text> : null}
          </View>
        ))
      )}

      <Text style={[styles.section, styles.mt]}>Financement club</Text>
      {loading ? null : goals.length === 0 ? (
        <Text style={styles.hint}>Aucun objectif de financement pour le moment.</Text>
      ) : (
        goals.map((g) => {
          const pct =
            g.target_amount_eur > 0
              ? Math.min(100, Math.round((g.raised_amount_eur / g.target_amount_eur) * 100))
              : 0;
          return (
            <View key={g.id} style={styles.progressCard}>
              <Text style={styles.progressTitle}>{g.title}</Text>
              <View style={styles.barBg}>
                <View style={[styles.barFill, { width: `${pct}%` }]} />
              </View>
              <Text style={styles.progressMeta}>
                {g.raised_amount_eur} € / {g.target_amount_eur} € — {pct} %
              </Text>
            </View>
          );
        })
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  title: { fontSize: 24, fontWeight: '800', color: colors.text },
  section: {
    color: colors.textSecondary,
    fontSize: 14,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    fontWeight: '600',
  },
  mt: { marginTop: spacing.xl },
  hint: { color: colors.textMuted, fontSize: 13 },
  offer: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  offerTitle: { color: colors.text, fontWeight: '700', fontSize: 16 },
  offerDesc: { color: colors.textSecondary, marginTop: 6, fontSize: 13 },
  offerValue: { color: colors.brand, marginTop: 8, fontSize: 12, fontWeight: '600' },
  progressCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  progressTitle: { color: colors.text, fontWeight: '600' },
  barBg: {
    height: 8,
    backgroundColor: colors.surfaceMuted,
    borderRadius: 4,
    marginTop: spacing.md,
    overflow: 'hidden',
  },
  barFill: { height: '100%', backgroundColor: colors.success, borderRadius: 4 },
  progressMeta: { color: colors.textMuted, fontSize: 12, marginTop: spacing.sm },
});
