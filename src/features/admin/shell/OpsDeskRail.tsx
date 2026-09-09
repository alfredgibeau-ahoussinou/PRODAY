import React, { useMemo } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
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
  /** Compact = mobile drawer trigger + icons rail. Expanded = labels. */
  compact?: boolean;
  queueCount?: number;
  claimsCount?: number;
  membershipsCount?: number;
  verificationsCount?: number;
  menuOpen?: boolean;
  onMenuOpenChange?: (open: boolean) => void;
};

function badgeFor(
  itemId: string,
  badgeKey: string | undefined,
  counts: {
    queue: number;
    claims: number;
    memberships: number;
    verifications: number;
  },
): number {
  if (!badgeKey) return 0;
  if (badgeKey === 'queue') return counts.queue;
  if (badgeKey === 'claims') return counts.claims;
  if (badgeKey === 'memberships') return counts.memberships;
  if (badgeKey === 'verifications') return counts.verifications;
  return 0;
}

/**
 * Menu riche Espace Admin — scroll OK, 30+ pages.
 */
export function OpsDeskRail({
  activeId,
  onSelect,
  onOpenCommand,
  compact = false,
  queueCount = 0,
  claimsCount = 0,
  membershipsCount = 0,
  verificationsCount = 0,
  menuOpen = false,
  onMenuOpenChange,
}: Props) {
  const insets = useSafeAreaInsets();
  const t = ADMIN_TOKENS;
  const width = compact ? adminChrome.sidebarCollapsed : adminChrome.sidebarExpanded;
  const styles = useMemo(() => createStyles(compact), [compact]);
  const counts = {
    queue: queueCount,
    claims: claimsCount,
    memberships: membershipsCount,
    verifications: verificationsCount,
  };

  const renderNav = (showLabels: boolean) => (
    <>
      {ADMIN_NAV_GROUPS.map((group) => {
        const items = ADMIN_NAV_ITEMS.filter((n) => n.group === group.id);
        if (!items.length) return null;
        return (
          <View key={group.id} style={{ gap: 3 }}>
            {showLabels ? (
              <AdminText
                variant="label"
                color="rgba(244,246,248,0.35)"
                style={{ paddingHorizontal: 10, marginBottom: 4 }}
              >
                {group.label}
              </AdminText>
            ) : null}
            {items.map((item) => {
              const active = activeId === item.id;
              const badge = badgeFor(item.id, item.badgeKey, counts);
              return (
                <Pressable
                  key={item.id}
                  onPress={() => {
                    onSelect(item.id);
                    onMenuOpenChange?.(false);
                  }}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  testID={`admin-nav-${item.id}`}
                  style={[
                    styles.item,
                    active && {
                      backgroundColor: 'rgba(232,184,74,0.16)',
                      borderColor: t.signal,
                    },
                  ]}
                >
                  <Icon
                    name={item.icon}
                    size={18}
                    color={active ? t.signal : 'rgba(244,246,248,0.55)'}
                  />
                  {showLabels ? (
                    <AdminText
                      variant="nav"
                      color={active ? t.railInk : 'rgba(244,246,248,0.68)'}
                      style={{ flex: 1 }}
                      numberOfLines={1}
                    >
                      {item.label}
                    </AdminText>
                  ) : null}
                  {showLabels && badge > 0 ? (
                    <View style={styles.badge}>
                      <AdminText
                        variant="label"
                        color="#0B0D12"
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
    </>
  );

  return (
    <>
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
                ESPACE ADMIN
              </AdminText>
              <AdminText variant="mono" color="rgba(244,246,248,0.4)">
                PRODAY · CONTROL
              </AdminText>
            </View>
          ) : null}
        </View>

        {compact ? (
          <Pressable
            onPress={() => onMenuOpenChange?.(true)}
            style={styles.cmdIcon}
            accessibilityLabel="Ouvrir le menu"
            testID="admin-menu-open"
          >
            <Icon name="menu" size={18} color={t.signal} />
          </Pressable>
        ) : null}

        <Pressable
          onPress={onOpenCommand}
          style={compact ? styles.cmdIcon : styles.cmd}
          accessibilityLabel="Ouvrir commande"
        >
          <Icon name="search" size={compact ? 18 : 14} color={t.signal} />
          {!compact ? (
            <>
              <AdminText variant="caption" color="rgba(244,246,248,0.55)" style={{ flex: 1 }}>
                Commande
              </AdminText>
              <AdminText variant="mono" color={t.signal}>
                ⌘K
              </AdminText>
            </>
          ) : null}
        </Pressable>

        {!compact ? (
          <ScrollView
            style={{ flex: 1 }}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 16, gap: 16 }}
          >
            {renderNav(true)}
          </ScrollView>
        ) : (
          <ScrollView
            style={{ flex: 1 }}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 16, gap: 4 }}
          >
            {ADMIN_NAV_ITEMS.slice(0, 12).map((item) => {
              const active = activeId === item.id;
              return (
                <Pressable
                  key={item.id}
                  onPress={() => onSelect(item.id)}
                  style={[
                    styles.item,
                    active && {
                      backgroundColor: 'rgba(232,184,74,0.16)',
                      borderColor: t.signal,
                    },
                  ]}
                >
                  <Icon
                    name={item.icon}
                    size={18}
                    color={active ? t.signal : 'rgba(244,246,248,0.55)'}
                  />
                </Pressable>
              );
            })}
            <Pressable onPress={() => onMenuOpenChange?.(true)} style={styles.item}>
              <Icon name="grid" size={18} color={t.signal} />
            </Pressable>
          </ScrollView>
        )}
      </View>

      <Modal
        visible={!!menuOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => onMenuOpenChange?.(false)}
      >
        <View
          style={[
            styles.drawer,
            { paddingTop: insets.top + 12, paddingBottom: Math.max(insets.bottom, 16) },
          ]}
        >
          <View style={styles.drawerHead}>
            <AdminText variant="h1" color={t.foreground}>
              Menu admin
            </AdminText>
            <Pressable onPress={() => onMenuOpenChange?.(false)} hitSlop={8}>
              <Icon name="close" size={22} color={t.muted} />
            </Pressable>
          </View>
          <AdminText variant="caption" color={t.muted} style={{ paddingHorizontal: 16 }}>
            {ADMIN_NAV_ITEMS.length} pages · défilez librement
          </AdminText>
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 40 }}
          >
            {renderNav(true)}
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}

function createStyles(compact?: boolean) {
  const t = ADMIN_TOKENS;
  return StyleSheet.create({
    root: {
      backgroundColor: t.sidebarBg,
      borderRightWidth: 1,
      borderRightColor: t.borderStrong,
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
      borderWidth: 1,
      borderColor: 'rgba(244,246,248,0.14)',
      backgroundColor: 'rgba(255,255,255,0.04)',
    },
    cmdIcon: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      borderRadius: adminRadius.sm,
      borderWidth: 1,
      borderColor: 'rgba(244,246,248,0.14)',
      backgroundColor: 'rgba(255,255,255,0.04)',
    },
    item: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingVertical: 10,
      paddingHorizontal: compact ? 10 : 10,
      minHeight: 42,
      borderRadius: adminRadius.sm,
      borderWidth: 1,
      borderColor: 'transparent',
      justifyContent: compact ? 'center' : 'flex-start',
    },
    badge: {
      minWidth: 20,
      height: 20,
      borderRadius: 4,
      backgroundColor: t.signal,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 5,
    },
    drawer: {
      flex: 1,
      backgroundColor: t.bg,
    },
    drawerHead: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      marginBottom: 4,
    },
  });
}
