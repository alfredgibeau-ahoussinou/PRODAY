import React, { useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PressableSpring } from '../motion';
import { Icon } from '../ui/Icon';
import { ProDaySymbol } from '../branding/ProDaySymbol';
import {
  SPONSOR_NAV_ITEMS,
  SPONSOR_NAV_SECTIONS,
  isSponsorRouteActive,
  type SponsorContentSegment,
  type SponsorMainTabId,
  type SponsorRoute,
} from '../../navigation/sponsorTabConfig';
import { sponsorChrome } from './sponsorStyles';
import { SPONSOR_THEME } from '../../content/sponsorExperience';
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
              <ProDaySymbol size={36} variant="sponsor" tone="white" />
            </View>
            <View style={styles.panelBrand}>
              <Text style={styles.panelTitle}>ProDay Sponsor</Text>
              <Text style={styles.panelSub}>Marque · clubs · ROI</Text>
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
                            color={active ? SPONSOR_THEME.onPrimary : SPONSOR_THEME.textMuted}
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
                        ) : null}
                      </PressableSpring>
                    );
                  })}
                </View>
              );
            })}
          </ScrollView>

          <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
            <Text style={styles.footerText}>Espace Sponsor</Text>
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
      backgroundColor: 'rgba(0,0,0,0.72)',
    },
    panel: {
      width: '86%',
      maxWidth: 340,
      backgroundColor: SPONSOR_THEME.background,
      borderRightWidth: StyleSheet.hairlineWidth,
      borderRightColor: SPONSOR_THEME.borderSubtle,
      flex: 1,
    },
    panelHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: SPONSOR_THEME.borderSubtle,
    },
    logoMark: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: SPONSOR_THEME.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: SPONSOR_THEME.border,
      overflow: 'hidden',
    },
    panelBrand: { flex: 1 },
    panelTitle: { color: SPONSOR_THEME.text, fontSize: 16, fontWeight: '800' },
    panelSub: { color: SPONSOR_THEME.textMuted, fontSize: 11, marginTop: 2 },
    closeBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: SPONSOR_THEME.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    scroll: { paddingVertical: spacing.sm, paddingBottom: spacing.xl },
    section: { marginBottom: spacing.md },
    sectionLabel: {
      color: SPONSOR_THEME.sectionLabel,
      fontSize: 10,
      fontWeight: '700',
      letterSpacing: 1.4,
      textTransform: 'uppercase',
      paddingHorizontal: spacing.lg,
      marginBottom: spacing.xs,
      marginTop: spacing.xs,
      ...Platform.select({ android: { includeFontPadding: false } }),
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
      backgroundColor: SPONSOR_THEME.primarySoft,
    },
    itemIcon: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: SPONSOR_THEME.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    itemIconActive: { backgroundColor: SPONSOR_THEME.primary },
    itemCopy: { flex: 1, minWidth: 0 },
    itemLabel: { color: SPONSOR_THEME.text, fontSize: 14, fontWeight: '700' },
    itemLabelActive: { color: SPONSOR_THEME.text },
    itemDesc: { color: SPONSOR_THEME.textMuted, fontSize: 11, marginTop: 1 },
    badge: {
      minWidth: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: SPONSOR_THEME.primary,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 5,
    },
    badgeText: { color: SPONSOR_THEME.onPrimary, fontSize: 10, fontWeight: '800' },
    footer: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.sm,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: SPONSOR_THEME.borderSubtle,
    },
    footerText: { color: SPONSOR_THEME.textMuted, fontSize: 10, fontWeight: '600' },
  });
}
