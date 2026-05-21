import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { Icon, type IconName } from '../components/ui/Icon';
import { colors, spacing, radius, shadows } from '../theme/designTokens';

const STATS: { icon: IconName; value: string; label: string }[] = [
  { icon: 'chat', value: '24', label: 'Messages échangés' },
  { icon: 'people', value: '18', label: 'Profils consultés' },
  { icon: 'time', value: '2h 15', label: 'Temps passé' },
];

interface ParentalActivityReportScreenProps {
  onBack: () => void;
  childName?: string;
  periodLabel?: string;
}

export const ParentalActivityReportScreen: React.FC<ParentalActivityReportScreenProps> = ({
  onBack,
  childName = 'Compte enfant',
  periodLabel = '7 derniers jours',
}) => (
  <View style={styles.root}>
    <ScreenHeader title="Rapport d'activité" onBack={onBack} centered />

    <ScrollView contentContainerStyle={styles.content}>
      <View style={[styles.statusCard, shadows.card]}>
        <View style={styles.statusIcon}>
          <Icon name="shield" size={28} color={colors.success} />
        </View>
        <Text style={styles.statusTitle}>Tout est sous contrôle</Text>
        <Text style={styles.statusSub}>
          Aucune alerte pour {childName} sur la période : {periodLabel}.
        </Text>
      </View>

      <Text style={styles.sectionTitle}>Résumé</Text>
      <View style={styles.statsGrid}>
        {STATS.map((s) => (
          <View key={s.label} style={[styles.statCard, shadows.card]}>
            <View style={styles.statIcon}>
              <Icon name={s.icon} size={22} color={colors.brand} />
            </View>
            <Text style={styles.statValue}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Dernières activités</Text>
      <ActivityRow
        title="Message avec Thomas Leroy"
        meta="Coach · Hier · 18h32"
        safe
      />
      <ActivityRow
        title="Consultation profil joueur"
        meta="Yanis Diallo · Il y a 2 j"
        safe
      />
      <ActivityRow
        title="Recherche annonces U19"
        meta="Recrutement · Il y a 3 j"
        safe
      />

      <View style={[styles.tipCard, shadows.card]}>
        <Icon name="warning" size={20} color={colors.warning} />
        <Text style={styles.tipText}>
          Les contacts non approuvés sont bloqués automatiquement lorsque la
          supervision est activée.
        </Text>
      </View>
    </ScrollView>
  </View>
);

const ActivityRow: React.FC<{
  title: string;
  meta: string;
  safe: boolean;
}> = ({ title, meta, safe }) => (
  <View style={styles.activityRow}>
    <View style={styles.activityBody}>
      <Text style={styles.activityTitle}>{title}</Text>
      <Text style={styles.activityMeta}>{meta}</Text>
    </View>
    {safe && (
      <View style={styles.safeBadge}>
        <Text style={styles.safeText}>OK</Text>
      </View>
    )}
  </View>
);

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  statusCard: {
    backgroundColor: colors.successBg,
    borderRadius: radius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.success,
  },
  statusIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  statusTitle: { fontSize: 18, fontWeight: '800', color: colors.success },
  statusSub: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  statCard: {
    flex: 1,
    minWidth: '30%' as unknown as number,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  statValue: { fontSize: 20, fontWeight: '800', color: colors.text },
  statLabel: {
    fontSize: 10,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  activityBody: { flex: 1 },
  activityTitle: { fontSize: 14, fontWeight: '600', color: colors.text },
  activityMeta: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  safeBadge: {
    backgroundColor: colors.successBg,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  safeText: { fontSize: 10, fontWeight: '800', color: colors.success },
  tipCard: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: colors.warningBg,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginTop: spacing.lg,
    alignItems: 'flex-start',
  },
  tipText: { flex: 1, fontSize: 13, color: colors.textSecondary, lineHeight: 20 },
});
