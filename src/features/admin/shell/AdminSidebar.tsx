import React, { useMemo } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Icon } from '../../../components/ui/Icon';
import { BRANDING_LOGOS } from '../../../content/brandingAssets';
import { AdminBrandMark, AdminText } from '../ui/adminUi';
import {
  ADMIN_NAV_GROUPS,
  ADMIN_NAV_ITEMS,
  type AdminNavSectionId,
} from '../navigation/adminNavConfig';
import { ADMIN_TOKENS } from '../theme/adminTokens';
import { adminChrome, adminSpace } from '../theme/adminDesignSystem';

type Props = {
  activeId: AdminNavSectionId;
  onSelect: (id: AdminNavSectionId) => void;
  onOpenCommand: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  actionCount?: number;
};

export function AdminSidebar({
  activeId,
  onSelect,
  onOpenCommand,
  collapsed,
  onToggleCollapse,
  actionCount = 0,
}: Props) {
  const insets = useSafeAreaInsets();
  const t = ADMIN_TOKENS;
  const width = collapsed ? adminChrome.sidebarCollapsed : adminChrome.sidebarExpanded;
  const styles = useMemo(() => createStyles(collapsed), [collapsed]);

  return (
    <View style={[styles.root, { width, paddingTop: insets.top + 8 }]}>
      <LinearGradient
        colors={['rgba(59,130,246,0.12)', 'transparent']}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.brand}>
        <Image
          source={BRANDING_LOGOS.official}
          style={collapsed ? styles.logoSm : styles.logo}
          resizeMode="contain"
        />
        {!collapsed ? (
          <View style={{ flex: 1, gap: 2 }}>
            <AdminBrandMark compact />
            <AdminText variant="caption" color={t.muted} numberOfLines={1}>
              Control Center
            </AdminText>
          </View>
        ) : null}
      </View>

      {!collapsed ? (
        <Pressable onPress={onOpenCommand} style={styles.cmd}>
          <Icon name="search" size={14} color={t.muted} />
          <AdminText variant="caption" color={t.muted} style={{ flex: 1 }}>
            Rechercher…
          </AdminText>
          <AdminText variant="mono" color={t.faint}>
            ⌘K
          </AdminText>
        </Pressable>
      ) : (
        <Pressable onPress={onOpenCommand} style={styles.cmdIcon}>
          <Icon name="search" size={18} color={t.muted} />
        </Pressable>
      )}

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 24, gap: 12 }}>
        {ADMIN_NAV_GROUPS.map((group) => {
          const items = ADMIN_NAV_ITEMS.filter((n) => n.group === group.id);
          if (!items.length) return null;
          return (
            <View key={group.id} style={{ gap: 4 }}>
              {!collapsed ? (
                <AdminText variant="label" color={t.faint} style={{ paddingHorizontal: 10 }}>
                  {group.label}
                </AdminText>
              ) : null}
              {items.map((item) => {
                const active = activeId === item.id;
                return (
                  <Pressable
                    key={item.id}
                    onPress={() => onSelect(item.id)}
                    style={[
                      styles.item,
                      active && { backgroundColor: t.accentSoft, borderColor: t.accent },
                    ]}
                  >
                    <Icon name={item.icon} size={18} color={active ? t.accentHot : t.muted} />
                    {!collapsed ? (
                      <AdminText
                        variant="nav"
                        color={active ? t.foreground : t.muted}
                        style={{ flex: 1 }}
                      >
                        {item.label}
                      </AdminText>
                    ) : null}
                    {!collapsed && item.id === 'accueil' && actionCount > 0 ? (
                      <View style={styles.badge}>
                        <AdminText variant="label" color="#fff" style={{ letterSpacing: 0 }}>
                          {actionCount}
                        </AdminText>
                      </View>
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
          );
        })}
      </ScrollView>

      {onToggleCollapse ? (
        <Pressable onPress={onToggleCollapse} style={styles.collapse}>
          <Icon name={collapsed ? 'chevron-forward' : 'chevron-down'} size={16} color={t.muted} />
          {!collapsed ? (
            <AdminText variant="caption" color={t.muted}>
              Réduire
            </AdminText>
          ) : null}
        </Pressable>
      ) : null}
    </View>
  );
}

function createStyles(collapsed?: boolean) {
  const t = ADMIN_TOKENS;
  return StyleSheet.create({
    root: {
      backgroundColor: t.sidebarBg,
      borderRightWidth: 1,
      borderRightColor: t.border,
      paddingHorizontal: collapsed ? 8 : 12,
      gap: adminSpace.sm,
    },
    brand: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingHorizontal: 4,
      minHeight: 48,
    },
    logo: { width: 36, height: 36 },
    logoSm: { width: 28, height: 28 },
    cmd: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 10,
      paddingVertical: 10,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: t.border,
      backgroundColor: t.surfaceMuted,
    },
    cmdIcon: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 10,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: t.border,
    },
    item: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingVertical: 10,
      paddingHorizontal: collapsed ? 10 : 10,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: 'transparent',
      justifyContent: collapsed ? 'center' : 'flex-start',
    },
    badge: {
      minWidth: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: t.danger,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 5,
    },
    collapse: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingVertical: 12,
      paddingBottom: 16,
      justifyContent: collapsed ? 'center' : 'flex-start',
    },
  });
}
