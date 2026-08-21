import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '../../../components/ui/Icon';
import { PressableSpring } from '../../../components/motion';
import { PresidentText } from '../ui/presidentUi';
import { usePresidentTheme } from './PresidentThemeContext';
import type { PresidentNavResolvedItem } from '../navigation/resolvePresidentNavAccess';
import type { PresidentNavItemId } from '../navigation/presidentNavConfig';
import { PRESIDENT_MENU_DEST_IDS } from '../navigation/presidentNavConfig';
import {
  presidentRadius,
  presidentSpace,
} from '../theme/presidentDesignSystem';
import type { PresidentThemeTokens } from '../theme/presidentTokens';

type Props = {
  activeId: PresidentNavItemId;
  items: PresidentNavResolvedItem[];
  onSelect: (id: PresidentNavItemId) => void;
};

export function PresidentTabBar({ activeId, items, onSelect }: Props) {
  const insets = useSafeAreaInsets();
  const { tokens } = usePresidentTheme();
  const styles = useMemo(() => createStyles(tokens), [tokens]);
  const highlight =
    activeId === 'menu' || PRESIDENT_MENU_DEST_IDS.includes(activeId)
      ? 'menu'
      : activeId;

  return (
    <View style={[styles.root, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      <LinearGradient
        colors={['transparent', 'rgba(212,184,128,0.06)']}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.rail}>
        {items.map((item) => {
          const isActive =
            item.id === 'menu'
              ? PRESIDENT_MENU_DEST_IDS.includes(activeId) || activeId === 'menu'
              : item.id === activeId || item.id === highlight;
          return (
            <PressableSpring
              key={item.id}
              onPress={() => onSelect(item.id)}
              scaleTo={0.9}
              haptic
              style={[styles.item, isActive && styles.itemActive]}
              accessibilityRole="button"
              accessibilityState={{ selected: isActive }}
            >
              {isActive ? <View style={styles.activeGlow} /> : null}
              <Icon
                name={item.icon}
                size={22}
                color={isActive ? tokens.accent : tokens.muted}
              />
              <PresidentText
                variant="caption"
                style={{
                  color: isActive ? tokens.champagneBright : tokens.muted,
                  fontWeight: isActive ? '800' : '500',
                  fontSize: 10,
                  letterSpacing: isActive ? 0.4 : 0,
                }}
                numberOfLines={1}
              >
                {item.shortLabel ?? item.label}
              </PresidentText>
            </PressableSpring>
          );
        })}
      </View>
    </View>
  );
}

function createStyles(tokens: PresidentThemeTokens) {
  return StyleSheet.create({
    root: {
      borderTopWidth: 1,
      borderTopColor: tokens.border,
      backgroundColor: tokens.dockBg,
      paddingTop: 6,
      paddingHorizontal: presidentSpace.sm,
      overflow: 'hidden',
    },
    rail: {
      flexDirection: 'row',
      alignItems: 'stretch',
    },
    item: {
      flex: 1,
      alignItems: 'center',
      gap: 3,
      paddingVertical: 6,
      borderRadius: presidentRadius.md,
      overflow: 'hidden',
    },
    itemActive: {
      backgroundColor: tokens.accentSoft,
    },
    activeGlow: {
      position: 'absolute',
      top: 0,
      width: 28,
      height: 2,
      borderRadius: 1,
      backgroundColor: tokens.accent,
    },
  });
}
