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

/**
 * Top bar desktop uniquement — pas de nav mobile (dock bas = nav principale).
 */
type Props = {
  section: AdminNavSectionId;
  healthScore: number;
  actionCount: number;
  topInset?: number;
  onOpenCommand: () => void;
  onOpenHealth: () => void;
};

export function AdminTopBar({
  section,
  healthScore,
  actionCount,
  topInset = 0,
  onOpenCommand,
  onOpenHealth,
}: Props) {
  const t = ADMIN_TOKENS;
  const item = findAdminNavItem(section === 'menu' ? 'accueil' : section);

  return (
    <View
      style={[
        styles.root,
        {
          paddingTop: topInset + adminSpace.sm,
          minHeight: adminChrome.topBarHeight + topInset,
        },
      ]}
    >
      <View style={{ flex: 1, gap: 2, minWidth: 0 }}>
        <AdminBrandMark compact />
        <AdminText variant="h3" numberOfLines={1}>
          {item?.label ?? 'Control Center'}
        </AdminText>
      </View>
      <Pressable onPress={onOpenHealth} style={styles.pill} hitSlop={8}>
        <AdminText variant="caption" color={t.signal} style={{ fontWeight: '700' }}>
          Health {healthScore}%
        </AdminText>
      </Pressable>
      {actionCount > 0 ? <AdminBadge label={`${actionCount}`} tone="warn" /> : null}
      <Pressable onPress={onOpenCommand} style={styles.iconBtn} hitSlop={8}>
        <Icon name="search" size={18} color={t.accentHot} />
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
    paddingBottom: adminSpace.sm,
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
    borderRadius: adminRadius.md,
    backgroundColor: ADMIN_TOKENS.signalSoft,
    borderWidth: 1,
    borderColor: ADMIN_TOKENS.border,
  },
});
