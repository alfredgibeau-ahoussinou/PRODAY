import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { Icon, type IconName } from '../components/ui/Icon';
import { parentalActivityService } from '../services/parentalActivity.service';
import { colors, spacing, radius, shadows } from '../theme/designTokens';

interface ParentalActivityReportScreenProps {
  onBack: () => void;
  childUid: string;
  childName?: string;
  periodLabel?: string;
}

export const ParentalActivityReportScreen: React.FC<ParentalActivityReportScreenProps> = ({
  onBack,
  childUid,
  childName = 'Compte enfant',
  periodLabel = '7 derniers jours',
}) => {
  const [loading, setLoading] = useState(true);
  const [messagesCount, setMessagesCount] = useState(0);
  const [applicationsCount, setApplicationsCount] = useState(0);
  const [eventsCount, setEventsCount] = useState(0);
  const [recent, setRecent] = useState<
    { title: string; meta: string; safe: boolean }[]
  >([]);

  const load = useCallback(async () => {
    setLoading(true);
    const summary = await parentalActivityService.getSummary(childUid);
    setMessagesCount(summary.messagesCount);
    setApplicationsCount(summary.applicationsCount);
    setEventsCount(summary.eventsCount);
    setRecent(summary.recent);
    setLoading(false);
  }, [childUid]);

  useEffect(() => {
    load();
  }, [load]);

  const stats: { icon: IconName; value: string; label: string }[] = [
    { icon: 'chat', value: String(messagesCount), label: 'Conversations' },
    { icon: 'briefcase', value: String(applicationsCount), label: 'Candidatures Mercato' },
    { icon: 'calendar', value: String(eventsCount), label: 'Événements équipe' },
  ];

  const hasActivity = messagesCount + applicationsCount + eventsCount > 0;

  return (
    <View style={styles.root}>
      <ScreenHeader title="Rapport d'activité" onBack={onBack} centered />

      <ScrollView contentContainerStyle={styles.content}>
        {loading ? (
          <ActivityIndicator color={colors.brand} style={styles.loader} />
        ) : (
          <>
            <View style={[styles.statusCard, shadows.card]}>
              <View style={styles.statusIcon}>
                <Icon name="shield" size={28} color={colors.success} />
              </View>
              <Text style={styles.statusTitle}>
                {hasActivity ? 'Activité suivie' : 'Peu d’activité récente'}
              </Text>
              <Text style={styles.statusSub}>
                {hasActivity
                  ? `Résumé pour ${childName} — ${periodLabel}.`
                  : `Aucune interaction récente pour ${childName} sur ${periodLabel}.`}
              </Text>
            </View>

            <Text style={styles.sectionTitle}>Résumé</Text>
            <View style={styles.statsGrid}>
              {stats.map((s) => (
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
            {recent.length === 0 ? (
              <Text style={styles.emptyHint}>
                Les messages, candidatures et convocations apparaîtront ici.
              </Text>
            ) : (
              recent.map((item, i) => (
                <ActivityRow
                  key={`${item.title}-${i}`}
                  title={item.title}
                  meta={item.meta}
                  safe={item.safe}
                />
              ))
            )}

            <View style={[styles.tipCard, shadows.card]}>
              <Icon name="warning" size={20} color={colors.warning} />
              <Text style={styles.tipText}>
                Les contacts non approuvés sont bloqués automatiquement lorsque la
                supervision est activée.
              </Text>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
};

const ActivityRow: React.FC<{
  title: string;
  meta: string;
  safe: boolean;
}> = ({ title, meta, safe }) => (
  <View style={[styles.activityRow, shadows.card]}>
    <View style={[styles.activityDot, safe ? styles.dotSafe : styles.dotWarn]} />
    <View style={styles.activityCopy}>
      <Text style={styles.activityTitle}>{title}</Text>
      <Text style={styles.activityMeta}>{meta}</Text>
    </View>
    {safe ? (
      <View style={styles.safeBadge}>
        <Text style={styles.safeText}>OK</Text>
      </View>
    ) : null}
  </View>
);

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  loader: { marginVertical: spacing.xxl },
  statusCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statusIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.successBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  statusTitle: { fontSize: 18, fontWeight: '800', color: colors.text },
  statusSub: {
    fontSize: 13,
    color: colors.textMuted,
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
    marginBottom: spacing.lg,
  },
  statCard: {
    width: '31%',
    minWidth: 100,
    flexGrow: 1,
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
  statValue: { fontSize: 20, fontWeight: '900', color: colors.text },
  statLabel: {
    fontSize: 10,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
    fontWeight: '600',
  },
  emptyHint: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: spacing.lg,
    lineHeight: 20,
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
    gap: spacing.sm,
  },
  activityDot: { width: 8, height: 8, borderRadius: 4 },
  dotSafe: { backgroundColor: colors.success },
  dotWarn: { backgroundColor: colors.warning },
  activityCopy: { flex: 1 },
  activityTitle: { fontSize: 14, fontWeight: '700', color: colors.text },
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
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginTop: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'flex-start',
  },
  tipText: { flex: 1, fontSize: 13, color: colors.textSecondary, lineHeight: 20 },
});
