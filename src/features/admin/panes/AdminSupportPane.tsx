import React, { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useAdminData } from '../data/AdminDataContext';
import {
  AdminBadge,
  AdminButton,
  AdminCard,
  AdminEmptyState,
  AdminLoading,
  AdminText,
} from '../ui/adminUi';
import { ADMIN_TOKENS } from '../theme/adminTokens';
import { adminSpace } from '../theme/adminDesignSystem';
import type { AdminNavSectionId } from '../navigation/adminNavConfig';
import {
  adminWorkItemNeedsOpenToTreat,
  canAdminWorkInlineAction,
  executeAdminWorkApprove,
  executeAdminWorkReject,
} from '../../../utils/adminWorkQueueActions';
import { confirmAdminAction } from '../utils/confirmAdminAction';
import type { AdminWorkItem } from '../../../utils/adminInsights';

type Props = { onNavigate: (section: AdminNavSectionId, focusId?: string) => void };

export function AdminSupportPane({ onNavigate }: Props) {
  const data = useAdminData();
  const t = ADMIN_TOKENS;
  const [busyId, setBusyId] = useState<string | null>(null);

  const tickets = useMemo(
    () =>
      data.workQueue.filter((w) =>
        [
          'reel',
          'report',
          'application',
          'verification',
          'membership',
          'club_quote',
          'quote',
          'subscription_request',
          'payment',
        ].includes(w.kind),
      ),
    [data.workQueue],
  );

  if (data.loading) return <AdminLoading />;

  const act = (item: AdminWorkItem, action: 'approve' | 'reject') => {
    if (adminWorkItemNeedsOpenToTreat(item)) {
      onNavigate(item.targetSection, item.entityId);
      return;
    }
    confirmAdminAction(
      action === 'approve' ? 'Approuver ?' : 'Refuser ?',
      item.title,
      async () => {
        setBusyId(item.id);
        try {
          if (action === 'approve') await executeAdminWorkApprove(item);
          else await executeAdminWorkReject(item);
          await data.refresh();
        } catch (e) {
          Alert.alert('Erreur', e instanceof Error ? e.message : 'Échec');
        } finally {
          setBusyId(null);
        }
      },
      action === 'reject',
    );
  };

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content}>
      <AdminText variant="h1">Support</AdminText>
      <AdminText variant="caption" color={t.muted}>
        File actionnable — approve / reject branchés sur les services réels
      </AdminText>
      <AdminCard>
        {tickets.length === 0 ? (
          <AdminEmptyState title="Inbox calme" body="Aucun ticket dérivé." />
        ) : (
          tickets.slice(0, 50).map((item) => (
            <View key={item.id} style={[styles.row, { borderColor: t.hairline }]}>
              <Pressable
                style={{ flex: 1, gap: 2 }}
                onPress={() => onNavigate(item.targetSection, item.entityId)}
              >
                <AdminText variant="h3">{item.title}</AdminText>
                <AdminText variant="caption" color={t.muted} numberOfLines={2}>
                  {item.subtitle}
                </AdminText>
              </Pressable>
              <View style={styles.actions}>
                <AdminBadge label={item.kind} tone="info" />
                {canAdminWorkInlineAction(item, 'approve') ? (
                  <AdminButton
                    label="OK"
                    disabled={busyId === item.id}
                    onPress={() => act(item, 'approve')}
                  />
                ) : null}
                {canAdminWorkInlineAction(item, 'reject') ||
                adminWorkItemNeedsOpenToTreat(item) ? (
                  <AdminButton
                    label={adminWorkItemNeedsOpenToTreat(item) ? 'Ouvrir' : 'Refus'}
                    variant={adminWorkItemNeedsOpenToTreat(item) ? 'soft' : 'danger'}
                    disabled={busyId === item.id}
                    onPress={() => act(item, 'reject')}
                  />
                ) : null}
              </View>
            </View>
          ))
        )}
      </AdminCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: adminSpace.lg, gap: adminSpace.lg, paddingBottom: 48 },
  row: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
  },
  actions: { gap: 6, alignItems: 'flex-end', maxWidth: 120 },
});
