import React, { useCallback, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AdminButton, AdminActionRow } from './AdminButton';
import { Icon } from '../ui/Icon';
import {
  ADMIN_PRIORITY_LABELS,
  ADMIN_WORK_KIND_LABELS,
} from '../../navigation/adminTabConfig';
import { adminChrome } from '../../theme/adminTheme';
import { spacing, radius } from '../../theme/designTokens';
import type { AdminWorkItem } from '../../utils/adminInsights';
import {
  confirmAdminWorkApprove,
  confirmAdminWorkReject,
  runAdminWorkApprove,
  runAdminWorkReject,
} from '../../utils/adminWorkQueueActions';
import { resolveAdminWorkItemNavigation } from '../../utils/adminWorkNavigation';

type Props = {
  visible: boolean;
  items: AdminWorkItem[];
  onClose: () => void;
  onNavigate: (target: {
    section: string;
    hubTab?: string;
    screenTab?: string;
  }) => void;
  onRefresh: () => void | Promise<void>;
};

function DecisionItem({
  item,
  onOpen,
  onApprove,
  onReject,
  busyId,
}: {
  item: AdminWorkItem;
  onOpen: () => void;
  onApprove: () => void;
  onReject: () => void;
  busyId: string | null;
}) {
  const kindLabel = ADMIN_WORK_KIND_LABELS[item.kind] ?? item.kind;
  const priorityLabel = ADMIN_PRIORITY_LABELS[item.priority] ?? item.priority;
  const isHot = item.priority === 'critical' || item.priority === 'high';
  const loadingApprove = busyId === `${item.id}:approve`;
  const loadingReject = busyId === `${item.id}:reject`;

  return (
    <Pressable
      onPress={onOpen}
      style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
      accessibilityRole="button"
    >
      <View style={styles.itemHead}>
        <View style={[styles.kindTag, isHot && styles.kindTagHot]}>
          <Text style={[styles.kindText, isHot && styles.kindTextHot]}>{kindLabel}</Text>
        </View>
        <View style={[styles.priorityTag, isHot && styles.priorityTagHot]}>
          <Text style={[styles.priorityText, isHot && styles.priorityTextHot]}>
            {priorityLabel}
          </Text>
        </View>
        {item.meta ? <Text style={styles.itemMeta}>{item.meta}</Text> : null}
      </View>
      <Text style={styles.itemTitle} numberOfLines={2}>
        {item.title}
      </Text>
      {item.subtitle ? (
        <Text style={styles.itemSub} numberOfLines={2}>
          {item.subtitle}
        </Text>
      ) : null}
      <View style={styles.itemActions}>
        <AdminButton
          label="Ouvrir"
          variant="secondary"
          size="sm"
          icon="chevron-forward"
          onPress={onOpen}
          disabled={!!busyId}
        />
        <AdminActionRow
          onApprove={onApprove}
          onReject={onReject}
          approveLoading={loadingApprove}
          rejectLoading={loadingReject}
          disabled={!!busyId && !loadingApprove && !loadingReject}
        />
      </View>
    </Pressable>
  );
}

export const AdminPendingDecisionsModal: React.FC<Props> = ({
  visible,
  items,
  onClose,
  onNavigate,
  onRefresh,
}) => {
  const insets = useSafeAreaInsets();
  const [busyId, setBusyId] = useState<string | null>(null);

  const openItem = useCallback(
    (item: AdminWorkItem) => {
      const target = resolveAdminWorkItemNavigation(item);
      onNavigate(target);
      onClose();
    },
    [onClose, onNavigate],
  );

  const handleApprove = useCallback(
    (item: AdminWorkItem) => {
      confirmAdminWorkApprove(item, async () => {
        setBusyId(`${item.id}:approve`);
        try {
          await runAdminWorkApprove(item, onRefresh);
        } finally {
          setBusyId(null);
        }
      });
    },
    [onRefresh],
  );

  const handleReject = useCallback(
    (item: AdminWorkItem) => {
      confirmAdminWorkReject(item, async () => {
        setBusyId(`${item.id}:reject`);
        try {
          await runAdminWorkReject(item, onRefresh);
        } finally {
          setBusyId(null);
        }
      });
    },
    [onRefresh],
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <Text style={styles.title}>Décisions en attente</Text>
            <Text style={styles.sub}>
              {items.length > 0
                ? `${items.length} action${items.length > 1 ? 's' : ''} à traiter`
                : 'Tout est à jour'}
            </Text>
          </View>
          <AdminButton label="Fermer" variant="ghost" size="sm" onPress={onClose} />
        </View>
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <DecisionItem
              item={item}
              onOpen={() => openItem(item)}
              onApprove={() => handleApprove(item)}
              onReject={() => handleReject(item)}
              busyId={busyId}
            />
          )}
          ItemSeparatorComponent={() => <View style={styles.sep} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Icon name="checkmark-circle" size={36} color={adminChrome.pitch} />
              <Text style={styles.emptyTitle}>Aucune décision en attente</Text>
              <Text style={styles.emptySub}>Tout est à jour — bravo !</Text>
            </View>
          }
          contentContainerStyle={[
            styles.list,
            items.length === 0 && styles.listEmpty,
          ]}
        />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: adminChrome.band },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: adminChrome.shellBorder,
    backgroundColor: adminChrome.shell,
    gap: spacing.sm,
  },
  headerCopy: { flex: 1, gap: 2 },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: adminChrome.text,
    letterSpacing: -0.3,
  },
  sub: { fontSize: 13, color: adminChrome.textMuted },
  list: { padding: spacing.md, paddingBottom: spacing.xl * 2 },
  listEmpty: { flexGrow: 1, justifyContent: 'center' },
  sep: { height: spacing.sm },
  item: {
    backgroundColor: adminChrome.shell,
    borderRadius: adminChrome.radius,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: adminChrome.shellBorder,
    padding: spacing.md,
    gap: spacing.xs,
  },
  itemPressed: { backgroundColor: adminChrome.rowHover },
  itemHead: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  kindTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
    backgroundColor: adminChrome.shellMid,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: adminChrome.shellBorder,
  },
  kindTagHot: {
    backgroundColor: adminChrome.soft,
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
  itemMeta: {
    marginLeft: 'auto',
    fontSize: 11,
    color: adminChrome.textMuted,
  },
  itemTitle: { fontSize: 14, fontWeight: '700', color: adminChrome.text, lineHeight: 20 },
  itemSub: { fontSize: 12, color: adminChrome.textMuted, lineHeight: 17 },
  itemActions: { gap: spacing.sm, marginTop: spacing.xs },
  empty: { alignItems: 'center', gap: spacing.md, padding: spacing.xl },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: adminChrome.text },
  emptySub: { fontSize: 13, color: adminChrome.textMuted, textAlign: 'center' },
});
