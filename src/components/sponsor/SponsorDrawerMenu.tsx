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
  SPONSOR_NAV_ITEMS,
  SPONSOR_NAV_SECTIONS,
  isSponsorRouteActive,
  type SponsorContentSegment,
  type SponsorMainTabId,
  type SponsorRoute,
} from '../../navigation/sponsorTabConfig';
import { useSponsorStyles, sponsorChrome } from './sponsorStyles';
import { spacing, radius } from '../../theme/designTokens';

export type SponsorBadgeCounts = {
  messages: number;
  prospects: number;
  offers: number;
};

interface SponsorDrawerMenuProps {
  visible: boolean;
  activeTab: SponsorMainTabId;
  activeSegment?: SponsorContentSegment;
  badges: SponsorBadgeCounts;
  onClose: () => void;
  onNavigate: (route: SponsorRoute) => void;
}

export const SponsorDrawerMenu: React.FC<SponsorDrawerMenuProps> = ({
  visible,
  activeTab,
  activeSegment,
  badges,
  onClose,
  onNavigate,
}) => {
  const insets = useSafeAreaInsets();
  const { colors: c } = useSponsorStyles();
  const styles = useMemo(() => createStyles(), []);

  const handlePick = (route: SponsorRoute) => {
    onNavigate(route);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[styles.panel, { paddingTop: insets.top + spacing.sm }]}
          onPress={() => {}}
          testID="sponsor-drawer"
        >
          <View style={styles.panelHeader}>
            <View style={styles.logoMark}>
              <Icon name="star" size={16} color="#FFFFFF" />
            </View>
            <View style={styles.panelBrand}>
              <Text style={styles.panelTitle}>ProDay Sponsors</Text>
              <Text style={styles.panelSub}>Espace marque & sponsoring</Text>
            </View>
            <PressableSpring onPress={onClose} style={styles.closeBtn} scaleTo={0.92}>
              <Icon name="close" size={20} color={sponsorChrome.textMuted} />
            </PressableSpring>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
            {SPONSOR_NAV_SECTIONS.map((section) => {
              const items = SPONSOR_NAV_ITEMS.filter((i) => i.section === section.id);
              if (items.length === 0) return null;
              return (
                <View key={section.id} style={styles.section}>
                  <Text style={styles.sectionLabel}>{section.label}</Text>
                  {items.map((item) => {
                    const route: SponsorRoute = { tab: item.tab, segment: item.segment };
                    const active = isSponsorRouteActive(route, activeTab, activeSegment);
                    const badge = item.badgeKey ? badges[item.badgeKey] : 0;
                    return (
                      <PressableSpring
                        key={item.id}
                        onPress={() => handlePick(route)}
                        style={[styles.item, active && styles.itemActive]}
                        scaleTo={0.98}
                        haptic
                        testID={`sponsor-drawer-${item.id}`}
                      >
                        <View style={[styles.itemIcon, active && styles.itemIconActive]}>
                          <Icon
                            name={item.icon}
                            size={18}
                            color={active ? c.brandInverse : sponsorChrome.textMuted}
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
                          <Icon name="chevron-forward" size={14} color={sponsorChrome.textMuted} />
                        ) : null}
                      </PressableSpring>
                    );
                  })}
                </View>
              );
            })}
          </ScrollView>

          <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
            <Text style={styles.footerText}>Console sponsor · navigation latérale</Text>
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
      backgroundColor: sponsorChrome.shell,
      borderRightWidth: 1,
      borderRightColor: sponsorChrome.shellBorder,
      flex: 1,
    },
    panelHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: sponsorChrome.shellBorder,
    },
    logoMark: {
      width: 36,
      height: 36,
      borderRadius: radius.md,
      backgroundColor: sponsorChrome.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },
    panelBrand: { flex: 1 },
    panelTitle: { color: sponsorChrome.text, fontSize: 16, fontWeight: '800' },
    panelSub: { color: sponsorChrome.textMuted, fontSize: 11, marginTop: 2 },
    closeBtn: {
      width: 36,
      height: 36,
      borderRadius: radius.md,
      backgroundColor: sponsorChrome.overlay,
      alignItems: 'center',
      justifyContent: 'center',
    },
    scroll: { paddingVertical: spacing.sm, paddingBottom: spacing.xl },
    section: { marginBottom: spacing.md },
    sectionLabel: {
      color: sponsorChrome.textMuted,
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
      backgroundColor: sponsorChrome.overlayStrong,
    },
    itemIcon: {
      width: 34,
      height: 34,
      borderRadius: radius.sm,
      backgroundColor: sponsorChrome.overlay,
      alignItems: 'center',
      justifyContent: 'center',
    },
    itemIconActive: { backgroundColor: sponsorChrome.accent },
    itemCopy: { flex: 1, minWidth: 0 },
    itemLabel: { color: sponsorChrome.text, fontSize: 14, fontWeight: '700' },
    itemLabelActive: { color: sponsorChrome.text },
    itemDesc: { color: sponsorChrome.textMuted, fontSize: 11, marginTop: 1 },
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
      borderTopColor: sponsorChrome.shellBorder,
    },
    footerText: { color: sponsorChrome.textMuted, fontSize: 10, fontWeight: '600' },
  });
}
