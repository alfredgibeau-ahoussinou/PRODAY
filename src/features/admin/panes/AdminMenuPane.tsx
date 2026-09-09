import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import {
  ADMIN_MENU_DEST_IDS,
  ADMIN_NAV_ITEMS,
  findAdminNavItem,
  type AdminNavSectionId,
} from '../navigation/adminNavConfig';
import {
  AdminBadge,
  AdminButton,
  AdminCard,
  AdminPaneHeader,
  AdminText,
} from '../ui/adminUi';
import { ADMIN_TOKENS } from '../theme/adminTokens';
import { adminLayout, adminSpace } from '../theme/adminDesignSystem';
import { Icon } from '../../../components/ui/Icon';
import { useAdminData } from '../data/AdminDataContext';

type Props = {
  onNavigate: (section: AdminNavSectionId) => void;
  onOpenCommand?: () => void;
};

export function AdminMenuPane({ onNavigate, onOpenCommand }: Props) {
  const t = ADMIN_TOKENS;
  const data = useAdminData();
  const dests = ADMIN_MENU_DEST_IDS.map((id) => findAdminNavItem(id)).filter(Boolean);

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <AdminPaneHeader
        title="Plus"
        subtitle="Sections ops hors dock · Cockpit Total"
      />
      <AdminButton label="Ouvrir commande" variant="soft" onPress={() => onOpenCommand?.()} />
      <AdminCard>
        <AdminText variant="h2">Modules</AdminText>
        {dests.map((item) =>
          item ? (
            <Pressable
              key={item.id}
              onPress={() => onNavigate(item.id)}
              style={[styles.row, { borderColor: t.hairline }]}
            >
              <Icon name={item.icon} size={18} color={t.signal} />
              <View style={{ flex: 1 }}>
                <AdminText variant="h3">{item.label}</AdminText>
                {item.hint ? (
                  <AdminText variant="caption" color={t.muted}>
                    {item.hint}
                  </AdminText>
                ) : null}
              </View>
              <AdminBadge label="→" tone="info" />
            </Pressable>
          ) : null,
        )}
      </AdminCard>
      <AdminCard>
        <AdminText variant="caption" color={t.faint}>
          {ADMIN_NAV_ITEMS.length} sections · file {data.workQueue.length} · santé{' '}
          {data.health.score}
        </AdminText>
      </AdminCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: adminLayout.pageGutter,
    gap: adminLayout.sectionGap,
    paddingBottom: adminLayout.dockClearance,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
