import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Alert,
  RefreshControl,
} from 'react-native';
import { useAdminData } from '../../../context/AdminDataContext';
import { ADMIN_FOC_SCREEN_TABS } from '../../../navigation/adminFocConfig';
import { AdminFocTabs, AdminFocPageHeader } from '../../../components/admin/foc/AdminFocTabs';
import { AdminMessagesPanel } from '../../../components/admin/AdminMessagesPanel';
import { AdminPlatformFeedPanel } from '../../../components/admin/AdminPlatformFeedPanel';
import { AdminWeeklyQuestionPanel } from '../../../components/admin/AdminWeeklyQuestionPanel';
import { AdminActionRow, AdminButton } from '../../../components/admin/AdminButton';
import { Icon } from '../../../components/ui/Icon';
import { ADMIN_WORK_KIND_LABELS, ADMIN_PRIORITY_LABELS } from '../../../navigation/adminTabConfig';
import { adminChrome } from '../../../theme/adminTheme';
import { spacing, radius } from '../../../theme/designTokens';
import type { AdminWorkItem } from '../../../utils/adminInsights';
import type { ClubAnnouncement } from '../../../models/ClubAnnouncement';
import { adminService } from '../../../services/admin.service';
import {
  adminWorkItemNeedsOpenToTreat,
  canAdminWorkInlineAction,
  confirmAdminWorkApprove,
  confirmAdminWorkReject,
  runAdminWorkApprove,
  runAdminWorkReject,
} from '../../../utils/adminWorkQueueActions';

const COMMUNICATION_DECISION_KINDS = new Set<AdminWorkItem['kind']>(['reel', 'report']);

const TABS = ADMIN_FOC_SCREEN_TABS.communication;
type TabId = (typeof TABS)[number]['id'];

type Props = {
  initialTab?: string;
  title?: string;
  allowedTabs?: readonly string[];
};

/* ─── Decision row ──────────────────────────────────────────────────── */

function DecisionRow({
  item,
  onApprove,
  onReject,
  busyId,
}: {
  item: AdminWorkItem;
  onApprove: () => void;
  onReject: () => void;
  busyId: string | null;
}) {
  const kindLabel = ADMIN_WORK_KIND_LABELS[item.kind] ?? item.kind;
  const priorityLabel = ADMIN_PRIORITY_LABELS[item.priority] ?? item.priority;
  const isPending = item.priority === 'high' || item.priority === 'critical';
  const showApprove = canAdminWorkInlineAction(item, 'approve');
  const showReject = canAdminWorkInlineAction(item, 'reject');
  const needsOpenHint = adminWorkItemNeedsOpenToTreat(item);

  return (
    <View style={s.decisionRow}>
      <View style={s.decisionMeta}>
        <View style={[s.kindTag, isPending && s.kindTagHot]}>
          <Text style={[s.kindText, isPending && s.kindTextHot]}>{kindLabel}</Text>
        </View>
        <View style={[s.priorityTag, isPending && s.priorityTagHot]}>
          <Text style={[s.priorityText, isPending && s.priorityTextHot]}>{priorityLabel}</Text>
        </View>
        {item.meta ? <Text style={s.decisionTime}>{item.meta}</Text> : null}
      </View>
      <Text style={s.decisionTitle} numberOfLines={2}>{item.title}</Text>
      {item.subtitle ? (
        <Text style={s.decisionSub} numberOfLines={1}>{item.subtitle}</Text>
      ) : null}
      {showApprove || showReject ? (
        <AdminActionRow
          onApprove={showApprove ? onApprove : undefined}
          onReject={showReject ? onReject : undefined}
          approveLoading={busyId === `${item.id}:approve`}
          rejectLoading={busyId === `${item.id}:reject`}
          disabled={!!busyId}
          showApprove={showApprove}
          showReject={showReject}
        />
      ) : needsOpenHint ? (
        <Text style={s.openHint}>Ouvrir pour traiter</Text>
      ) : null}
    </View>
  );
}

/* ─── Announcement row ──────────────────────────────────────────────── */

function AnnouncementRow({
  ann,
  onDelete,
}: {
  ann: ClubAnnouncement;
  onDelete: (id: string) => void;
}) {
  return (
    <View style={s.row}>
      <View style={s.rowMain}>
        <Text style={s.rowTitle} numberOfLines={1}>{ann.title}</Text>
        {ann.body ? (
          <Text style={s.rowSub} numberOfLines={2}>{ann.body}</Text>
        ) : null}
      </View>
      <AdminButton
        label="Supprimer"
        variant="danger"
        size="sm"
        icon="close"
        onPress={() => onDelete(ann.id)}
      />
    </View>
  );
}

/* ─── Screen ────────────────────────────────────────────────────────── */

export function AdminFocCommunicationScreen({ initialTab, title, allowedTabs }: Props) {
  const { workQueue, announcements, refresh, refreshing } = useAdminData();
  const visibleTabs = useMemo(
    () => (allowedTabs ? TABS.filter((t) => allowedTabs.includes(t.id)) : [...TABS]),
    [allowedTabs],
  );
  const [tab, setTab] = useState<TabId>(
    (initialTab as TabId) || (visibleTabs[0]?.id as TabId) || 'decisions',
  );
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (initialTab && visibleTabs.some((t) => t.id === initialTab)) {
      setTab(initialTab as TabId);
    }
  }, [initialTab, visibleTabs]);

  const handleApprove = (item: AdminWorkItem) => {
    if (!canAdminWorkInlineAction(item, 'approve')) return;
    confirmAdminWorkApprove(item, async () => {
      setBusyId(`${item.id}:approve`);
      try {
        await runAdminWorkApprove(item, refresh);
      } finally {
        setBusyId(null);
      }
    });
  };

  const handleReject = (item: AdminWorkItem) => {
    if (!canAdminWorkInlineAction(item, 'reject')) return;
    confirmAdminWorkReject(item, async () => {
      setBusyId(`${item.id}:reject`);
      try {
        await runAdminWorkReject(item, refresh);
      } finally {
        setBusyId(null);
      }
    });
  };

  const handleDeleteAnnouncement = useMemo(
    () => (id: string) => {
      Alert.alert('Supprimer ?', 'Cette action est irréversible.', [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await adminService.deleteClubAnnouncement(id);
              void refresh();
              Alert.alert('Annonce supprimée', 'L\'annonce a été retirée.');
            } catch {
              Alert.alert('Erreur', 'Impossible de supprimer cette annonce.');
            }
          },
        },
      ]);
    },
    [refresh],
  );

  const communicationDecisions = useMemo(
    () => workQueue.filter((item) => COMMUNICATION_DECISION_KINDS.has(item.kind)),
    [workQueue],
  );

  return (
    <View style={s.root}>
      <AdminFocPageHeader title={title ?? 'Communication'} />
      <AdminFocTabs tabs={visibleTabs} value={tab} onChange={(id) => setTab(id as TabId)} />

      {tab === 'decisions' ? (
        <FlatList
          data={communicationDecisions}
          keyExtractor={(i) => i.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={adminChrome.accent} />
          }
          renderItem={({ item }) => (
            <DecisionRow
              item={item}
              onApprove={() => handleApprove(item)}
              onReject={() => handleReject(item)}
              busyId={busyId}
            />
          )}
          ItemSeparatorComponent={() => <View style={s.sep} />}
          ListEmptyComponent={
            <View style={s.empty}>
              <Icon name="checkmark-circle" size={32} color={adminChrome.pitch} />
              <Text style={s.emptyTitle}>Aucune décision en attente</Text>
              <Text style={s.emptySub}>Tout est à jour — bravo !</Text>
            </View>
          }
          contentContainerStyle={communicationDecisions.length === 0 ? s.emptyContainer : s.list}
          showsVerticalScrollIndicator={false}
        />
      ) : tab === 'messages' ? (
        <AdminMessagesPanel />
      ) : tab === 'annonces' ? (
        <FlatList
          data={announcements}
          keyExtractor={(a) => a.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={adminChrome.accent} />
          }
          renderItem={({ item }) => (
            <AnnouncementRow ann={item} onDelete={handleDeleteAnnouncement} />
          )}
          ItemSeparatorComponent={() => <View style={s.sep} />}
          ListEmptyComponent={
            <View style={s.empty}>
              <Icon name="chat" size={32} color={adminChrome.textMuted} />
              <Text style={s.emptyTitle}>Aucune annonce</Text>
              <Text style={s.emptySub}>Les annonces des clubs s'afficheront ici.</Text>
            </View>
          }
          contentContainerStyle={announcements.length === 0 ? s.emptyContainer : s.list}
          showsVerticalScrollIndicator={false}
        />
      ) : tab === 'fil' ? (
        <AdminPlatformFeedPanel />
      ) : tab === 'questions' ? (
        <AdminWeeklyQuestionPanel />
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: adminChrome.band },
  list: { padding: spacing.md, gap: spacing.sm, paddingBottom: 80 },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  empty: { alignItems: 'center', gap: spacing.md, paddingTop: spacing.xl * 2 },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: adminChrome.text },
  emptySub: { fontSize: 13, color: adminChrome.textMuted, textAlign: 'center', lineHeight: 20 },
  sep: { height: spacing.sm },

  decisionRow: {
    backgroundColor: adminChrome.shell,
    borderRadius: adminChrome.radius,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: adminChrome.shellBorder,
    padding: spacing.md,
    gap: spacing.xs,
  },
  decisionMeta: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, flexWrap: 'wrap' },
  kindTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
    backgroundColor: adminChrome.shellMid,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: adminChrome.shellBorder,
  },
  kindTagHot: {
    backgroundColor: 'rgba(0,108,252,0.08)',
    borderColor: adminChrome.accentMuted,
  },
  kindText: { fontSize: 11, fontWeight: '700', color: adminChrome.textMuted },
  kindTextHot: { color: adminChrome.accent },
  priorityTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
    backgroundColor: adminChrome.shellElevated,
  },
  priorityTagHot: { backgroundColor: 'rgba(245, 158, 11, 0.12)' },
  priorityText: { fontSize: 10, fontWeight: '700', color: adminChrome.textMuted },
  priorityTextHot: { color: adminChrome.warning },
  decisionTime: { fontSize: 11, color: adminChrome.textMuted, marginLeft: 'auto' },
  decisionTitle: { fontSize: 14, fontWeight: '700', color: adminChrome.text, lineHeight: 20 },
  decisionSub: { fontSize: 12, color: adminChrome.textMuted },
  openHint: {
    fontSize: 12,
    color: adminChrome.textMuted,
    fontStyle: 'italic',
    marginTop: spacing.xs,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    backgroundColor: adminChrome.shell,
  },
  rowMain: { flex: 1, minWidth: 0, gap: 2 },
  rowTitle: { fontSize: 14, fontWeight: '700', color: adminChrome.text },
  rowSub: { fontSize: 12, color: adminChrome.textMuted, lineHeight: 17 },
});
