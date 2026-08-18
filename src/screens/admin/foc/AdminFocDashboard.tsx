import React, { useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAdminData } from '../../../context/AdminDataContext';
import { useAuth } from '../../../context/AuthContext';
import {
  AdminFocKpiCard,
  AdminFocActivityFeed,
  AdminFocCard,
} from '../../../components/admin/foc';
import type { AdminFocActivityItem } from '../../../components/admin/foc';
import { PressableSpring } from '../../../components/motion';
import { Icon } from '../../../components/ui/Icon';
import { buildAdminChrome, adminType } from '../../../theme/adminTheme';
import { spacing } from '../../../theme/designTokens';
import type { AdminSectionId } from '../../../navigation/adminNavConfig';
import { ADMIN_WORK_KIND_LABELS } from '../../../navigation/adminNavConfig';
import type { AdminFocPreferences } from '../../../services/adminPreferences.service';
import type { AdminDashboardBlockId } from '../../../navigation/adminNavConfig';
import { userNeedsAdminVerificationReview } from '../../../utils/adminUserVerification';

interface AdminFocDashboardProps {
  onNavigateSection: (section: AdminSectionId, tab?: string) => void;
  prefs: AdminFocPreferences;
}

function formatTimeAgo(date: Date): string {
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 60) return "à l'instant";
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)} h`;
  return `il y a ${Math.floor(diff / 86400)} j`;
}

export const AdminFocDashboard: React.FC<AdminFocDashboardProps> = ({
  onNavigateSection,
  prefs,
}) => {
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();
  const chrome = useMemo(
    () =>
      buildAdminChrome({
        primaryColor: prefs.primaryColor,
        secondaryColor: prefs.secondaryColor,
        pitchAccent: prefs.pitchAccent,
        radius: prefs.cornerRadius,
      }),
    [prefs],
  );
  const {
    refreshing,
    refresh,
    users,
    clubs,
    workQueue,
    roleBreakdown,
    stats,
    payments,
  } = useAdminData();

  const firstName = profile?.display_name?.split(' ')[0] ?? '';

  const kpiUsers = users.length;
  const kpiClubs = clubs.length;
  const kpiCoachs = roleBreakdown.find((r) => r.role === 'coach')?.count ?? 0;
  const kpiPlayers = roleBreakdown.find((r) => r.role === 'player')?.count ?? 0;
  const kpiSuspended = users.filter((u) => u.is_active === false).length;
  const kpiPendingVerify = users.filter(userNeedsAdminVerificationReview).length;
  const kpiPendingPayments = payments.filter((p) => p.status === 'pending').length;

  const activityItems = useMemo((): AdminFocActivityItem[] => {
    return workQueue.slice(0, 6).map((w) => ({
      id: w.id,
      title: w.title,
      subtitle: w.subtitle,
      timeLabel: w.createdAt ? formatTimeAgo(w.createdAt) : '',
      kind: w.kind,
    }));
  }, [workQueue]);

  const blockRenderers: Record<AdminDashboardBlockId, () => React.ReactNode> = {
    work_today: () => (
      <AdminFocCard
        title="À traiter aujourd'hui"
        action={
          workQueue.length > 0
            ? { label: 'Tout voir', onPress: () => onNavigateSection('signalements', 'decisions') }
            : undefined
        }
      >
        {workQueue.length === 0 ? (
          <Text style={[styles.emptyLine, { color: chrome.textMuted }]}>
            Aucune action en attente — plateforme à jour.
          </Text>
        ) : (
          <View style={styles.workList}>
            {workQueue.slice(0, 5).map((item) => (
              <PressableSpring
                key={item.id}
                onPress={() => onNavigateSection(item.targetSection, item.targetTab)}
                style={[styles.workRow, { borderColor: chrome.shellBorder }]}
                scaleTo={0.98}
                haptic
              >
                <Text style={[styles.workKind, { color: chrome.accent }]}>
                  {ADMIN_WORK_KIND_LABELS[item.kind] ?? item.kind}
                </Text>
                <View style={styles.workCopy}>
                  <Text style={[styles.workTitle, { color: chrome.text }]} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={[styles.workSub, { color: chrome.textMuted }]} numberOfLines={1}>
                    {item.subtitle}
                  </Text>
                </View>
                <Icon name="chevron-forward" size={14} color={chrome.textMuted} />
              </PressableSpring>
            ))}
          </View>
        )}
      </AdminFocCard>
    ),
    users: () => (
      <AdminFocCard
        title="Utilisateurs"
        action={{ label: 'Gérer', onPress: () => onNavigateSection('utilisateurs') }}
      >
        <View style={styles.kpiGrid}>
          <View style={styles.kpiCell}>
            <AdminFocKpiCard
              label="Comptes"
              value={kpiUsers}
              icon="people"
              onPress={() => onNavigateSection('utilisateurs')}
            />
          </View>
          <View style={styles.kpiCell}>
            <AdminFocKpiCard
              label="Joueurs"
              value={kpiPlayers}
              icon="football"
              onPress={() => onNavigateSection('joueurs')}
            />
          </View>
          <View style={styles.kpiCell}>
            <AdminFocKpiCard
              label="Coachs"
              value={kpiCoachs}
              icon="person"
              onPress={() => onNavigateSection('coachs')}
            />
          </View>
          <View style={styles.kpiCell}>
            <AdminFocKpiCard
              label="À valider"
              value={kpiPendingVerify}
              icon="alert-circle"
              hot={kpiPendingVerify > 0}
              onPress={() => onNavigateSection('utilisateurs', 'decisions')}
            />
          </View>
        </View>
        {kpiSuspended > 0 ? (
          <Text style={[styles.hint, { color: chrome.textMuted }]}>
            {kpiSuspended} compte{kpiSuspended > 1 ? 's' : ''} suspendu{kpiSuspended > 1 ? 's' : ''}
          </Text>
        ) : null}
      </AdminFocCard>
    ),
    clubs: () => (
      <AdminFocCard
        title="Clubs & équipes"
        action={{ label: 'Clubs', onPress: () => onNavigateSection('clubs') }}
      >
        <View style={styles.kpiGrid}>
          <View style={styles.kpiCell}>
            <AdminFocKpiCard
              label="Clubs actifs"
              value={kpiClubs}
              icon="business"
              onPress={() => onNavigateSection('clubs')}
            />
          </View>
          <View style={styles.kpiCell}>
            <AdminFocKpiCard
              label="Adhésions en attente"
              value={workQueue.filter((w) => w.kind === 'membership').length}
              icon="people"
              hot={workQueue.some((w) => w.kind === 'membership')}
              onPress={() => onNavigateSection('utilisateurs', 'decisions')}
            />
          </View>
        </View>
      </AdminFocCard>
    ),
    activity: () =>
      activityItems.length > 0 ? (
        <AdminFocCard title="Activité">
          <AdminFocActivityFeed
            items={activityItems}
            onPressItem={(id) => {
              const item = workQueue.find((w) => w.id === id);
              if (item) onNavigateSection(item.targetSection, item.targetTab);
            }}
          />
        </AdminFocCard>
      ) : null,
    business: () => (
      <AdminFocCard
        title="Business"
        action={{ label: 'Finances', onPress: () => onNavigateSection('abonnements') }}
      >
        <View style={styles.kpiGrid}>
          <View style={styles.kpiCell}>
            <AdminFocKpiCard
              label="Paiements en attente"
              value={kpiPendingPayments}
              icon="bag"
              hot={kpiPendingPayments > 0}
              onPress={() => onNavigateSection('abonnements', 'paiements')}
            />
          </View>
          <View style={styles.kpiCell}>
            <AdminFocKpiCard
              label="Abonnements Pro"
              value={stats?.applications ?? 0}
              icon="star"
              onPress={() => onNavigateSection('abonnements', 'abonnements')}
            />
          </View>
        </View>
      </AdminFocCard>
    ),
  };

  const onRefresh = useCallback(() => refresh(), [refresh]);
  const styles = useMemo(() => createStyles(chrome), [chrome]);

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: chrome.band }]}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={chrome.accent} />
      }
    >
      <View style={[styles.greetingBlock, { borderColor: chrome.shellBorder }]}>
        <LinearGradient
          colors={[chrome.soft, 'rgba(255,255,255,0.4)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.greetingGlow}
          pointerEvents="none"
        />
        <Text style={[styles.greetingKicker, { color: chrome.accent }]}>
          Centre de contrôle · Aujourd'hui
        </Text>
        <Text style={[styles.greeting, { color: chrome.text }]}>
          {firstName ? `Bonjour ${firstName}` : 'Bonjour'}
        </Text>
        <Text style={[styles.greetingSub, { color: chrome.textMuted }]}>
          {kpiUsers} comptes · {kpiClubs} clubs · {workQueue.length} action
          {workQueue.length !== 1 ? 's' : ''} à traiter
        </Text>
      </View>

      {prefs.dashboardOrder.map((blockId) => {
        const node = blockRenderers[blockId]?.();
        return node ? <React.Fragment key={blockId}>{node}</React.Fragment> : null;
      })}
    </ScrollView>
  );
};

function createStyles(chrome: ReturnType<typeof buildAdminChrome>) {
  return StyleSheet.create({
    root: { flex: 1 },
    content: { padding: spacing.md, gap: spacing.md },
    greetingBlock: {
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.md,
      gap: 4,
      borderRadius: chrome.radiusLg,
      overflow: 'hidden',
      backgroundColor: chrome.shell,
      borderWidth: StyleSheet.hairlineWidth,
    },
    greetingGlow: { ...StyleSheet.absoluteFillObject, opacity: 0.9 },
    greetingKicker: {
      fontFamily: adminType.bodyExtra,
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 1.3,
      textTransform: 'uppercase',
    },
    greeting: {
      fontFamily: adminType.display,
      fontSize: 28,
      fontWeight: '800',
      letterSpacing: -0.7,
    },
    greetingSub: {
      fontFamily: adminType.body,
      fontSize: 14,
      lineHeight: 20,
      marginTop: 2,
    },
    kpiGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    kpiCell: { width: '47%', flexGrow: 1 },
    workList: { gap: spacing.sm },
    workRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      padding: spacing.sm,
      borderRadius: chrome.radius,
      borderWidth: StyleSheet.hairlineWidth,
      backgroundColor: chrome.shellElevated,
    },
    workKind: {
      fontSize: 9,
      fontWeight: '800',
      letterSpacing: 0.5,
      textTransform: 'uppercase',
      width: 72,
    },
    workCopy: { flex: 1, gap: 2 },
    workTitle: { fontSize: 13, fontWeight: '700' },
    workSub: { fontSize: 11 },
    emptyLine: { fontSize: 13, lineHeight: 19 },
    hint: { marginTop: spacing.sm, fontSize: 12 },
  });
}
