import React, { useMemo } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '../../../components/ui/Icon';
import { ClubText } from '../ui/clubUi';
import { primaryTabForClubNav, type ClubNavItemId } from '../navigation/clubNavConfig';
import type { ClubNavResolvedFolder } from '../navigation/resolveClubNavAccess';
import { useClubTheme } from './ClubThemeContext';
import type { ClubThemeTokens } from '../theme/clubTokens';
import {
  clubChrome,
  clubRadius,
  clubShadow,
  clubSpace,
} from '../theme/clubDesignSystem';
import { BRANDING_LOGOS } from '../../../content/brandingAssets';
import { PressableSpring } from '../../../components/motion';

type Props = {
  activeId: ClubNavItemId;
  clubName: string;
  formulaLabel: string;
  folders: ClubNavResolvedFolder[];
  onSelect: (id: ClubNavItemId) => void;
  onOpenHelp: () => void;
  onSignOut: () => void;
  width?: number;
  inDrawer?: boolean;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
};

/** Sidebar desktop premium — logo ProDay, nav complète, profil / réglages en bas, collapsible. */
export function ClubSidebar({
  activeId,
  clubName,
  formulaLabel,
  folders,
  onSelect,
  onOpenHelp,
  onSignOut,
  width = clubChrome.sidebarExpanded,
  inDrawer = false,
  collapsed = false,
  onToggleCollapse,
}: Props) {
  const insets = useSafeAreaInsets();
  const { tokens } = useClubTheme();
  const styles = useMemo(
    () => createStyles(collapsed ? clubChrome.sidebarCollapsed : width, tokens, collapsed),
    [width, tokens, collapsed],
  );
  const highlight = primaryTabForClubNav(activeId);

  return (
    <View
      style={[
        styles.root,
        inDrawer && {
          paddingTop: insets.top,
          paddingBottom: Math.max(insets.bottom, clubSpace.md),
        },
      ]}
    >
      <View style={styles.brand}>
        <View style={styles.brandRow}>
          <Image
            source={BRANDING_LOGOS.official}
            style={collapsed ? styles.logoCollapsed : styles.logo}
            resizeMode="contain"
            accessibilityLabel="ProDay"
          />
          {!collapsed ? (
            <View style={styles.brandCopy}>
              <ClubText variant="label" muted style={styles.kicker}>
                Club
              </ClubText>
              <ClubText variant="h3" numberOfLines={1}>
                {clubName}
              </ClubText>
            </View>
          ) : null}
        </View>
        {!collapsed ? (
          <View style={styles.formulaPill}>
            <ClubText variant="caption" style={{ color: tokens.accent, fontWeight: '700' }}>
              {formulaLabel}
            </ClubText>
          </View>
        ) : null}
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
        {folders.map((folder) => (
          <View key={folder.id} style={styles.folder}>
            {!collapsed ? (
              <ClubText variant="label" muted style={styles.folderLabel}>
                {folder.label}
              </ClubText>
            ) : (
              <View style={styles.folderDivider} />
            )}
            {folder.items.map((item) => {
              const selected = item.id === activeId || (highlight === item.id && item.id === activeId);
              return (
                <Pressable
                  key={item.id}
                  onPress={() => onSelect(item.id)}
                  style={[styles.row, selected && styles.rowOn]}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  accessibilityLabel={item.label}
                >
                  <Icon
                    name={item.icon}
                    size={18}
                    color={selected ? tokens.accent : tokens.muted}
                  />
                  {!collapsed ? (
                    <View style={styles.rowText}>
                      <ClubText
                        variant="nav"
                        numberOfLines={1}
                        style={{
                          fontWeight: selected ? '700' : '500',
                          color: selected ? tokens.foreground : tokens.muted,
                        }}
                      >
                        {item.label}
                      </ClubText>
                      {item.locked ? (
                        <Icon name="lock" size={12} color={tokens.muted} />
                      ) : null}
                    </View>
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          onPress={() => onSelect('club')}
          style={[styles.footerBtn, activeId === 'club' && styles.rowOn]}
          accessibilityRole="button"
          accessibilityLabel="Profil"
        >
          <Icon name="person" size={16} color={activeId === 'club' ? tokens.accent : tokens.muted} />
          {!collapsed ? (
            <ClubText variant="caption" muted={activeId !== 'club'}>
              Profil
            </ClubText>
          ) : null}
        </Pressable>
        <Pressable
          onPress={() => onSelect('pack')}
          style={[styles.footerBtn, activeId === 'pack' && styles.rowOn]}
          accessibilityRole="button"
          accessibilityLabel="Paramètres"
        >
          <Icon name="settings" size={16} color={activeId === 'pack' ? tokens.accent : tokens.muted} />
          {!collapsed ? (
            <ClubText variant="caption" muted={activeId !== 'pack'}>
              Paramètres
            </ClubText>
          ) : null}
        </Pressable>
        <Pressable
          onPress={onOpenHelp}
          style={styles.footerBtn}
          accessibilityRole="button"
          accessibilityLabel="Ouvrir le copilote Club"
        >
          <Icon name="chat" size={16} color={tokens.muted} />
          {!collapsed ? (
            <ClubText variant="caption" muted>
              Copilote
            </ClubText>
          ) : null}
        </Pressable>
        <Pressable onPress={onSignOut} style={styles.footerBtn} accessibilityRole="button">
          <Icon name="log-out" size={16} color={tokens.muted} />
          {!collapsed ? (
            <ClubText variant="caption" muted>
              Quitter
            </ClubText>
          ) : null}
        </Pressable>
      </View>
    </View>
  );
}

function createStyles(width: number, tokens: ClubThemeTokens, collapsed: boolean) {
  return StyleSheet.create({
    root: {
      width,
      backgroundColor: tokens.elevated,
      borderRightWidth: 1,
      borderRightColor: tokens.borderStrong,
      flexShrink: 0,
      ...clubShadow.soft,
    },
    brand: {
      paddingHorizontal: collapsed ? clubSpace.sm : clubSpace.md,
      paddingTop: clubSpace.lg,
      paddingBottom: clubSpace.md,
      gap: 8,
      borderBottomWidth: 1,
      borderBottomColor: tokens.border,
      alignItems: collapsed ? 'center' : 'stretch',
      backgroundColor: tokens.surface,
    },
    brandRow: {
      flexDirection: collapsed ? 'column' : 'row',
      alignItems: 'center',
      gap: 10,
    },
    logo: { width: 40, height: 38 },
    logoCollapsed: { width: 32, height: 30 },
    brandCopy: { flex: 1, minWidth: 0, gap: 2 },
    kicker: { fontSize: 9 },
    formulaPill: {
      alignSelf: 'flex-start',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: clubRadius.xs,
      backgroundColor: tokens.accentSoft,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: tokens.accent,
    },
    collapseBtn: {
      position: 'absolute',
      top: clubSpace.md,
      right: clubSpace.sm,
      width: 28,
      height: 28,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: tokens.raised,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: tokens.border,
    },
    scroll: { flex: 1 },
    scrollContent: { paddingVertical: clubSpace.md, paddingBottom: clubSpace.xl },
    folder: {
      marginBottom: clubSpace.md,
      paddingHorizontal: collapsed ? clubSpace.xs : clubSpace.sm,
    },
    folderLabel: {
      marginBottom: 6,
      marginLeft: clubSpace.sm,
      fontSize: 9,
    },
    folderDivider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: tokens.border,
      marginVertical: 6,
      marginHorizontal: 8,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: collapsed ? 'center' : 'flex-start',
      gap: 10,
      paddingVertical: 10,
      paddingHorizontal: collapsed ? 0 : clubSpace.sm,
      borderRadius: clubRadius.sm,
      minHeight: 42,
    },
    rowOn: {
      backgroundColor: tokens.accentSoft,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: tokens.accent,
    },
    rowText: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
    footer: {
      borderTopWidth: 1,
      borderTopColor: tokens.border,
      padding: collapsed ? clubSpace.sm : clubSpace.md,
      gap: clubSpace.xs,
      alignItems: collapsed ? 'center' : 'stretch',
      backgroundColor: tokens.surface,
    },
    footerBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: collapsed ? 'center' : 'flex-start',
      gap: 8,
      paddingVertical: 8,
      paddingHorizontal: collapsed ? 0 : 6,
      borderRadius: clubRadius.sm,
      width: collapsed ? 42 : undefined,
    },
  });
}

