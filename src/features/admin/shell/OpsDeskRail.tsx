import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '../../../components/ui/Icon';
import { ProDaySymbol } from '../../../components/branding/ProDaySymbol';
import { AdminText } from '../ui/adminUi';
import {
  ADMIN_NAV_GROUPS,
  ADMIN_NAV_ITEMS,
  type AdminNavSectionId,
} from '../navigation/adminNavConfig';
import { ADMIN_TOKENS } from '../theme/adminTokens';
import { adminChrome, adminRadius, adminSpace } from '../theme/adminDesignSystem';

type Props = {
  activeId: AdminNavSectionId;
  onSelect: (id: AdminNavSectionId) => void;
  onOpenCommand: () => void;
  /** Compact = icônes seules (mobile). Expanded = labels (tablet+). */
  compact?: boolean;
  queueCount?: number;
};

/**
 * Rail gauche permanent Bureau Ops — remplace sidebar desktop + dock bottom.
 */
export function OpsDeskRail({
  activeId,
  onSelect,
  onOpenCommand,
  compact = false,
  queueCount = 0,
}: Props) {
  const insets = useSafeAreaInsets();
  const t = ADMIN_TOKENS;
  const width = compact ? adminChrome.sidebarCollapsed : adminChrome.sidebarExpanded;
  const styles = useMemo(() => createStyles(compact), [compact]);

  return (
    <View
      style={[
        styles.root,
        {
          width,
          paddingTop: insets.top + 8,
          paddingBottom: Math.max(insets.bottom, 10),
        },
      ]}
    >
      <View style={styles.brand}>
        <ProDaySymbol size={compact ? 26 : 30} variant="admin" tone="white" />
        {!compact ? (
          <View style={{ flex: 1, gap: 2 }}>
            <AdminText variant="brand" color={t.railInk}>
              BUREAU OPS
            </AdminText>
            <AdminText variant="mono" color="rgba(242,245,247,0.45)">
              PRODAY · FND
            </AdminText>
          </View>
        ) : null}
      </View>

      <Pressable
        onPress={onOpenCommand}
        style={compact ? styles.cmdIcon : styles.cmd}
        accessibilityLabel="Ouvrir commande"
      >
        <Icon name="search" size={compact ? 18 : 14} color={t.signal} />
        {!compact ? (
          <>
            <AdminText variant="caption" color="rgba(242,245,247,0.55)" style={{ flex: 1 }}>
              Commande
            </AdminText>
            <AdminText variant="mono" color={t.signal}>
              ⌘K
            </AdminText>
          </>
        ) : null}
      </Pressable>

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 16, gap: 16 }}
      >
        {ADMIN_NAV_GROUPS.map((group) => {
          const items = ADMIN_NAV_ITEMS.filter((n) => n.group === group.id);
          if (!items.length) return null;
          return (
            <View key={group.id} style={{ gap: 3 }}>
              {!compact ? (
                <AdminText
                  variant="label"
                  color="rgba(242,245,247,0.35)"
                  style={{ paddingHorizontal: 10, marginBottom: 4 }}
                >
                  {group.label}
                </AdminText>
              ) : null}
              {items.map((item) => {
                const active = activeId === item.id;
                const badge =
                  item.id === 'file' && queueCount > 0
                    ? queueCount
                    : item.id === 'pulse' && queueCount > 0
                      ? queueCount
                      : 0;
                return (
                  <Pressable
                    key={item.id}
                    onPress={() => onSelect(item.id)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    style={[
                      styles.item,
                      active && {
                        backgroundColor: 'rgba(13,138,138,0.22)',
                        borderColor: t.signal,
                      },
                    ]}
                  >
                    <Icon
                      name={item.icon}
                      size={18}
                      color={active ? t.signal : 'rgba(242,245,247,0.55)'}
                    />
                    {!compact ? (
                      <AdminText
                        variant="nav"
                        color={active ? t.railInk : 'rgba(242,245,247,0.62)'}
                        style={{ flex: 1 }}
                      >
                        {item.label}
                      </AdminText>
                    ) : null}
                    {!compact && badge > 0 && item.id === 'file' ? (
                      <View style={styles.badge}>
                        <AdminText
                          variant="label"
                          color="#fff"
                          style={{ letterSpacing: 0, fontSize: 9 }}
                        >
                          {badge > 99 ? '99+' : String(badge)}
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
    </View>
  );
}

function createStyles(compact?: boolean) {
  const t = ADMIN_TOKENS;
  return StyleSheet.create({
    root: {
      backgroundColor: t.sidebarBg,
      borderRightWidth: 2,
      borderRightColor: t.ink,
      paddingHorizontal: compact ? 8 : 12,
      gap: adminSpace.md,
    },
    brand: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingHorizontal: 4,
      minHeight: 48,
    },
    cmd: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 10,
      paddingVertical: 10,
      borderRadius: adminRadius.sm,
      borderWidth: 1.5,
      borderColor: 'rgba(242,245,247,0.18)',
      backgroundColor: 'rgba(0,0,0,0.25)',
    },
    cmdIcon: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      borderRadius: adminRadius.sm,
      borderWidth: 1.5,
      borderColor: 'rgba(242,245,247,0.18)',
      backgroundColor: 'rgba(0,0,0,0.25)',
    },
    item: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingVertical: 10,
      paddingHorizontal: compact ? 10 : 10,
      minHeight: 42,
      borderRadius: adminRadius.sm,
      borderWidth: 1.5,
      borderColor: 'transparent',
      justifyContent: compact ? 'center' : 'flex-start',
    },
    badge: {
      minWidth: 20,
      height: 20,
      borderRadius: 2,
      backgroundColor: t.danger,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 5,
    },
  });
}
