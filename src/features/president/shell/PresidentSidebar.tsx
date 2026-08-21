import React, { useEffect, useMemo } from 'react';
import { Image, ScrollView, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '../../../components/ui/Icon';
import { PressableSpring } from '../../../components/motion';
import { BRANDING_LOGOS } from '../../../content/brandingAssets';
import { PresidentBrandMark, PresidentText } from '../ui/presidentUi';
import { usePresidentTheme } from './PresidentThemeContext';
import type { PresidentNavItemId } from '../navigation/presidentNavConfig';
import type { PresidentNavResolvedFolder } from '../navigation/resolvePresidentNavAccess';
import {
  presidentChrome,
  presidentLayout,
  presidentMotion,
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
  const targetW = collapsed ? presidentChrome.sidebarCollapsed : width;
  const animW = useSharedValue(targetW);

  useEffect(() => {
    animW.value = withTiming(targetW, {
      duration: presidentMotion.enter,
      easing: Easing.out(Easing.cubic),
    });
  }, [targetW, animW]);

  const rootAnim = useAnimatedStyle(() => ({
    width: animW.value,
  }));

  const styles = useMemo(
    () => createStyles(tokens, collapsed),
    [tokens, collapsed],
  );

  return (
    <Animated.View style={[styles.root, rootAnim, { paddingTop: insets.top + 10 }]}>
      <LinearGradient
        colors={['rgba(212,184,128,0.08)', 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0.35 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.brand}>
        <Image
          source={BRANDING_LOGOS.official}
          style={collapsed ? styles.logoSm : styles.logo}
          resizeMode="contain"
          accessibilityLabel="ProDay"
        />
        {!collapsed ? (
          <View style={{ flex: 1, gap: 4 }}>
            <PresidentBrandMark compact />
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
            Commande…
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
                  {active && !collapsed ? (
                    <View style={styles.activePip} />
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
    </Animated.View>
  );
}

function createStyles(tokens: PresidentThemeTokens, collapsed: boolean) {
  return StyleSheet.create({
    root: {
      backgroundColor: tokens.sidebarBg,
      borderRightWidth: 1,
      borderRightColor: tokens.border,
      paddingHorizontal: collapsed ? presidentSpace.sm : presidentLayout.pageGutter - 4,
      paddingBottom: presidentSpace.lg,
      overflow: 'hidden',
      ...presidentShadow.soft,
    },
    brand: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: presidentSpace.sm,
      marginBottom: presidentSpace.md,
      paddingHorizontal: 4,
      minHeight: 48,
    },
    logo: { width: 38, height: 38 },
    logoSm: { width: 30, height: 30, alignSelf: 'center' },
    cmd: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: presidentSpace.md,
      paddingVertical: 11,
      borderRadius: presidentRadius.md,
      borderWidth: 1,
      borderColor: tokens.border,
      backgroundColor: tokens.surfaceGlass,
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
    activePip: {
      width: 5,
      height: 5,
      borderRadius: 3,
      backgroundColor: tokens.accent,
    },
    footer: {
      gap: 6,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: tokens.hairline,
      paddingTop: 12,
    },
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
      borderWidth: 1,
      borderColor: tokens.hairline,
    },
  });
}
