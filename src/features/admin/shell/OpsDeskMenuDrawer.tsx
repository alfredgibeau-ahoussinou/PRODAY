import React, { useMemo } from 'react';
import { Modal, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '../../../components/ui/Icon';
import { AdminAppearanceSelector, AdminText } from '../ui/adminUi';
import {
  ADMIN_NAV_GROUPS,
  ADMIN_NAV_ITEMS,
  type AdminNavSectionId,
} from '../navigation/adminNavConfig';
import { useAdminTokens, ADMIN_TOKENS } from '../theme/adminTokens';
import { adminRadius, adminSpace } from '../theme/adminDesignSystem';

type Props = {
  open: boolean;
  activeId: AdminNavSectionId;
  onSelect: (id: AdminNavSectionId) => void;
  onClose: () => void;
  /** Déconnexion Auth réelle (bas de menu). */
  onSignOut?: () => void;
  /** Safe-area top (notch / Dynamic Island) — fourni par le shell. */
  topInset?: number;
  queueCount?: number;
  claimsCount?: number;
  membershipsCount?: number;
  verificationsCount?: number;
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
 * Menu principal Espace Admin — sheet scrollable avec labels groupés.
 * Remplace le rail d’icônes mystérieux sur mobile.
 */
export function OpsDeskMenuDrawer({
  open,
  activeId,
  onSelect,
  onClose,
  onSignOut,
  topInset,
  queueCount = 0,
  claimsCount = 0,
  membershipsCount = 0,
  verificationsCount = 0,
}: Props) {
  const insets = useSafeAreaInsets();
  const minIos = Platform.OS === 'ios' ? 52 : 0;
  const resolvedTop = Math.max(topInset ?? 0, insets.top, minIos);
  const t = useAdminTokens();
  const counts = useMemo(
    () => ({
      queue: queueCount,
      claims: claimsCount,
      memberships: membershipsCount,
      verifications: verificationsCount,
    }),
    [queueCount, claimsCount, membershipsCount, verificationsCount],
  );

  return (
    <Modal
      visible={open}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View
        style={[
          styles.drawer,
          {
            paddingTop: resolvedTop + 12,
            paddingBottom: Math.max(insets.bottom, 16),
          },
        ]}
        testID="admin-menu-drawer"
      >
        <View style={styles.drawerHead}>
          <View style={{ flex: 1, gap: 2 }}>
            <AdminText variant="h1" color={t.foreground}>
              Menu
            </AdminText>
            <AdminText variant="caption" color={t.muted}>
              {ADMIN_NAV_ITEMS.length} pages · groupées par capacité
            </AdminText>
          </View>
          <Pressable
            onPress={onClose}
            hitSlop={8}
            accessibilityLabel="Fermer le menu"
            style={styles.closeBtn}
          >
            <Icon name="close" size={22} color={t.muted} />
          </Pressable>
        </View>

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
                        onPress={() => {
                          onSelect(item.id);
                          onClose();
                        }}
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
                        <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
                          <AdminText
                            variant="nav"
                            color={active ? t.railInk : 'rgba(244,246,248,0.85)'}
                            style={{ fontWeight: active ? '700' : '500' }}
                            numberOfLines={1}
                          >
                            {item.label}
                          </AdminText>
                          {item.hint ? (
                            <AdminText variant="mono" color={t.faint} numberOfLines={1}>
                              {item.hint}
                            </AdminText>
                          ) : null}
                        </View>
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

            <View style={{ marginTop: 8 }}>
              <AdminAppearanceSelector compact />
            </View>

            {onSignOut ? (
              <View style={styles.accountGroup}>
                <Pressable
                  onPress={() => {
                    onClose();
                    onSignOut();
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Déconnexion"
                  testID="admin-sign-out"
                  style={styles.signOutItem}
                >
                  <Icon name="log-out" size={18} color={t.danger} />
                  <AdminText variant="nav" color={t.danger} style={{ flex: 1, fontWeight: '600' }}>
                    Déconnexion
                  </AdminText>
                </Pressable>
              </View>
            ) : null}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  drawer: {
    flex: 1,
    backgroundColor: ADMIN_TOKENS.bg,
  },
  drawerHead: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: adminSpace.md,
    gap: 12,
  },
  closeBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: adminRadius.sm,
    borderWidth: 1,
    borderColor: ADMIN_TOKENS.border,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    gap: 18,
  },
  group: {
    gap: 4,
  },
  groupLabel: {
    paddingHorizontal: 10,
    marginBottom: 6,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    minHeight: 48,
    borderRadius: adminRadius.sm,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 4,
    backgroundColor: ADMIN_TOKENS.signal,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  accountGroup: {
    gap: 4,
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(244,246,248,0.12)',
  },
  signOutItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 12,
    minHeight: 52,
    borderRadius: adminRadius.sm,
    borderWidth: 1,
    borderColor: 'rgba(248,113,113,0.28)',
    backgroundColor: 'rgba(248,113,113,0.08)',
  },
});
