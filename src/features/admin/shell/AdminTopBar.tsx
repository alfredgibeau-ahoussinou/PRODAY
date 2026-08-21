import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Icon } from '../../../components/ui/Icon';
import { AdminBadge, AdminBrandMark, AdminText } from '../ui/adminUi';
import { ADMIN_TOKENS } from '../theme/adminTokens';
import {
  adminChrome,
  adminLayout,
  adminRadius,
  adminSpace,
} from '../theme/adminDesignSystem';
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
      <View style={{ flex: 1, gap: 2, minWidth: 0 }}>
        {wide ? <AdminBrandMark compact /> : null}
        <AdminText variant={wide ? 'h3' : 'h2'} numberOfLines={1}>
          {item?.label ?? 'Control Center'}
        </AdminText>
        {item?.hint && !wide ? (
          <AdminText variant="caption" muted numberOfLines={1}>
            {item.hint}
          </AdminText>
        ) : null}
      </View>
      <Pressable onPress={onOpenHealth} style={styles.pill}>
        <AdminText variant="caption" champagne style={{ fontWeight: '700' }}>
          Health {healthScore}%
        </AdminText>
      </Pressable>
      {actionCount > 0 ? <AdminBadge label={`${actionCount}`} tone="warn" /> : null}
      <Pressable onPress={onOpenCommand} style={styles.iconBtn} hitSlop={8}>
        <Icon name="search" size={18} color={t.champagne} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpace.sm,
    paddingHorizontal: adminLayout.headerPadX,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: ADMIN_TOKENS.hairline,
    backgroundColor: ADMIN_TOKENS.headerBg,
  },
  iconBtn: {
    width: adminLayout.hitTarget,
    height: adminLayout.hitTarget,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: adminRadius.sm,
    backgroundColor: ADMIN_TOKENS.surfaceMuted,
    borderWidth: 1,
    borderColor: ADMIN_TOKENS.border,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: adminRadius.pill,
    backgroundColor: ADMIN_TOKENS.accentSoft,
    borderWidth: 1,
    borderColor: ADMIN_TOKENS.border,
  },
});
