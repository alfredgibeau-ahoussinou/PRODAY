import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
import { spacing, radius, shadows } from '../theme/designTokens';
import { useThemedScreen } from '../hooks/useThemedScreen';
import type { AppColors } from '../theme/universeTheme';

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
  const { colors: c, rootStyle } = useThemedScreen();
  const styles = useMemo(() => createStyles(c), [c]);
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
    <View style={[styles.root, rootStyle]}>
      <ScreenHeader title="Rapport d'activité" onBack={onBack} centered />

      <ScrollView contentContainerStyle={styles.content}>
        {loading ? (
          <ActivityIndicator color={c.brand} style={styles.loader} />
        ) : (
          <>
            <View style={[styles.statusCard, shadows.card]}>
              <View style={styles.statusIcon}>
                <Icon name="shield" size={28} color={c.success} />
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
                    <Icon name={s.icon} size={22} color={c.brand} />
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
                  styles={styles}
                  title={item.title}
                  meta={item.meta}
                  safe={item.safe}
                />
              ))
            )}

            <View style={[styles.tipCard, shadows.card]}>
              <Icon name="warning" size={20} color={c.warning} />
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
  styles: ReturnType<typeof createStyles>;
  title: string;
  meta: string;
  safe: boolean;
}> = ({ styles, title, meta, safe }) => (
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

function createStyles(c: AppColors) {
  return StyleSheet.create({
    root: { flex: 1 },
    content: { padding: spacing.lg, paddingBottom: spacing.xxl },
    loader: { marginVertical: spacing.xxl },
    statusCard: {
      backgroundColor: c.surface,
      borderRadius: radius.lg,
      padding: spacing.xl,
      alignItems: 'center',
      marginBottom: spacing.lg,
      borderWidth: 1,
      borderColor: c.border,
    },
    statusIcon: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: c.successBg,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.md,
    },
    statusTitle: { fontSize: 18, fontWeight: '800', color: c.text },
    statusSub: {
      fontSize: 13,
      color: c.textMuted,
      textAlign: 'center',
      marginTop: spacing.sm,
      lineHeight: 20,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: c.text,
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
      backgroundColor: c.surface,
      borderRadius: radius.lg,
      padding: spacing.md,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: c.border,
    },
    statIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: c.brandSoft,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.sm,
    },
    statValue: { fontSize: 20, fontWeight: '900', color: c.text },
    statLabel: {
      fontSize: 10,
      color: c.textMuted,
      textAlign: 'center',
      marginTop: 4,
      fontWeight: '600',
    },
    emptyHint: {
      fontSize: 13,
      color: c.textMuted,
      marginBottom: spacing.lg,
      lineHeight: 20,
    },
    activityRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.surface,
      borderRadius: radius.lg,
      padding: spacing.md,
      marginBottom: spacing.sm,
      borderWidth: 1,
      borderColor: c.border,
      gap: spacing.sm,
    },
    activityDot: { width: 8, height: 8, borderRadius: 4 },
    dotSafe: { backgroundColor: c.success },
    dotWarn: { backgroundColor: c.warning },
    activityCopy: { flex: 1 },
    activityTitle: { fontSize: 14, fontWeight: '700', color: c.text },
    activityMeta: { fontSize: 12, color: c.textMuted, marginTop: 2 },
    safeBadge: {
      backgroundColor: c.successBg,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
    },
    safeText: { fontSize: 10, fontWeight: '800', color: c.success },
    tipCard: {
      flexDirection: 'row',
      gap: spacing.md,
      backgroundColor: c.surface,
      borderRadius: radius.lg,
      padding: spacing.lg,
      marginTop: spacing.lg,
      borderWidth: 1,
      borderColor: c.border,
      alignItems: 'flex-start',
    },
    tipText: { flex: 1, fontSize: 13, color: c.textSecondary, lineHeight: 20 },
  });
}
