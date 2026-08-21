import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useAdminData } from '../data/AdminDataContext';
import {
  AdminBadge,
  AdminCard,
  AdminEmptyState,
  AdminLoading,
  AdminText,
} from '../ui/adminUi';
import { ADMIN_TOKENS } from '../theme/adminTokens';
import { adminSpace } from '../theme/adminDesignSystem';
import type { AdminNavSectionId } from '../navigation/adminNavConfig';

type Props = { onNavigate: (section: AdminNavSectionId, focusId?: string) => void };

export function AdminSupportPane({ onNavigate }: Props) {
  const data = useAdminData();
  const t = ADMIN_TOKENS;
  if (data.loading) return <AdminLoading />;

  const tickets = data.workQueue.filter((w) =>
    ['reel', 'report', 'application', 'verification'].includes(w.kind),
  );

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content}>
      <AdminText variant="h1">Support</AdminText>
      <AdminText variant="caption" color={t.muted}>
        File support dérivée des décisions plateforme (pas de faux tickets)
      </AdminText>
      <AdminCard>
        {tickets.length === 0 ? (
          <AdminEmptyState title="Inbox calme" body="Aucun ticket dérivé pour le moment." />
        ) : (
          tickets.slice(0, 40).map((item) => (
            <Pressable
              key={item.id}
              onPress={() => onNavigate(item.targetSection, item.entityId)}
              style={[styles.row, { borderColor: t.hairline }]}
            >
              <View style={{ flex: 1, gap: 2 }}>
                <AdminText variant="h3">{item.title}</AdminText>
                <AdminText variant="caption" color={t.muted} numberOfLines={2}>
                  {item.subtitle}
                </AdminText>
              </View>
              <AdminBadge label={item.kind} tone="info" />
            </Pressable>
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
});
