import React, { useMemo } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '../../ui/Icon';
import {
  ADMIN_FOC_NAV,
  ADMIN_FOC_SIDEBAR_COLLAPSED,
  ADMIN_FOC_SIDEBAR_WIDTH,
  type AdminFocNavItem,
  type AdminFocSectionId,
} from '../../../navigation/adminFocConfig';
import { adminChrome, adminType, ADMIN_ON_ACCENT } from '../../../theme/adminTheme';
import { spacing } from '../../../theme/designTokens';

type Props = {
  collapsed: boolean;
  activeSection: AdminFocSectionId;
  sectionOrder: AdminFocSectionId[];
  hiddenSections: AdminFocSectionId[];
  primaryColor?: string;
  badges?: Partial<Record<AdminFocSectionId, number>>;
  clubDisplayName?: string;
  footerLabel?: string;
  onToggleCollapse: () => void;
  onSelectSection: (section: AdminFocSectionId) => void;
};

/**
 * Rail latéral FOC — cockpit ops sombre, marque ProDay, rail actif signal.
 */
export function AdminFocSidebar({
  collapsed,
  activeSection,
  sectionOrder,
  hiddenSections,
  primaryColor,
  badges = {},
  clubDisplayName,
  footerLabel,
  onToggleCollapse,
  onSelectSection,
}: Props) {
  const insets = useSafeAreaInsets();
  const accent = primaryColor ?? adminChrome.accent;
  const styles = useMemo(() => createStyles(), []);

  const items = useMemo(() => {
    const map = new Map(ADMIN_FOC_NAV.map((n) => [n.id, n]));
    const ordered: AdminFocNavItem[] = [];
    for (const id of sectionOrder) {
      const item = map.get(id);
      if (item && !hiddenSections.includes(id)) ordered.push(item);
    }
    for (const item of ADMIN_FOC_NAV) {
      if (!ordered.some((o) => o.id === item.id) && !hiddenSections.includes(item.id)) {
        ordered.push(item);
      }
    }
    return ordered;
  }, [sectionOrder, hiddenSections]);

  const width = collapsed ? ADMIN_FOC_SIDEBAR_COLLAPSED : ADMIN_FOC_SIDEBAR_WIDTH;

  return (
    <View style={[styles.root, { width, paddingTop: insets.top + 10 }]}>
      <LinearGradient
        colors={[adminChrome.atmosphereTop, adminChrome.shell, adminChrome.rail]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFillObject}
        pointerEvents="none"
      />
      <View style={[styles.signalEdge, { backgroundColor: accent }]} />

      <View style={[styles.brand, collapsed && styles.brandCollapsed]}>
        {collapsed ? (
          <View style={[styles.markBox, { backgroundColor: accent }]}>
            <Text style={styles.mark}>PD</Text>
          </View>
        ) : (
          <>
            <View style={styles.brandRow}>
              <Text style={[styles.brandTitle, { color: accent }]}>ProDay</Text>
              <View style={[styles.opsPill, { borderColor: accent }]}>
                <Text style={[styles.opsText, { color: accent }]}>OPS</Text>
              </View>
            </View>
            <Text style={styles.brandSub} numberOfLines={1}>
              {clubDisplayName || 'Centre d’ops'}
            </Text>
          </>
        )}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollInner}
        showsVerticalScrollIndicator={false}
      >
        {items.map((item) => {
          const on = item.id === activeSection;
          const badge = badges[item.id] ?? 0;
          return (
            <Pressable
              key={item.id}
              onPress={() => onSelectSection(item.id)}
              style={[styles.item, on && styles.itemOn]}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              accessibilityLabel={item.label}
              hitSlop={4}
            >
              {on ? <View style={[styles.activeRail, { backgroundColor: accent }]} /> : null}
              <View
                style={[
                  styles.iconBox,
                  on && { backgroundColor: adminChrome.overlayStrong, borderColor: accent },
                ]}
              >
                <Icon
                  name={item.icon}
                  size={17}
                  color={on ? accent : adminChrome.textMuted}
                />
              </View>
              {!collapsed ? (
                <Text style={[styles.label, on && { color: accent }]} numberOfLines={1}>
                  {item.label}
                </Text>
              ) : null}
              {!collapsed && badge > 0 ? (
                <View style={[styles.badge, { backgroundColor: accent }]}>
                  <Text style={styles.badgeText}>{badge > 99 ? '99+' : badge}</Text>
                </View>
              ) : null}
              {collapsed && badge > 0 ? (
                <View style={[styles.dot, { backgroundColor: accent }]} />
              ) : null}
            </Pressable>
          );
        })}
      </ScrollView>

      <Pressable
        onPress={onToggleCollapse}
        style={[styles.collapse, { paddingBottom: Math.max(insets.bottom, 14) }]}
        accessibilityLabel={collapsed ? 'Agrandir le menu' : 'Réduire le menu'}
      >
        <Icon
          name={collapsed ? 'chevron-forward' : 'arrow-back'}
          size={15}
          color={adminChrome.textMuted}
        />
        {!collapsed ? (
          <Text style={styles.collapseText}>{footerLabel ?? 'Réduire'}</Text>
        ) : null}
      </Pressable>
    </View>
  );
}

function createStyles() {
  return StyleSheet.create({
    root: {
      flex: 1,
      maxWidth: ADMIN_FOC_SIDEBAR_WIDTH,
      backgroundColor: adminChrome.shell,
      borderRightWidth: StyleSheet.hairlineWidth,
      borderRightColor: adminChrome.shellBorder,
      overflow: 'hidden',
    },
    signalEdge: {
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      width: 2,
      opacity: 0.9,
    },
    brand: {
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: adminChrome.shellBorder,
      minHeight: 68,
      justifyContent: 'center',
      gap: 4,
    },
    brandCollapsed: {
      alignItems: 'center',
      paddingHorizontal: 8,
    },
    brandRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    markBox: {
      width: 36,
      height: 36,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    mark: {
      color: ADMIN_ON_ACCENT,
      fontFamily: adminType.display,
      fontWeight: '800',
      fontSize: 13,
      letterSpacing: 0.5,
    },
    brandTitle: {
      fontFamily: adminType.display,
      fontWeight: '800',
      fontSize: 22,
      letterSpacing: -0.6,
      lineHeight: 26,
    },
    opsPill: {
      paddingHorizontal: 7,
      paddingVertical: 3,
      borderRadius: 6,
      borderWidth: StyleSheet.hairlineWidth,
      backgroundColor: adminChrome.overlay,
    },
    opsText: {
      fontFamily: adminType.bodyExtra,
      fontSize: 9,
      fontWeight: '800',
      letterSpacing: 1.4,
    },
    brandSub: {
      color: adminChrome.textMuted,
      fontFamily: adminType.bodySemi,
      fontSize: 12,
      fontWeight: '600',
    },
    scroll: { flex: 1 },
    scrollInner: { paddingVertical: 10, paddingHorizontal: 8, gap: 3 },
    item: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingVertical: 10,
      paddingHorizontal: 10,
      borderRadius: adminChrome.radiusSm,
      minHeight: 44,
      overflow: 'hidden',
    },
    itemOn: {
      backgroundColor: adminChrome.rowActive,
    },
    activeRail: {
      position: 'absolute',
      left: 0,
      top: 8,
      bottom: 8,
      width: adminChrome.railWidth,
      borderRadius: 2,
    },
    iconBox: {
      width: 32,
      height: 32,
      borderRadius: 9,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: adminChrome.shellElevated,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: adminChrome.shellBorder,
    },
    label: {
      flex: 1,
      color: adminChrome.textSecondary,
      fontFamily: adminType.bodyBold,
      fontSize: 13,
      fontWeight: '700',
      letterSpacing: -0.1,
    },
    badge: {
      minWidth: 20,
      height: 20,
      borderRadius: 6,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 5,
    },
    badgeText: {
      color: ADMIN_ON_ACCENT,
      fontFamily: adminType.bodyExtra,
      fontSize: 10,
      fontWeight: '800',
    },
    dot: {
      position: 'absolute',
      top: 8,
      right: 10,
      width: 7,
      height: 7,
      borderRadius: 4,
    },
    collapse: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: spacing.md,
      paddingTop: spacing.sm,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: adminChrome.shellBorder,
      minHeight: 48,
      backgroundColor: adminChrome.rail,
    },
    collapseText: {
      color: adminChrome.textMuted,
      fontFamily: adminType.bodySemi,
      fontSize: 12,
      fontWeight: '600',
    },
  });
}
