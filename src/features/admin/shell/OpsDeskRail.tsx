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
import { useAdminTokens, type AdminThemeTokens } from '../theme/adminTokens';
import { adminChrome, adminRadius, adminSpace } from '../theme/adminDesignSystem';

type Props = {
  activeId: AdminNavSectionId;
  onSelect: (id: AdminNavSectionId) => void;
  onOpenCommand: () => void;
  /** Déconnexion Auth réelle (bas du rail). */
  onSignOut?: () => void;
  queueCount?: number;
  claimsCount?: number;
  membershipsCount?: number;
  verificationsCount?: number;
  /** Safe-area top (notch / Dynamic Island) — fourni par le shell. */
  topInset?: number;
};

function badgeFor(
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
 * Rail latéral tablette+ uniquement — labels textuels groupés.
 * Sur mobile le menu est un drawer (OpsDeskMenuDrawer), pas ce rail.
 */
export function OpsDeskRail({
  activeId,
  onSelect,
  onOpenCommand,
  onSignOut,
  queueCount = 0,
  claimsCount = 0,
  membershipsCount = 0,
  verificationsCount = 0,
  topInset,
}: Props) {
  const insets = useSafeAreaInsets();
  const resolvedTop = Math.max(topInset ?? 0, insets.top);
  const t = useAdminTokens();
  const styles = useMemo(() => createStyles(t), [t]);
  const counts = {
    queue: queueCount,
    claims: claimsCount,
    memberships: membershipsCount,
    verifications: verificationsCount,
  };

  return (
    <View
      style={[
        styles.root,
        {
          width: adminChrome.sidebarExpanded,
          paddingTop: resolvedTop + adminSpace.sm,
          paddingBottom: Math.max(insets.bottom, adminSpace.sm),
        },
      ]}
      testID="admin-sidebar-rail"
    >
      <View style={styles.brand}>
        <ProDaySymbol size={30} variant="admin" tone="white" />
        <View style={{ flex: 1, gap: 2 }}>
          <AdminText variant="brand" color={t.railInk}>
            ESPACE ADMIN
          </AdminText>
          <AdminText variant="mono" color="rgba(244,246,248,0.4)">
            PRODAY · CONTROL
          </AdminText>
        </View>
      </View>

      <Pressable
        onPress={onOpenCommand}
        style={styles.cmd}
        accessibilityLabel="Recherche commande"
      >
        <Icon name="search" size={16} color={t.signal} />
        <AdminText variant="caption" color="rgba(244,246,248,0.7)" style={{ flex: 1 }}>
          Recherche · ⌘K
        </AdminText>
        <View style={styles.cmdKey}>
          <AdminText variant="mono" color={t.signal} style={{ fontSize: 9 }}>
            TAB
          </AdminText>
        </View>
      </Pressable>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      >
        {ADMIN_NAV_GROUPS.map((group) => {
          const items = ADMIN_NAV_ITEMS.filter((n) => n.group === group.id);
          if (!items.length) return null;
          return (
            <View key={group.id} style={styles.group}>
              <AdminText
                variant="label"
                color="rgba(244,246,248,0.4)"
                style={styles.groupLabel}
              >
                {group.label}
              </AdminText>
              {items.map((item) => {
                const active = activeId === item.id;
                const badge = badgeFor(item.badgeKey, counts);
                return (
                  <Pressable
                    key={item.id}
                    onPress={() => onSelect(item.id)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    testID={`admin-nav-${item.id}`}
                    style={[
                      styles.item,
                      active && {
                        backgroundColor: t.accentSoft,
                        borderColor: t.accentHot,
                      },
                    ]}
                  >
                    <Icon
                      name={item.icon}
                      size={18}
                      color={active ? t.signal : 'rgba(244,246,248,0.55)'}
                    />
                    <AdminText
                      variant="nav"
                      color={active ? t.railInk : 'rgba(244,246,248,0.85)'}
                      style={{ flex: 1, fontWeight: active ? '700' : '500' }}
                      numberOfLines={1}
                    >
                      {item.label}
                    </AdminText>
                    {badge > 0 ? (
                      <View style={styles.badge}>
                        <AdminText
                          variant="label"
                          color="#FFFFFF"
                          style={{ letterSpacing: 0, fontSize: 9, fontWeight: '800' }}
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

      {onSignOut ? (
        <Pressable
          onPress={onSignOut}
          style={styles.signOut}
          accessibilityRole="button"
          accessibilityLabel="Déconnexion"
          testID="admin-sign-out"
        >
          <Icon name="log-out" size={18} color={t.danger} />
          <AdminText variant="nav" color={t.danger} style={{ flex: 1, fontWeight: '600' }}>
            Déconnexion
          </AdminText>
        </Pressable>
      ) : null}
    </View>
  );
}

function createStyles(t: AdminThemeTokens) {
  return StyleSheet.create({
    root: {
      backgroundColor: t.sidebarBg,
      borderRightWidth: 1,
      borderRightColor: t.borderStrong,
      paddingHorizontal: 12,
      gap: adminSpace.md,
      ...(t.glassBackdrop as any),
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
      borderColor: t.border,
      backgroundColor: 'rgba(255,255,255,0.04)',
    },
    cmdKey: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: adminRadius.xs,
      backgroundColor: 'rgba(0,0,0,0.4)',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: t.border,
    },
    list: {
      gap: 14,
      paddingBottom: 24,
    },
    group: {
      gap: 2,
    },
    groupLabel: {
      paddingHorizontal: 8,
      marginBottom: 4,
      letterSpacing: 1.2,
      fontSize: 10,
    },
    item: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingVertical: 9,
      paddingHorizontal: 10,
      minHeight: 38,
      borderRadius: adminRadius.sm,
      borderWidth: 1,
      borderColor: 'transparent',
    },
    badge: {
      minWidth: 20,
      height: 20,
      borderRadius: adminRadius.pill,
      backgroundColor: t.signal,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 6,
    },
    signOut: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingVertical: 10,
      paddingHorizontal: 10,
      minHeight: 40,
      borderRadius: adminRadius.sm,
      borderWidth: 1,
      borderColor: t.dangerSoft,
      backgroundColor: t.dangerSoft,
    },
  });
}
