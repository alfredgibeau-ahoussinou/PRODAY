import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useAdminData } from '../data/AdminDataContext';
import {
  AdminBadge,
  AdminButton,
  AdminCard,
  AdminEmptyState,
  AdminLoading,
  AdminPaneHeader,
  AdminText,
} from '../ui/adminUi';
import { ADMIN_TOKENS } from '../theme/adminTokens';
import { adminLayout, adminRadius, adminSpace } from '../theme/adminDesignSystem';
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

const KIND_FILTERS = [
  'all',
  'reel',
  'report',
  'verification',
  'club_quote',
  'quote',
  'subscription_request',
  'payment',
  'membership',
  'application',
] as const;

export function AdminSupportPane({ onNavigate }: Props) {
  const data = useAdminData();
  const t = ADMIN_TOKENS;
  const [busyId, setBusyId] = useState<string | null>(null);
  const [kind, setKind] = useState<(typeof KIND_FILTERS)[number]>('all');
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(() => {
      void data.refresh();
    }, 45000);
    return () => clearInterval(id);
  }, [autoRefresh, data.refresh]);

  const tickets = useMemo(() => {
    const base = data.workQueue.filter((w) =>
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
    );
    if (kind === 'all') return base;
    return base.filter((w) => w.kind === kind);
  }, [data.workQueue, kind]);

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
      <AdminPaneHeader
        title="Support"
        subtitle={`File enrichie · refresh ${autoRefresh ? '45s' : 'manuel'}`}
        right={
          <View style={styles.toolbar}>
            <AdminButton
              label={data.refreshing ? '…' : 'Rafraîchir'}
              variant="soft"
              onPress={() => void data.refresh()}
            />
            <AdminButton
              label={autoRefresh ? 'Auto ON' : 'Auto OFF'}
              variant={autoRefresh ? 'primary' : 'ghost'}
              onPress={() => setAutoRefresh((v) => !v)}
            />
          </View>
        }
      />

      {data.lastRefreshedAt ? (
        <AdminBadge
          label={`Maj ${data.lastRefreshedAt.toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit',
          })}`}
          tone="info"
        />
      ) : null}

      <View style={styles.chips}>
        {KIND_FILTERS.map((k) => (
          <Pressable
            key={k}
            onPress={() => setKind(k)}
            style={[
              styles.chip,
              {
                backgroundColor: kind === k ? t.accentSoft : t.surfaceRaised,
                borderColor: kind === k ? t.borderStrong : t.border,
              },
            ]}
          >
            <AdminText variant="caption" color={kind === k ? t.champagneBright : t.muted}>
              {k}
            </AdminText>
          </Pressable>
        ))}
      </View>

      <AdminCard>
        <AdminText variant="caption" color={t.muted}>
          {tickets.length} tickets dérivés de la file décisions (Firestore live)
        </AdminText>
        {tickets.length === 0 ? (
          <AdminEmptyState title="Inbox calme" body="Aucun ticket pour ce filtre." />
        ) : (
          tickets.slice(0, 60).map((item) => (
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
  content: {
    padding: adminLayout.pageGutter,
    gap: adminLayout.stackGap,
    paddingBottom: adminLayout.dockClearance,
  },
  toolbar: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: adminRadius.pill,
    borderWidth: 1,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    alignItems: 'flex-start',
    minHeight: adminLayout.listRowMinHeight,
  },
  actions: { gap: 6, alignItems: 'flex-end' },
});
