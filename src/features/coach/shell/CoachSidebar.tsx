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
      {/* Brand header */}
      <View style={styles.brand}>
        <View style={styles.brandRow}>
          <View style={styles.monogram}>
            <CoachText variant="caption" accent style={styles.monogramText}>
              C
            </CoachText>
          </View>
          {!collapsed ? (
            <View style={styles.brandCopy}>
              <CoachText variant="caption" muted style={styles.kicker}>
                Coach
              </CoachText>
              <CoachText variant="section" numberOfLines={1} style={styles.name}>
                {coachName}
              </CoachText>
            </View>
          ) : null}
        </View>
        {!collapsed ? (
          <View style={styles.formulaPill}>
            <CoachText variant="caption" style={styles.formulaText}>
              {formulaLabel}
            </CoachText>
          </View>
        ) : null}
        {onToggleCollapse ? (
          <PressableSpring
            onPress={onToggleCollapse}
            scaleTo={0.94}
            haptic
            style={styles.collapseBtn}
            accessibilityRole="button"
            accessibilityLabel={collapsed ? 'Deployer' : 'Replier'}
          >
            <Icon name={collapsed ? 'chevron-forward' : 'menu'} size={14} color={tokens.muted} />
          </PressableSpring>
        ) : null}
      </View>

      {/* Nav folders */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {folders.map((folder) => (
          <View key={folder.id} style={styles.folder}>
            {!collapsed ? (
              <CoachText variant="caption" muted style={styles.folderLabel}>
                {folder.label.toUpperCase()}
              </CoachText>
            ) : (
              <View style={styles.folderDivider} />
            )}
            {folder.items.map((item) => {
              const selected = item.id === highlight || item.id === activeId;
              return (
                <Pressable
                  key={item.id}
                  onPress={() => onSelect(item.id)}
                  style={[styles.row, selected && styles.rowOn]}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  accessibilityLabel={item.label}
                >
                  <Icon name={item.icon} size={17} color={selected ? tokens.accent : tokens.muted} />
                  {!collapsed ? (
                    <CoachText
                      variant="section"
                      numberOfLines={1}
                      style={{
                        flex: 1,
                        fontWeight: selected ? '700' : '500',
                        color: selected ? tokens.foreground : tokens.muted,
                        fontSize: 13,
                      }}
                    >
                      {item.label}
                    </CoachText>
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        ))}
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <Pressable onPress={onOpenHelp} style={styles.footerBtn} accessibilityLabel="Aide">
          <Icon name="help" size={16} color={tokens.muted} />
          {!collapsed ? (
            <CoachText variant="caption" muted style={styles.footerLabel}>Aide</CoachText>
          ) : null}
        </Pressable>
        <Pressable onPress={onSignOut} style={styles.footerBtn} accessibilityLabel="Se deconnecter">
          <Icon name="log-out" size={16} color="#DC2626" />
          {!collapsed ? (
            <CoachText variant="caption" style={styles.footerSignOut}>Se deconnecter</CoachText>
          ) : null}
        </Pressable>
      </View>
    </View>
  );
}

function createStyles(width: number, tokens: CoachThemeTokens, collapsed: boolean) {
  return StyleSheet.create({
    root: {
      width,
      flexShrink: 0,
      alignSelf: 'stretch',
      borderRightWidth: StyleSheet.hairlineWidth,
      borderRightColor: tokens.border,
      backgroundColor: tokens.surface,
    },
    brand: {
      paddingHorizontal: collapsed ? spacing.xs : spacing.sm,
      paddingTop: spacing.md,
      paddingBottom: spacing.sm,
      gap: 6,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: tokens.border,
      alignItems: collapsed ? 'center' : 'stretch',
      backgroundColor: tokens.bg,
    },
    brandRow: {
      flexDirection: collapsed ? 'column' : 'row',
      alignItems: 'center',
      gap: 10,
    },
    monogram: {
      width: collapsed ? 34 : 38,
      height: collapsed ? 34 : 38,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: tokens.soft,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: tokens.border,
    },
    monogramText: {
      fontSize: collapsed ? 16 : 18,
      fontWeight: '900',
      letterSpacing: -0.5,
    },
    brandCopy: { flex: 1, minWidth: 0, gap: 1 },
    kicker: { fontSize: 9, letterSpacing: 0.5 },
    name: { color: tokens.foreground, fontWeight: '700', letterSpacing: -0.3, fontSize: 14 },
    formulaPill: {
      alignSelf: 'flex-start',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: radius.pill,
      backgroundColor: tokens.soft,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: tokens.accent,
    },
    formulaText: { fontSize: 10, fontWeight: '700', color: tokens.accent },
    collapseBtn: {
      position: 'absolute',
      top: spacing.sm,
      right: spacing.xs,
      width: 26,
      height: 26,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: tokens.soft,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: tokens.border,
    },
    scroll: { flex: 1, minHeight: 0 },
    scrollContent: { paddingVertical: spacing.sm, paddingBottom: spacing.lg },
    folder: {
      marginBottom: spacing.sm,
      paddingHorizontal: collapsed ? spacing.xs : spacing.sm,
    },
    folderLabel: { marginBottom: 4, marginLeft: 6, fontSize: 9, letterSpacing: 0.8, fontWeight: '700' },
    folderDivider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: tokens.border,
      marginVertical: 4,
      marginHorizontal: 6,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: collapsed ? 'center' : 'flex-start',
      gap: 10,
      paddingVertical: 9,
      paddingHorizontal: collapsed ? 0 : spacing.xs,
      borderRadius: radius.md,
      minHeight: 40,
    },
    rowOn: {
      backgroundColor: tokens.soft,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: `${tokens.accent}40`,
    },
    footer: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: tokens.border,
      paddingHorizontal: collapsed ? spacing.xs : spacing.sm,
      paddingTop: spacing.xs,
      paddingBottom: spacing.xs,
      gap: 2,
      alignItems: collapsed ? 'center' : 'stretch',
      backgroundColor: tokens.bg,
    },
    footerBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: collapsed ? 'center' : 'flex-start',
      gap: 8,
      paddingVertical: 8,
      paddingHorizontal: collapsed ? 0 : 4,
      borderRadius: radius.md,
    },
    footerLabel: { fontWeight: '600', fontSize: 12 },
    footerSignOut: { fontWeight: '700', color: '#DC2626', fontSize: 12 },
  });
}
