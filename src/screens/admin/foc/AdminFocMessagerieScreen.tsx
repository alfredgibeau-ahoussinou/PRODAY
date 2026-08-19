import React, { useMemo, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { AdminActionRow } from '../../../components/admin/AdminButton';
import { AdminFocPageHeader } from '../../../components/admin/foc/AdminFocTabs';
import { useAdminData } from '../../../context/AdminDataContext';
import { Icon } from '../../../components/ui/Icon';
import { adminChrome, adminType } from '../../../theme/adminTheme';
import { spacing } from '../../../theme/designTokens';
import {
  canAdminWorkInlineAction,
  confirmAdminWorkApprove,
  confirmAdminWorkReject,
  runAdminWorkApprove,
  runAdminWorkReject,
} from '../../../utils/adminWorkQueueActions';
import type { AdminWorkItem } from '../../../utils/adminInsights';

/**
 * Modération uniquement — pas de lecture privée des conversations.
 */
export function AdminFocMessagerieScreen() {
  const { workQueue, reelReports, refresh, refreshing } = useAdminData();
  const [busyId, setBusyId] = useState<string | null>(null);
  const styles = useMemo(() => createStyles(), []);

  const items = useMemo(
    () => workQueue.filter((w) => w.kind === 'report' || w.kind === 'reel'),
    [workQueue],
  );

  const run = (item: AdminWorkItem, action: 'approve' | 'reject') => {
    const fn = action === 'approve' ? runAdminWorkApprove : runAdminWorkReject;
    const confirm = action === 'approve' ? confirmAdminWorkApprove : confirmAdminWorkReject;
    confirm(item, async () => {
      setBusyId(`${item.id}:${action}`);
      try {
        await fn(item, refresh);
      } finally {
        setBusyId(null);
      }
    });
  };

  return (
    <View style={styles.root}>
      <AdminFocPageHeader
        title="Messagerie"
        subtitle="Signalements et publications à modérer. Les conversations privées ne sont pas consultables ici."
      />
      <View style={styles.banner}>
        <Icon name="lock" size={16} color={adminChrome.accent} />
        <Text style={styles.bannerText}>
          {reelReports.length} signalement{reelReports.length > 1 ? 's' : ''} contenu · lecture
          privée des fils interdite.
        </Text>
      </View>
      <FlatList
        data={items}
        keyExtractor={(i) => i.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={adminChrome.accent} />
        }
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Text style={styles.kind}>{item.kind === 'report' ? 'Signalement' : 'Publication'}</Text>
            <Text style={styles.title}>{item.title}</Text>
            {item.subtitle ? <Text style={styles.sub}>{item.subtitle}</Text> : null}
            <AdminActionRow
              onApprove={
                canAdminWorkInlineAction(item, 'approve') ? () => run(item, 'approve') : undefined
              }
              onReject={
                canAdminWorkInlineAction(item, 'reject') ? () => run(item, 'reject') : undefined
              }
              approveLoading={busyId === `${item.id}:approve`}
              rejectLoading={busyId === `${item.id}:reject`}
            />
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Icon name="checkmark-circle" size={32} color={adminChrome.pitch} />
            <Text style={styles.emptyTitle}>Rien à modérer</Text>
            <Text style={styles.emptySub}>Aucun signalement de contenu en attente.</Text>
          </View>
        }
        contentContainerStyle={items.length === 0 ? styles.emptyWrap : styles.list}
      />
    </View>
  );
}

function createStyles() {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: adminChrome.band },
    banner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginHorizontal: spacing.md,
      marginBottom: spacing.sm,
      padding: spacing.md,
      backgroundColor: adminChrome.soft,
      borderRadius: adminChrome.radius,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: 'rgba(0, 108, 252, 0.2)',
    },
    bannerText: {
      flex: 1,
      fontFamily: adminType.body,
      fontSize: 13,
      lineHeight: 18,
      color: adminChrome.textSecondary,
    },
    list: { padding: spacing.md, paddingBottom: 80, gap: spacing.sm },
    emptyWrap: { flex: 1, justifyContent: 'center', padding: spacing.xl },
    empty: { alignItems: 'center', gap: spacing.sm },
    emptyTitle: {
      fontFamily: adminType.bodyExtra,
      fontSize: 16,
      fontWeight: '800',
      color: adminChrome.text,
    },
    emptySub: { fontFamily: adminType.body, fontSize: 13, color: adminChrome.textMuted, textAlign: 'center' },
    row: {
      backgroundColor: adminChrome.shell,
      borderRadius: adminChrome.radius,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: adminChrome.shellBorder,
      padding: spacing.md,
      gap: 4,
    },
    kind: {
      fontFamily: adminType.bodyExtra,
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 1,
      textTransform: 'uppercase',
      color: adminChrome.accent,
    },
    title: {
      fontFamily: adminType.bodyBold,
      fontSize: 14,
      fontWeight: '700',
      color: adminChrome.text,
    },
    sub: { fontFamily: adminType.body, fontSize: 12, color: adminChrome.textMuted },
  });
}
