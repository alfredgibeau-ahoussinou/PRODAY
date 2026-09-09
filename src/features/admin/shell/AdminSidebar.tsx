import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Icon } from '../../../components/ui/Icon';
import { ProDaySymbol } from '../../../components/branding/ProDaySymbol';
import { AdminBrandMark, AdminText } from '../ui/adminUi';
import {
  ADMIN_NAV_GROUPS,
  ADMIN_NAV_ITEMS,
  type AdminNavSectionId,
} from '../navigation/adminNavConfig';
import { ADMIN_TOKENS } from '../theme/adminTokens';
import {
  adminChrome,
  adminRadius,
  adminSpace,
} from '../theme/adminDesignSystem';

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
    <View style={[styles.root, { width, paddingTop: insets.top + 10 }]}>
      <LinearGradient
        colors={['rgba(139,168,196,0.1)', 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0.4 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.brand}>
        <ProDaySymbol size={collapsed ? 28 : 34} variant="admin" tone="white" />
        {!collapsed ? (
          <View style={{ flex: 1, gap: 2 }}>
            <AdminBrandMark compact />
            <AdminText variant="caption" muted numberOfLines={1}>
              Espace fondateur
            </AdminText>
          </View>
        ) : null}
      </View>

      {!collapsed ? (
        <Pressable onPress={onOpenCommand} style={styles.cmd}>
          <Icon name="search" size={14} color={t.signal} />
          <AdminText variant="caption" muted style={{ flex: 1 }}>
            Commande…
          </AdminText>
          <AdminText variant="caption" color={t.signal}>
            ⌘K
          </AdminText>
        </Pressable>
      ) : (
        <Pressable onPress={onOpenCommand} style={styles.cmdIcon}>
          <Icon name="search" size={18} color={t.signal} />
        </Pressable>
      )}

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24, gap: 14 }}
      >
        {ADMIN_NAV_GROUPS.map((group) => {
          const items = ADMIN_NAV_ITEMS.filter((n) => n.group === group.id);
          if (!items.length) return null;
          return (
            <View key={group.id} style={{ gap: 4 }}>
              {!collapsed ? (
                <AdminText
                  variant="label"
                  muted
                  style={{ paddingHorizontal: 12, marginBottom: 2 }}
                >
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
                      active && {
                        backgroundColor: t.signalSoft,
                        borderColor: t.borderStrong,
                      },
                    ]}
                  >
                    <Icon name={item.icon} size={18} color={active ? t.signal : t.muted} />
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
                        <AdminText
                          variant="label"
                          color={t.accentText}
                          style={{ letterSpacing: 0, fontSize: 9 }}
                        >
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
            <AdminText variant="caption" muted>
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
      paddingHorizontal: collapsed ? 10 : 14,
      gap: adminSpace.md,
    },
    brand: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: 4,
      minHeight: 52,
    },
    logo: { width: 38, height: 38 },
    logoSm: { width: 30, height: 30 },
    cmd: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 12,
      paddingVertical: 11,
      borderRadius: adminRadius.md,
      borderWidth: 1,
      borderColor: t.border,
      backgroundColor: t.surfaceGlass,
    },
    cmdIcon: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      borderRadius: adminRadius.md,
      borderWidth: 1,
      borderColor: t.border,
      backgroundColor: t.surfaceGlass,
    },
    item: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 11,
      paddingVertical: 11,
      paddingHorizontal: collapsed ? 12 : 12,
      minHeight: 44,
      borderRadius: adminRadius.md,
      borderWidth: 1,
      borderColor: 'transparent',
      justifyContent: collapsed ? 'center' : 'flex-start',
    },
    badge: {
      minWidth: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: t.accent,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 6,
    },
    collapse: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingVertical: 14,
      paddingBottom: 18,
      justifyContent: collapsed ? 'center' : 'flex-start',
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: t.hairline,
    },
  });
}
