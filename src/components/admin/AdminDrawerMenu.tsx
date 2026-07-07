import React, { useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PressableSpring } from '../motion';
import { Icon } from '../ui/Icon';
import {
  ADMIN_NAV_ITEMS,
  ADMIN_NAV_SECTIONS,
  isAdminRouteActive,
  type AdminContentSegment,
  type AdminMainTabId,
  type AdminRoute,
} from '../../navigation/adminTabConfig';
import { useAdminStyles, adminChrome } from './adminStyles';
import { spacing, radius } from '../../theme/designTokens';

export type AdminBadgeCounts = {
  inbox: number;
  verifications: number;
  moderation: number;
  reels: number;
  reports: number;
};

interface AdminDrawerMenuProps {
  visible: boolean;
  activeTab: AdminMainTabId;
  activeSegment?: AdminContentSegment;
  badges: AdminBadgeCounts;
  onClose: () => void;
  onNavigate: (route: AdminRoute) => void;
}

export const AdminDrawerMenu: React.FC<AdminDrawerMenuProps> = ({
  visible,
  activeTab,
  activeSegment,
  badges,
  onClose,
  onNavigate,
}) => {
  const insets = useSafeAreaInsets();
  const { colors: c } = useAdminStyles();
  const styles = useMemo(() => createStyles(), []);

  const handlePick = (route: AdminRoute) => {
    onNavigate(route);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={[styles.panel, { paddingTop: insets.top + spacing.sm }]} onPress={() => {}}>
          <View style={styles.panelHeader}>
            <View style={styles.logoMark}>
              <Icon name="shield" size={16} color="#FFFFFF" />
            </View>
            <View style={styles.panelBrand}>
              <Text style={styles.panelTitle}>ProDay Console</Text>
              <Text style={styles.panelSub}>6 pôles · proday75.fr · ops plateforme</Text>
            </View>
            <PressableSpring onPress={onClose} style={styles.closeBtn} scaleTo={0.92}>
              <Icon name="close" size={20} color={adminChrome.textMuted} />
            </PressableSpring>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
            {ADMIN_NAV_SECTIONS.map((section) => {
              const items = ADMIN_NAV_ITEMS.filter((i) => i.section === section.id);
              if (items.length === 0) return null;
              return (
                <View key={section.id} style={styles.section}>
                  <Text style={styles.sectionLabel}>{section.label}</Text>
                  {items.map((item) => {
                    const route: AdminRoute = { tab: item.tab, segment: item.segment };
                    const active = isAdminRouteActive(route, activeTab, activeSegment);
                    const badge = item.badgeKey ? badges[item.badgeKey] : 0;
                    return (
                      <PressableSpring
                        key={item.id}
                        onPress={() => handlePick(route)}
                        style={[styles.item, active && styles.itemActive]}
                        scaleTo={0.98}
                        haptic
                      >
                        <View style={[styles.itemIcon, active && styles.itemIconActive]}>
                          <Icon
                            name={item.icon}
                            size={18}
                            color={active ? c.brandInverse : adminChrome.textMuted}
                          />
                        </View>
                        <View style={styles.itemCopy}>
                          <Text style={[styles.itemLabel, active && styles.itemLabelActive]}>
                            {item.label}
                          </Text>
                          <Text style={styles.itemDesc} numberOfLines={1}>
                            {item.description}
                          </Text>
                        </View>
                        {badge > 0 ? (
                          <View style={styles.badge}>
                            <Text style={styles.badgeText}>{badge > 9 ? '9+' : badge}</Text>
                          </View>
                        ) : active ? (
                          <Icon name="chevron-forward" size={14} color={adminChrome.textMuted} />
                        ) : null}
                      </PressableSpring>
                    );
                  })}
                </View>
              );
            })}
          </ScrollView>

          <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
            <Text style={styles.footerText}>Navigation · {ADMIN_NAV_ITEMS.length} sections</Text>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

function createStyles() {
  return StyleSheet.create({
    backdrop: {
      flex: 1,
      flexDirection: 'row',
      backgroundColor: 'rgba(0,0,0,0.55)',
    },
    panel: {
      width: '86%',
      maxWidth: 340,
      backgroundColor: adminChrome.shell,
      borderRightWidth: 1,
      borderRightColor: adminChrome.shellBorder,
      flex: 1,
    },
    panelHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: adminChrome.shellBorder,
    },
    logoMark: {
      width: 36,
      height: 36,
      borderRadius: radius.md,
      backgroundColor: adminChrome.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },
    panelBrand: { flex: 1 },
    panelTitle: { color: adminChrome.text, fontSize: 16, fontWeight: '800' },
    panelSub: { color: adminChrome.textMuted, fontSize: 11, marginTop: 2 },
    closeBtn: {
      width: 36,
      height: 36,
      borderRadius: radius.md,
      backgroundColor: adminChrome.overlay,
      alignItems: 'center',
      justifyContent: 'center',
    },
    scroll: { paddingVertical: spacing.sm, paddingBottom: spacing.xl },
    section: { marginBottom: spacing.md },
    sectionLabel: {
      color: adminChrome.textMuted,
      fontSize: 10,
      fontWeight: '700',
      letterSpacing: 1.2,
      textTransform: 'uppercase',
      paddingHorizontal: spacing.lg,
      marginBottom: spacing.xs,
      marginTop: spacing.xs,
    },
    item: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginHorizontal: spacing.sm,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.sm + 2,
      borderRadius: radius.md,
    },
    itemActive: {
      backgroundColor: adminChrome.overlayStrong,
    },
    itemIcon: {
      width: 34,
      height: 34,
      borderRadius: radius.sm,
      backgroundColor: adminChrome.overlay,
      alignItems: 'center',
      justifyContent: 'center',
    },
    itemIconActive: { backgroundColor: adminChrome.accent },
    itemCopy: { flex: 1, minWidth: 0 },
    itemLabel: { color: adminChrome.text, fontSize: 14, fontWeight: '700' },
    itemLabelActive: { color: adminChrome.text },
    itemDesc: { color: adminChrome.textMuted, fontSize: 11, marginTop: 1 },
    badge: {
      minWidth: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: '#EF4444',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 5,
    },
    badgeText: { color: '#FFF', fontSize: 10, fontWeight: '800' },
    footer: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.sm,
      borderTopWidth: 1,
      borderTopColor: adminChrome.shellBorder,
    },
    footerText: { color: adminChrome.textMuted, fontSize: 10, fontWeight: '600' },
  });
}
