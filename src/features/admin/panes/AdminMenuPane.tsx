import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import {
  ADMIN_MENU_DEST_IDS,
  ADMIN_NAV_ITEMS,
  type AdminNavSectionId,
} from '../navigation/adminNavConfig';
import { AdminPaneHeader, AdminText } from '../ui/adminUi';
import { ADMIN_TOKENS } from '../theme/adminTokens';
import { adminLayout, adminRadius, adminSpace } from '../theme/adminDesignSystem';
import { Icon } from '../../../components/ui/Icon';

type Props = { onNavigate: (section: AdminNavSectionId) => void };

export function AdminMenuPane({ onNavigate }: Props) {
  const t = ADMIN_TOKENS;
  const items = ADMIN_NAV_ITEMS.filter((n) => ADMIN_MENU_DEST_IDS.includes(n.id));

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content}>
      <AdminPaneHeader title="Menu" subtitle="Domaines supplémentaires" />
      {items.map((item) => (
        <Pressable
          key={item.id}
          onPress={() => onNavigate(item.id)}
          style={[styles.row, { borderColor: t.border, backgroundColor: t.surface }]}
        >
          <Icon name={item.icon} size={18} color={t.accent} />
          <View style={{ flex: 1 }}>
            <AdminText variant="h3">{item.label}</AdminText>
            {item.hint ? (
              <AdminText variant="caption" muted>
                {item.hint}
              </AdminText>
            ) : null}
          </View>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: adminLayout.pageGutter,
    gap: adminLayout.stackGap,
    paddingBottom: adminLayout.dockClearance,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: adminSpace.lg,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    minHeight: adminLayout.listRowMinHeight,
  },
});
