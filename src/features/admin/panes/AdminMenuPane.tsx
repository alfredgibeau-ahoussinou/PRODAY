import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import {
  ADMIN_MENU_DEST_IDS,
  ADMIN_NAV_ITEMS,
  type AdminNavSectionId,
} from '../navigation/adminNavConfig';
import { AdminButton, AdminPaneHeader, AdminText } from '../ui/adminUi';
import { ADMIN_TOKENS } from '../theme/adminTokens';
import { adminLayout, adminRadius, adminSpace } from '../theme/adminDesignSystem';
import { Icon } from '../../../components/ui/Icon';
import { AdminListRow, AdminPressable } from '../motion';

type Props = {
  onNavigate: (section: AdminNavSectionId) => void;
  onOpenCommand?: () => void;
};

export function AdminMenuPane({ onNavigate, onOpenCommand }: Props) {
  const t = ADMIN_TOKENS;
  const items = ADMIN_NAV_ITEMS.filter((n) => ADMIN_MENU_DEST_IDS.includes(n.id));

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content}>
      <AdminPaneHeader
        title="Menu"
        subtitle="Tous les domaines du Control Center"
        right={
          onOpenCommand ? (
            <AdminButton label="⌘K" variant="soft" onPress={onOpenCommand} />
          ) : null
        }
      />
      {onOpenCommand ? (
        <AdminPressable
          onPress={onOpenCommand}
          style={[styles.cmd, { borderColor: t.border, backgroundColor: t.surfaceGlass }]}
        >
          <Icon name="search" size={16} color={t.signal} />
          <AdminText variant="caption" muted style={{ flex: 1 }}>
            Rechercher clubs, devis, users…
          </AdminText>
          <AdminText variant="caption" color={t.signal}>
            ⌘K
          </AdminText>
        </AdminPressable>
      ) : null}
      {items.map((item, index) => (
        <AdminListRow
          key={item.id}
          index={index}
          onPress={() => onNavigate(item.id)}
          style={[styles.row, { borderColor: t.border, backgroundColor: t.surface }]}
        >
          <View
            style={[
              styles.iconWrap,
              { backgroundColor: t.signalSoft, borderColor: t.border },
            ]}
          >
            <Icon name={item.icon} size={16} color={t.signal} />
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <AdminText variant="h3">{item.label}</AdminText>
            {item.hint ? (
              <AdminText variant="caption" muted>
                {item.hint}
              </AdminText>
            ) : null}
          </View>
          <Icon name="chevron-forward" size={16} color={t.faint} />
        </AdminListRow>
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
  cmd: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    minHeight: adminLayout.hitTarget,
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
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: adminRadius.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
