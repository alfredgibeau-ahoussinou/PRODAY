import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  Alert,
  RefreshControl,
} from 'react-native';
import { useAdminData } from '../../../context/AdminDataContext';
import { adminService } from '../../../services/admin.service';
import { ADMIN_FOC_TABS } from '../../../navigation/adminFocConfig';
import { AdminFocTabs, AdminFocPageHeader } from '../../../components/admin/foc/AdminFocTabs';
import { AdminMessagesPanel } from '../../../components/admin/AdminMessagesPanel';
import { AdminPlatformFeedPanel } from '../../../components/admin/AdminPlatformFeedPanel';
import { AdminWeeklyQuestionPanel } from '../../../components/admin/AdminWeeklyQuestionPanel';
import { Icon } from '../../../components/ui/Icon';
import { ADMIN_WORK_KIND_LABELS } from '../../../navigation/adminTabConfig';
import { adminChrome } from '../../../theme/adminTheme';
import { spacing, radius } from '../../../theme/designTokens';
import { recruitmentService } from '../../../services/recruitment.service';
import type { AdminWorkItem } from '../../../utils/adminInsights';
import type { ClubAnnouncement } from '../../../models/ClubAnnouncement';

const TABS = ADMIN_FOC_TABS.communication;
type TabId = (typeof TABS)[number]['id'];

/* ─── Decision row ──────────────────────────────────────────────────── */

function DecisionRow({
  item,
  onApprove,
  onReject,
}: {
  item: AdminWorkItem;
  onApprove: (item: AdminWorkItem) => void;
  onReject: (item: AdminWorkItem) => void;
}) {
  const kindLabel = ADMIN_WORK_KIND_LABELS[item.kind] ?? item.kind;
  const isPending = item.priority === 'high' || item.kind === 'verification';

  return (
    <View style={s.decisionRow}>
      <View style={s.decisionMeta}>
        <View style={[s.kindTag, isPending && s.kindTagHot]}>
          <Text style={[s.kindText, isPending && s.kindTextHot]}>{kindLabel}</Text>
        </View>
        {item.meta ? <Text style={s.decisionTime}>{item.meta}</Text> : null}
      </View>
      <Text style={s.decisionTitle} numberOfLines={2}>{item.title}</Text>
      {item.subtitle ? (
        <Text style={s.decisionSub} numberOfLines={1}>{item.subtitle}</Text>
      ) : null}
      <View style={s.decisionActions}>
        <Pressable
          style={[s.actionBtn, s.approveBtn]}
          onPress={() => onApprove(item)}
          accessibilityRole="button"
        >
          <Text style={[s.actionBtnText, { color: adminChrome.pitch }]}>Approuver</Text>
        </Pressable>
        <Pressable
          style={[s.actionBtn, s.rejectBtn]}
          onPress={() => onReject(item)}
          accessibilityRole="button"
        >
          <Text style={[s.actionBtnText, { color: adminChrome.danger }]}>Refuser</Text>
        </Pressable>
      </View>
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
    <Pressable
      style={({ pressed }) => [s.row, pressed && s.rowPressed]}
      onPress={() => {
        Alert.alert(
          ann.title,
          ann.body?.slice(0, 200) || '—',
          [
            {
              text: 'Supprimer',
              style: 'destructive',
              onPress: () => onDelete(ann.id),
            },
            { text: 'Fermer', style: 'cancel' },
          ],
          { cancelable: true },
        );
      }}
    >
      <View style={s.rowMain}>
        <Text style={s.rowTitle} numberOfLines={1}>{ann.title}</Text>
        {ann.body ? (
          <Text style={s.rowSub} numberOfLines={2}>{ann.body}</Text>
        ) : null}
      </View>
      <Icon name="chevron-forward" size={14} color={adminChrome.textMuted} />
    </Pressable>
  );
}

/* ─── Screen ────────────────────────────────────────────────────────── */

export function AdminFocCommunicationScreen() {
  const { workQueue, announcements, refresh, refreshing } = useAdminData();
  const [tab, setTab] = useState<TabId>('decisions');

  const handleApprove = useMemo(
    () => (item: AdminWorkItem) => {
      const act = async () => {
        try {
          if (item.kind === 'verification' && item.entityId) {
            await adminService.validateProfile(item.entityId, 'approve');
          } else if (item.kind === 'reel') {
            const reelId = item.id.replace(/^reel-/, '');
            await adminService.updateCommunityReelStatus(reelId, 'approved');
          } else if (item.kind === 'application') {
            const appId = item.id.replace(/^app-/, '');
            await recruitmentService.updateApplicationStatus(appId, 'ACCEPTED');
          } else if (item.kind === 'payment') {
            const payId = item.id.replace(/^pay-/, '');
            await adminService.updatePaymentStatus(payId, 'paid');
          }
          void refresh();
        } catch {
          Alert.alert('Erreur', 'Impossible d\'effectuer cette action.');
        }
      };
      Alert.alert('Approuver ?', item.title, [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Approuver', onPress: () => void act() },
      ]);
    },
    [refresh],
  );

  const handleReject = useMemo(
    () => (item: AdminWorkItem) => {
      const act = async () => {
        try {
          if (item.kind === 'verification' && item.entityId) {
            await adminService.validateProfile(item.entityId, 'reject', 'Refus admin');
          } else if (item.kind === 'reel') {
            const reelId = item.id.replace(/^reel-/, '');
            await adminService.updateCommunityReelStatus(reelId, 'rejected');
          } else if (item.kind === 'application') {
            const appId = item.id.replace(/^app-/, '');
            await recruitmentService.updateApplicationStatus(appId, 'REJECTED');
          } else if (item.kind === 'report') {
            const reportId = item.id.replace(/^report-/, '');
            await adminService.deleteReelReport(reportId);
          }
          void refresh();
        } catch {
          Alert.alert('Erreur', 'Impossible d\'effectuer cette action.');
        }
      };
      Alert.alert('Refuser / Clôturer ?', item.title, [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Confirmer', style: 'destructive', onPress: () => void act() },
      ]);
    },
    [refresh],
  );

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
            } catch {
              Alert.alert('Erreur', 'Impossible de supprimer cette annonce.');
            }
          },
        },
      ]);
    },
    [refresh],
  );

  return (
    <View style={s.root}>
      <AdminFocPageHeader title="Communication" />
      <AdminFocTabs tabs={TABS} value={tab} onChange={(id) => setTab(id as TabId)} />

      {tab === 'decisions' ? (
        <FlatList
          data={workQueue}
          keyExtractor={(i) => i.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={adminChrome.accent} />
          }
          renderItem={({ item }) => (
            <DecisionRow item={item} onApprove={handleApprove} onReject={handleReject} />
          )}
          ItemSeparatorComponent={() => <View style={s.sep} />}
          ListEmptyComponent={
            <View style={s.empty}>
              <Icon name="checkmark-circle" size={32} color={adminChrome.pitch} />
              <Text style={s.emptyTitle}>Aucune décision en attente</Text>
              <Text style={s.emptySub}>Tout est à jour — bravo !</Text>
            </View>
          }
          contentContainerStyle={workQueue.length === 0 ? s.emptyContainer : s.list}
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

  /* Decision rows */
  decisionRow: {
    backgroundColor: adminChrome.shell,
    borderRadius: adminChrome.radius,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: adminChrome.shellBorder,
    padding: spacing.md,
    gap: spacing.xs,
  },
  decisionMeta: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
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
  decisionTime: { fontSize: 11, color: adminChrome.textMuted, marginLeft: 'auto' },
  decisionTitle: { fontSize: 14, fontWeight: '700', color: adminChrome.text, lineHeight: 20 },
  decisionSub: { fontSize: 12, color: adminChrome.textMuted },
  decisionActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  actionBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: radius.md,
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  approveBtn: {
    backgroundColor: 'rgba(22,101,52,0.07)',
    borderColor: 'rgba(22,101,52,0.25)',
  },
  rejectBtn: {
    backgroundColor: 'rgba(225,29,72,0.06)',
    borderColor: 'rgba(225,29,72,0.2)',
  },
  actionBtnText: { fontSize: 13, fontWeight: '700' },

  /* Announcement / generic rows */
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    backgroundColor: adminChrome.shell,
  },
  rowPressed: { backgroundColor: adminChrome.rowHover },
  rowMain: { flex: 1, minWidth: 0, gap: 2 },
  rowTitle: { fontSize: 14, fontWeight: '700', color: adminChrome.text },
  rowSub: { fontSize: 12, color: adminChrome.textMuted, lineHeight: 17 },
});
