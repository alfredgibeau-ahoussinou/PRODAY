import React, { useMemo } from 'react';
import { Image, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '../../../components/ui/Icon';
import { PressableSpring } from '../../../components/motion';
import { BRANDING_LOGOS } from '../../../content/brandingAssets';
import { PresidentText } from '../ui/presidentUi';
import { usePresidentTheme } from './PresidentThemeContext';
import type { PresidentNavItemId } from '../navigation/presidentNavConfig';
import type { PresidentNavResolvedFolder } from '../navigation/resolvePresidentNavAccess';
import {
  presidentChrome,
  presidentRadius,
  presidentShadow,
  presidentSpace,
} from '../theme/presidentDesignSystem';
import type { PresidentThemeTokens } from '../theme/presidentTokens';

type Props = {
  activeId: PresidentNavItemId;
  clubName: string;
  folders: PresidentNavResolvedFolder[];
  onSelect: (id: PresidentNavItemId) => void;
  onExitClub: () => void;
  onSignOut: () => void;
  onOpenCommand: () => void;
  width?: number;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
};

export function PresidentSidebar({
  activeId,
  clubName,
  folders,
  onSelect,
  onExitClub,
  onSignOut,
  onOpenCommand,
  width = presidentChrome.sidebarExpanded,
  collapsed = false,
  onToggleCollapse,
}: Props) {
  const insets = useSafeAreaInsets();
  const { tokens } = usePresidentTheme();
  const styles = useMemo(
    () => createStyles(collapsed ? presidentChrome.sidebarCollapsed : width, tokens, collapsed),
    [width, tokens, collapsed],
  );

  return (
    <View style={[styles.root, { paddingTop: insets.top + 8 }]}>
      <View style={styles.brand}>
        <Image
          source={BRANDING_LOGOS.official}
          style={collapsed ? styles.logoSm : styles.logo}
          resizeMode="contain"
          accessibilityLabel="ProDay"
        />
        {!collapsed ? (
          <View style={{ flex: 1, gap: 2 }}>
            <PresidentText variant="label" champagne>
              Président
            </PresidentText>
            <PresidentText variant="h3" numberOfLines={1}>
              {clubName}
            </PresidentText>
          </View>
        ) : null}
      </View>

      {!collapsed ? (
        <PressableSpring onPress={onOpenCommand} scaleTo={0.98} haptic style={styles.cmd}>
          <Icon name="search" size={14} color={tokens.accent} />
          <PresidentText variant="caption" muted style={{ flex: 1 }}>
            Rechercher…
          </PresidentText>
          <PresidentText variant="caption" champagne>
            ⌘K
          </PresidentText>
        </PressableSpring>
      ) : (
        <PressableSpring onPress={onOpenCommand} scaleTo={0.94} haptic style={styles.iconOnly}>
          <Icon name="search" size={18} color={tokens.accent} />
        </PressableSpring>
      )}

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.nav}>
        {folders.map((folder) => (
          <View key={folder.id} style={styles.folder}>
            {!collapsed ? (
              <PresidentText variant="label" muted style={styles.folderLabel}>
                {folder.label}
              </PresidentText>
            ) : null}
            {folder.items.map((item) => {
              const active = item.id === activeId;
              return (
                <PressableSpring
                  key={item.id}
                  onPress={() => onSelect(item.id)}
                  scaleTo={0.97}
                  haptic
                  style={[styles.item, active && styles.itemActive]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                >
                  <Icon
                    name={item.icon}
                    size={18}
                    color={active ? tokens.accent : tokens.muted}
                  />
                  {!collapsed ? (
                    <PresidentText
                      variant="nav"
                      style={{ color: active ? tokens.foreground : tokens.muted, flex: 1 }}
                      numberOfLines={1}
                    >
                      {item.label}
                    </PresidentText>
                  ) : null}
                </PressableSpring>
              );
            })}
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        {onToggleCollapse ? (
          <PressableSpring onPress={onToggleCollapse} scaleTo={0.94} haptic style={styles.iconOnly}>
            <Icon
              name={collapsed ? 'chevron-forward' : 'menu'}
              size={18}
              color={tokens.muted}
            />
          </PressableSpring>
        ) : null}
        <PressableSpring onPress={onExitClub} scaleTo={0.97} haptic style={styles.footerBtn}>
          <Icon name="football" size={16} color={tokens.champagne} />
          {!collapsed ? (
            <PresidentText variant="caption" champagne>
              Pôle Club
            </PresidentText>
          ) : null}
        </PressableSpring>
        <PressableSpring onPress={onSignOut} scaleTo={0.97} haptic style={styles.footerBtn}>
          <Icon name="log-out" size={16} color={tokens.muted} />
          {!collapsed ? (
            <PresidentText variant="caption" muted>
              Déconnexion
            </PresidentText>
          ) : null}
        </PressableSpring>
      </View>
    </View>
  );
}

function createStyles(width: number, tokens: PresidentThemeTokens, collapsed: boolean) {
  return StyleSheet.create({
    root: {
      width,
      backgroundColor: tokens.sidebarBg,
      borderRightWidth: 1,
      borderRightColor: tokens.border,
      paddingHorizontal: collapsed ? presidentSpace.sm : presidentSpace.md,
      paddingBottom: presidentSpace.lg,
      ...presidentShadow.soft,
    },
    brand: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: presidentSpace.sm,
      marginBottom: presidentSpace.md,
      paddingHorizontal: 4,
    },
    logo: { width: 36, height: 36 },
    logoSm: { width: 28, height: 28, alignSelf: 'center' },
    cmd: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: presidentSpace.md,
      paddingVertical: 10,
      borderRadius: presidentRadius.md,
      borderWidth: 1,
      borderColor: tokens.border,
      backgroundColor: tokens.surface,
      marginBottom: presidentSpace.md,
    },
    nav: { gap: presidentSpace.lg, paddingBottom: presidentSpace.xl },
    folder: { gap: 4 },
    folderLabel: { marginBottom: 4, paddingHorizontal: 8 },
    item: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingVertical: 10,
      paddingHorizontal: collapsed ? 10 : 12,
      borderRadius: presidentRadius.sm,
      justifyContent: collapsed ? 'center' : 'flex-start',
    },
    itemActive: {
      backgroundColor: tokens.accentSoft,
      borderWidth: 1,
      borderColor: tokens.borderStrong,
    },
    footer: { gap: 6, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: tokens.hairline, paddingTop: 10 },
    footerBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingVertical: 8,
      paddingHorizontal: collapsed ? 8 : 10,
      justifyContent: collapsed ? 'center' : 'flex-start',
    },
    iconOnly: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: 10,
      borderRadius: presidentRadius.sm,
      marginBottom: 6,
    },
  });
}
