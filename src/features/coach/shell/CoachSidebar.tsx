import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CoachText } from '../../../components/coach/coachPortalUi';
import { Icon } from '../../../components/ui/Icon';
import { PressableSpring } from '../../../components/motion';
import { useCoachTheme } from './CoachThemeContext';
import type { CoachThemeTokens } from '../../../utils/coachTeamTheme';
import { primaryTabForCoachNav, type CoachNavItemId } from '../navigation/coachNavConfig';
import type { CoachNavResolvedFolder, CoachNavResolvedItem } from '../navigation/resolveCoachNavAccess';
import { coachChrome } from '../theme/coachDesignSystem';
import { radius, spacing } from '../../../theme/designTokens';

type Props = {
  activeId: CoachNavItemId;
  coachName: string;
  formulaLabel: string;
  folders: CoachNavResolvedFolder[];
  onSelect: (id: CoachNavItemId) => void;
  onOpenHelp: () => void;
  onSignOut: () => void;
  width?: number;
  inDrawer?: boolean;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
};

export function CoachSidebar({
  activeId,
  coachName,
  formulaLabel,
  folders,
  onSelect,
  onOpenHelp,
  onSignOut,
  width = coachChrome.sidebarExpanded,
  inDrawer = false,
  collapsed = false,
  onToggleCollapse,
}: Props) {
  const insets = useSafeAreaInsets();
  const { tokens } = useCoachTheme();
  const railWidth = collapsed ? coachChrome.sidebarCollapsed : width;
  const styles = useMemo(
    () => createStyles(railWidth, tokens, collapsed),
    [railWidth, tokens, collapsed],
  );
  const highlight = primaryTabForCoachNav(activeId);
  const items = folders.flatMap((folder) => folder.items);

  return (
    <View
      style={[
        styles.root,
        inDrawer && {
          paddingTop: insets.top,
          paddingBottom: Math.max(insets.bottom, spacing.md),
        },
      ]}
    >
      <View style={styles.brand}>
        {!collapsed ? (
          <>
            <CoachText variant="caption" accent style={styles.kicker}>
              ProDay Coach
            </CoachText>
            <CoachText variant="section" numberOfLines={1} style={styles.name}>
              {coachName}
            </CoachText>
            <View style={styles.formulaPill}>
              <CoachText variant="caption" muted style={styles.formulaText}>
                {formulaLabel}
              </CoachText>
            </View>
          </>
        ) : (
          <View style={styles.brandCollapsedMark}>
            <CoachText variant="caption" accent style={styles.kickerCollapsed}>
              C
            </CoachText>
          </View>
        )}
        {onToggleCollapse ? (
          <PressableSpring
            onPress={onToggleCollapse}
            scaleTo={0.94}
            haptic
            style={styles.collapseBtn}
            accessibilityRole="button"
            accessibilityLabel={collapsed ? 'Déplier le menu' : 'Replier le menu'}
          >
            <Icon
              name={collapsed ? 'chevron-forward' : 'menu'}
              size={16}
              color={tokens.muted}
            />
          </PressableSpring>
        ) : null}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {items.map((item) => (
          <SidebarItem
            key={item.id}
            item={item}
            on={item.id === highlight}
            onSelect={onSelect}
            styles={styles}
            tokens={tokens}
            collapsed={collapsed}
          />
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          onPress={onOpenHelp}
          style={({ pressed }) => [styles.footerItem, pressed && styles.footerPressed]}
          accessibilityLabel="Aide"
        >
          <Icon name="help" size={18} color={tokens.foreground} />
          {!collapsed ? (
            <CoachText variant="caption" style={styles.footerLabel}>
              Aide
            </CoachText>
          ) : null}
        </Pressable>
        <Pressable
          onPress={onSignOut}
          style={({ pressed }) => [styles.footerItem, pressed && styles.footerPressed]}
          accessibilityLabel="Se déconnecter"
        >
          <Icon name="log-out" size={18} color="#DC2626" />
          {!collapsed ? (
            <CoachText variant="caption" style={styles.footerSignOut}>
              Se déconnecter
            </CoachText>
          ) : null}
        </Pressable>
      </View>
    </View>
  );
}

function SidebarItem({
  item,
  on,
  onSelect,
  styles,
  tokens,
  collapsed,
}: {
  item: CoachNavResolvedItem;
  on: boolean;
  onSelect: (id: CoachNavItemId) => void;
  styles: ReturnType<typeof createStyles>;
  tokens: CoachThemeTokens;
  collapsed: boolean;
}) {
  return (
    <Pressable
      onPress={() => onSelect(item.id)}
      style={({ pressed }) => [styles.item, on && styles.itemOn, pressed && styles.itemPressed]}
      accessibilityLabel={item.label}
      accessibilityState={{ selected: on }}
    >
      <View style={[styles.iconWrap, on && styles.iconWrapOn]}>
        <Icon name={item.icon} size={18} color={on ? '#fff' : tokens.accent} />
      </View>
      {!collapsed ? (
        <CoachText
          variant="section"
          style={[styles.itemLabel, on && styles.itemLabelOn]}
          numberOfLines={1}
        >
          {item.label}
        </CoachText>
      ) : null}
    </Pressable>
  );
}

function createStyles(width: number, tokens: CoachThemeTokens, collapsed: boolean) {
  return StyleSheet.create({
    root: {
      width,
      flex: 1,
      minHeight: 0,
      alignSelf: 'stretch',
      borderRightWidth: StyleSheet.hairlineWidth,
      borderRightColor: tokens.border,
      backgroundColor: tokens.bg,
    },
    brand: {
      paddingHorizontal: collapsed ? spacing.xs : spacing.sm,
      paddingTop: spacing.md,
      paddingBottom: spacing.sm,
      gap: 4,
      alignItems: collapsed ? 'center' : 'stretch',
    },
    brandCollapsedMark: {
      width: 36,
      height: 36,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: tokens.soft,
      marginBottom: 4,
    },
    kicker: {
      fontSize: 11,
      fontWeight: '700',
    },
    kickerCollapsed: {
      fontSize: 14,
      fontWeight: '800',
    },
    name: {
      color: tokens.foreground,
      fontWeight: '700',
      letterSpacing: -0.3,
      fontSize: 15,
    },
    formulaPill: {
      alignSelf: 'flex-start',
      marginTop: 4,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: radius.pill,
      backgroundColor: tokens.soft,
    },
    formulaText: {
      fontSize: 10,
      fontWeight: '700',
      color: tokens.accent,
    },
    collapseBtn: {
      marginTop: 6,
      alignSelf: collapsed ? 'center' : 'flex-end',
      width: 32,
      height: 28,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: tokens.bg,
    },
    scroll: { flex: 1, minHeight: 0 },
    scrollContent: {
      paddingVertical: spacing.xs,
      paddingBottom: spacing.lg,
      gap: 2,
      alignItems: collapsed ? 'center' : 'stretch',
    },
    item: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      marginHorizontal: collapsed ? 0 : spacing.xs,
      paddingHorizontal: collapsed ? 0 : spacing.xs,
      paddingVertical: collapsed ? 6 : 8,
      minHeight: collapsed ? 44 : 44,
      borderRadius: radius.md,
      justifyContent: collapsed ? 'center' : 'flex-start',
      width: collapsed ? 44 : undefined,
    },
    itemOn: { backgroundColor: tokens.soft },
    itemPressed: { opacity: 0.7 },
    iconWrap: {
      width: 32,
      height: 32,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: tokens.bg,
    },
    iconWrapOn: { backgroundColor: tokens.accent },
    itemLabel: {
      flex: 1,
      fontWeight: '600',
      color: tokens.foreground,
      fontSize: 13,
    },
    itemLabelOn: { color: tokens.accent, fontWeight: '700' },
    footer: {
      flexShrink: 0,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: tokens.border,
      paddingHorizontal: collapsed ? spacing.xs : spacing.xs,
      paddingTop: spacing.xs,
      paddingBottom: spacing.xs,
      gap: 2,
      alignItems: collapsed ? 'center' : 'stretch',
    },
    footerItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      paddingHorizontal: collapsed ? 0 : spacing.xs,
      paddingVertical: 10,
      minHeight: 40,
      borderRadius: radius.md,
      justifyContent: collapsed ? 'center' : 'flex-start',
      width: collapsed ? 52 : undefined,
    },
    footerPressed: { opacity: 0.7 },
    footerLabel: { fontWeight: '600', color: tokens.foreground, fontSize: 12 },
    footerSignOut: { fontWeight: '700', color: '#DC2626', fontSize: 12 },
  });
}
