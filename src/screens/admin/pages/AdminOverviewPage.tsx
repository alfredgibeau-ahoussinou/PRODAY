import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PressableSpring } from '../../../components/motion';
import { useAdminData } from '../../../context/AdminDataContext';
import { AdminPageScaffold } from '../../../components/admin/AdminPageScaffold';
import { AdminCommandHero } from '../../../components/admin/AdminCommandHero';
import { AdminKpiStrip } from '../../../components/admin/AdminKpiStrip';
import { AdminWorkQueue } from '../../../components/admin/AdminWorkQueue';
import { AdminRoleBreakdown } from '../../../components/admin/AdminRoleBreakdown';
import { AdminPlatformBrief } from '../../../components/admin/AdminPlatformBrief';
import { AdminEmptyState } from '../../../components/admin/AdminEmptyState';
import { Icon } from '../../../components/ui/Icon';
import { useAdminStyles } from '../../../components/admin/adminStyles';
import { spacing, radius, shadows } from '../../../theme/designTokens';
import type { AdminMainTabId } from '../../../navigation/adminTabConfig';
import type { AdminWorkItem } from '../../../utils/adminInsights';
import type { AppColors } from '../../../theme/universeTheme';

interface AdminOverviewPageProps {
  onNavigate: (tab: AdminMainTabId, item?: AdminWorkItem) => void;
}

export const AdminOverviewPage: React.FC<AdminOverviewPageProps> = ({ onNavigate }) => {
  const { loading, stats, dailySnapshots, workQueue, roleBreakdown, moderationScore } =
    useAdminData();
  const { colors: c } = useAdminStyles();
  const styles = useMemo(() => createStyles(c), [c]);

  const prev = dailySnapshots[1];
  const moderationPending =
    (stats?.pendingCommunityReels ?? 0) + (stats?.reelReports ?? 0);

  return (
    <AdminPageScaffold loading={loading}>
      <AdminCommandHero onOpenInbox={() => onNavigate('inbox')} />

      {stats ? (
        <>
          <AdminKpiStrip
            items={[
              {
                key: 'users',
                label: 'Utilisateurs',
                value: stats.users,
                previous: prev?.users,
                icon: 'people',
                onPress: () => onNavigate('users'),
              },
              {
                key: 'events',
                label: 'Événements',
                value: stats.teamEvents,
                previous: prev?.teamEvents,
                icon: 'calendar',
                onPress: () => onNavigate('plateforme', {
                  id: 'kpi-events',
                  kind: 'post',
                  priority: 'low',
                  title: 'Événements',
                  subtitle: '',
                  targetTab: 'plateforme',
                  contentSegment: 'events',
                }),
              },
              {
                key: 'apps',
                label: 'Candidatures',
                value: stats.applications,
                previous: prev?.applications,
                icon: 'document',
                onPress: () => onNavigate('plateforme', {
                  id: 'kpi-apps',
                  kind: 'application',
                  priority: 'low',
                  title: 'Candidatures',
                  subtitle: '',
                  targetTab: 'plateforme',
                  contentSegment: 'applications',
                }),
              },
              {
                key: 'inbox',
                label: 'Actions inbox',
                value: workQueue.length,
                icon: 'warning',
                alert: workQueue.length > 0,
                onPress: () => onNavigate('inbox'),
              },
            ]}
          />

          <Text style={styles.sectionEyebrow}>Santé</Text>
          <View style={styles.healthRow}>
            <HealthPill
              label="Modération"
              value={moderationScore}
              level={moderationScore > 20 ? 'high' : moderationScore > 8 ? 'mid' : 'ok'}
              styles={styles}
              colors={c}
              onPress={() => onNavigate('moderation')}
            />
            <HealthPill
              label="Vérifications"
              value={stats.pendingVerifications}
              level={stats.pendingVerifications > 0 ? 'high' : 'ok'}
              styles={styles}
              colors={c}
              onPress={() => onNavigate('users')}
            />
            <HealthPill
              label="Paiements"
              value={stats.pendingPayments}
              level={stats.pendingPayments > 0 ? 'mid' : 'ok'}
              styles={styles}
              colors={c}
              onPress={() => onNavigate('plateforme')}
            />
          </View>

          <View style={styles.sectionHead}>
            <Text style={styles.sectionEyebrowInline}>Priorités</Text>
            <PressableSpring onPress={() => onNavigate('inbox')} scaleTo={0.97} haptic>
              <Text style={styles.link}>Tout ({workQueue.length})</Text>
            </PressableSpring>
          </View>
          <AdminWorkQueue
            items={workQueue}
            compact
            maxItems={5}
            onPressItem={(item) => onNavigate(item.targetTab, item)}
          />

          <Text style={styles.sectionEyebrow}>Raccourcis</Text>
          <View style={styles.missionGrid}>
            {(
              [
                { icon: 'mail' as const, label: 'Inbox', hint: `${workQueue.length}`, tab: 'inbox' as const, alert: workQueue.length > 0 },
                { icon: 'people' as const, label: 'Users', hint: `${stats.pendingVerifications} vérif.`, tab: 'users' as const, alert: stats.pendingVerifications > 0 },
                { icon: 'time' as const, label: 'Modération', hint: `${moderationPending}`, tab: 'moderation' as const, alert: moderationPending > 0 },
                { icon: 'briefcase' as const, label: 'Plateforme', hint: 'Ops', tab: 'plateforme' as const },
                { icon: 'star-four-points' as const, label: 'Analytics', hint: '14 j', tab: 'analytics' as const },
                { icon: 'business' as const, label: 'Clubs', hint: `${stats.clubs}`, tab: 'clubs' as const },
                { icon: 'settings' as const, label: 'Système', hint: 'Config', tab: 'system' as const },
                { icon: 'star-four-points' as const, label: 'Beta', hint: 'Waitlist', tab: 'beta' as const },
              ] as const
            ).map((m) => (
              <PressableSpring
                key={m.label}
                onPress={() => onNavigate(m.tab)}
                scaleTo={0.96}
                haptic
                style={styles.missionCell}
              >
                <View style={[styles.tile, 'alert' in m && m.alert ? styles.tileAlert : null]}>
                  <Icon name={m.icon} size={18} color={c.brand} />
                  <Text style={styles.tileLabel}>{m.label}</Text>
                  <Text style={styles.tileHint}>{m.hint}</Text>
                </View>
              </PressableSpring>
            ))}
          </View>

          <AdminRoleBreakdown rows={roleBreakdown.slice(0, 6)} total={stats.users} />
          <AdminPlatformBrief compact />

          <PressableSpring
            onPress={() => onNavigate('analytics')}
            style={styles.summaryCard}
            scaleTo={0.98}
            haptic
          >
            <View style={styles.summaryHead}>
              <Text style={styles.summaryTitle}>Synthèse</Text>
              <Icon name="chevron-forward" size={16} color={c.brand} />
            </View>
            <Text style={styles.summaryLine}>
              {stats.users} comptes · {stats.players} joueurs · {stats.coaches} coachs · {stats.clubs} clubs
            </Text>
            <Text style={styles.summaryLine}>
              {stats.teamEvents} events · {stats.recruitmentPosts} annonces · {stats.applications} candidatures
            </Text>
          </PressableSpring>
        </>
      ) : (
        <AdminEmptyState
          icon="warning"
          title="Données indisponibles"
          subtitle="Impossible de charger les stats. Tirez pour rafraîchir."
        />
      )}
    </AdminPageScaffold>
  );
};

const HealthPill: React.FC<{
  label: string;
  value: number;
  level: 'ok' | 'mid' | 'high';
  styles: ReturnType<typeof createStyles>;
  colors: AppColors;
  onPress: () => void;
}> = ({ label, value, level, styles, colors: c, onPress }) => {
  const bg =
    level === 'high' ? c.errorBg : level === 'mid' ? c.warningBg : c.successBg;
  const fg = level === 'high' ? c.error : level === 'mid' ? c.warning : c.success;
  return (
    <PressableSpring onPress={onPress} scaleTo={0.96} haptic style={{ flex: 1, minWidth: '30%' }}>
      <View style={[styles.healthPill, { backgroundColor: bg, borderColor: fg }]}>
        <Text style={[styles.healthValue, { color: fg }]}>{value}</Text>
        <Text style={styles.healthLabel}>{label}</Text>
      </View>
    </PressableSpring>
  );
};

function createStyles(c: AppColors) {
  return StyleSheet.create({
    healthRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    healthPill: {
      borderRadius: radius.md,
      borderWidth: 1,
      padding: spacing.sm + 2,
      alignItems: 'center',
      gap: 2,
    },
    healthValue: { fontSize: 20, fontWeight: '800' },
    healthLabel: { fontSize: 10, fontWeight: '700', color: c.textMuted, textAlign: 'center' },
    sectionHead: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.sm,
      marginTop: spacing.xs,
    },
    sectionEyebrowInline: {
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 1,
      textTransform: 'uppercase',
      color: c.textMuted,
    },
    sectionEyebrow: {
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 1,
      textTransform: 'uppercase',
      color: c.textMuted,
      marginBottom: spacing.sm,
      marginTop: spacing.sm,
    },
    link: { fontSize: 12, fontWeight: '800', color: c.brand },
    missionGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
      marginBottom: spacing.md,
    },
    missionCell: { width: '47%', flexGrow: 1 },
    tile: {
      backgroundColor: c.surface,
      borderRadius: radius.lg,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: c.border,
      gap: 4,
      minHeight: 96,
      ...shadows.card,
    },
    tileAlert: {
      borderColor: c.brand,
    },
    tileLabel: { fontSize: 14, fontWeight: '800', color: c.text },
    tileHint: { fontSize: 11, color: c.textMuted, fontWeight: '600' },
    summaryCard: {
      padding: spacing.md,
      gap: spacing.xs,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
      borderRadius: radius.lg,
      ...shadows.card,
    },
    summaryHead: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.xs,
    },
    summaryTitle: { fontSize: 15, fontWeight: '800', color: c.text },
    summaryLine: { fontSize: 13, color: c.textSecondary, lineHeight: 20 },
  });
}
