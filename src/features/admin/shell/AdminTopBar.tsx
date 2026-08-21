import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Icon } from '../../../components/ui/Icon';
import { AdminBadge, AdminText } from '../ui/adminUi';
import { ADMIN_TOKENS } from '../theme/adminTokens';
import { adminChrome, adminSpace } from '../theme/adminDesignSystem';
import { findAdminNavItem, type AdminNavSectionId } from '../navigation/adminNavConfig';

type Props = {
  section: AdminNavSectionId;
  healthScore: number;
  actionCount: number;
  onOpenMenu?: () => void;
  onOpenCommand: () => void;
  onOpenHealth: () => void;
  wide: boolean;
};

export function AdminTopBar({
  section,
  healthScore,
  actionCount,
  onOpenMenu,
  onOpenCommand,
  onOpenHealth,
  wide,
}: Props) {
  const t = ADMIN_TOKENS;
  const item = findAdminNavItem(section === 'menu' ? 'accueil' : section);

  return (
    <View style={[styles.root, { height: adminChrome.topBarHeight }]}>
      {!wide && onOpenMenu ? (
        <Pressable onPress={onOpenMenu} style={styles.iconBtn} hitSlop={8}>
          <Icon name="menu" size={20} color={t.foreground} />
        </Pressable>
      ) : null}
      <View style={{ flex: 1, gap: 2 }}>
        <AdminText variant="h2" numberOfLines={1}>
          {item?.label ?? 'Control Center'}
        </AdminText>
        {item?.hint ? (
          <AdminText variant="caption" color={t.muted} numberOfLines={1}>
            {item.hint}
          </AdminText>
        ) : null}
      </View>
      <Pressable onPress={onOpenHealth} style={styles.pill}>
        <AdminText variant="caption" color={t.accentHot}>
          Health {healthScore}%
        </AdminText>
      </Pressable>
      {actionCount > 0 ? <AdminBadge label={`${actionCount}`} tone="warn" /> : null}
      <Pressable onPress={onOpenCommand} style={styles.iconBtn} hitSlop={8}>
        <Icon name="search" size={18} color={t.foreground} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpace.sm,
    paddingHorizontal: adminSpace.lg,
    borderBottomWidth: 1,
    borderBottomColor: ADMIN_TOKENS.border,
    backgroundColor: ADMIN_TOKENS.headerBg,
  },
  iconBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: ADMIN_TOKENS.accentSoft,
  },
});
