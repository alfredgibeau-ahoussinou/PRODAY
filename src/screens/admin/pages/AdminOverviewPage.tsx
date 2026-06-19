import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PressableSpring } from '../../../components/motion';
import { useAdminData } from '../../../context/AdminDataContext';
import { AdminPageScaffold } from '../../../components/admin/AdminPageScaffold';
import { AdminKpiStrip } from '../../../components/admin/AdminKpiStrip';
import { AdminWorkQueue } from '../../../components/admin/AdminWorkQueue';
import { AdminRoleBreakdown } from '../../../components/admin/AdminRoleBreakdown';
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
              },
              {
                key: 'events',
                label: 'Événements',
                value: stats.teamEvents,
                previous: prev?.teamEvents,
                icon: 'calendar',
              },
              {
                key: 'apps',
                label: 'Candidatures',
                value: stats.applications,
                previous: prev?.applications,
                icon: 'document',
              },
              {
                key: 'inbox',
                label: 'Actions inbox',
                value: workQueue.length,
                icon: 'warning',
                alert: workQueue.length > 0,
              },
            ]}
          />

          <View style={styles.healthRow}>
            <HealthPill
              label="Charge modération"
              value={moderationScore}
              level={moderationScore > 20 ? 'high' : moderationScore > 8 ? 'mid' : 'ok'}
              styles={styles}
              colors={c}
            />
            <HealthPill
              label="Vérif. en attente"
              value={stats.pendingVerifications}
              level={stats.pendingVerifications > 0 ? 'high' : 'ok'}
              styles={styles}
              colors={c}
            />
            <HealthPill
              label="Paiements pending"
              value={stats.pendingPayments}
              level={stats.pendingPayments > 0 ? 'mid' : 'ok'}
              styles={styles}
              colors={c}
            />
          </View>

          <View style={styles.sectionHead}>
            <Text style={styles.sectionEyebrowInline}>Priorités immédiates</Text>
            <PressableSpring onPress={() => onNavigate('inbox')} scaleTo={0.97} haptic>
              <Text style={styles.link}>Voir tout ({workQueue.length})</Text>
            </PressableSpring>
          </View>
          <AdminWorkQueue
            items={workQueue}
            compact
            maxItems={5}
            onPressItem={(item) => onNavigate(item.targetTab, item)}
          />

          <Text style={styles.sectionEyebrow}>Accès rapides</Text>
          <View style={styles.grid}>
            <NavTile icon="mail" label="Inbox" hint={`${workQueue.length} action(s)`} onPress={() => onNavigate('inbox')} styles={styles} brand={c.brand} />
            <NavTile icon="people" label="Utilisateurs" hint={`${stats.pendingVerifications} vérif.`} onPress={() => onNavigate('users')} styles={styles} brand={c.brand} />
            <NavTile icon="time" label="Modération" hint={`${moderationPending} file(s)`} onPress={() => onNavigate('moderation')} styles={styles} brand={c.brand} />
            <NavTile icon="briefcase" label="Plateforme" hint="Événements · Mercato" onPress={() => onNavigate('plateforme')} styles={styles} brand={c.brand} />
            <NavTile icon="star-four-points" label="Analytics" hint="Tendances 14j" onPress={() => onNavigate('analytics')} styles={styles} brand={c.brand} />
            <NavTile icon="business" label="Clubs" hint={`${stats.clubs} structures`} onPress={() => onNavigate('clubs')} styles={styles} brand={c.brand} />
            <NavTile icon="settings" label="Système" hint="Ops & preview" onPress={() => onNavigate('system')} styles={styles} brand={c.brand} />
          </View>

          <AdminRoleBreakdown rows={roleBreakdown.slice(0, 6)} total={stats.users} />

          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Synthèse plateforme</Text>
            <Text style={styles.summaryLine}>
              {stats.users} comptes · {stats.players} joueurs · {stats.coaches} coachs · {stats.clubs} clubs
            </Text>
            <Text style={styles.summaryLine}>
              {stats.teamEvents} événements · {stats.friendlyMatches} matchs · {stats.recruitmentPosts} annonces Mercato
            </Text>
            <Text style={styles.summaryLine}>
              {stats.applications} candidatures · {stats.pendingCommunityReels} reels en attente · {stats.reelReports} signalements
            </Text>
          </View>
        </>
      ) : null}
    </AdminPageScaffold>
  );
};

const HealthPill: React.FC<{
  label: string;
  value: number;
  level: 'ok' | 'mid' | 'high';
  styles: ReturnType<typeof createStyles>;
  colors: AppColors;
}> = ({ label, value, level, styles, colors: c }) => {
  const bg =
    level === 'high' ? c.errorBg : level === 'mid' ? c.warningBg : c.successBg;
  const fg = level === 'high' ? c.error : level === 'mid' ? c.warning : c.success;
  return (
    <View style={[styles.healthPill, { backgroundColor: bg, borderColor: fg }]}>
      <Text style={[styles.healthValue, { color: fg }]}>{value}</Text>
      <Text style={styles.healthLabel}>{label}</Text>
    </View>
  );
};

type OverviewStyles = ReturnType<typeof createStyles>;

const NavTile: React.FC<{
  icon: 'mail' | 'people' | 'time' | 'star-four-points' | 'business' | 'settings' | 'briefcase';
  label: string;
  hint: string;
  onPress: () => void;
  brand: string;
  styles: OverviewStyles;
}> = ({ icon, label, hint, onPress, brand, styles }) => (
  <PressableSpring onPress={onPress} scaleTo={0.97} haptic>
    <View style={styles.tile}>
      <Icon name={icon} size={20} color={brand} />
      <Text style={styles.tileLabel}>{label}</Text>
      <Text style={styles.tileHint}>{hint}</Text>
    </View>
  </PressableSpring>
);

function createStyles(c: AppColors) {
  return StyleSheet.create({
    healthRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
    healthPill: {
      flex: 1,
      minWidth: '30%',
      borderRadius: radius.md,
      borderWidth: 1,
      padding: spacing.sm,
      alignItems: 'center',
      gap: 2,
    },
    healthValue: { fontSize: 20, fontWeight: '800' },
    healthLabel: { fontSize: 9, fontWeight: '700', color: c.textMuted, textAlign: 'center' },
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
      letterSpacing: 1.2,
      textTransform: 'uppercase',
      color: c.brand,
    },
    sectionEyebrow: {
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 1.2,
      textTransform: 'uppercase',
      color: c.brand,
      marginBottom: spacing.sm,
      marginTop: spacing.md,
    },
    link: { fontSize: 12, fontWeight: '800', color: c.brand },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
    tile: {
      width: '31%',
      minWidth: 100,
      flexGrow: 1,
      backgroundColor: c.surface,
      borderRadius: radius.lg,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: c.border,
      gap: 4,
      ...shadows.card,
    },
    tileLabel: { fontSize: 12, fontWeight: '800', color: c.text },
    tileHint: { fontSize: 10, color: c.textMuted, fontWeight: '600' },
    summaryCard: {
      padding: spacing.md,
      gap: spacing.xs,
      borderWidth: 1,
      borderColor: c.border,
      marginTop: spacing.md,
      backgroundColor: c.surface,
      borderRadius: radius.lg,
      ...shadows.card,
    },
    summaryTitle: { fontSize: 15, fontWeight: '800', color: c.text, marginBottom: spacing.xs },
    summaryLine: { fontSize: 13, color: c.textSecondary, lineHeight: 20 },
  });
}
