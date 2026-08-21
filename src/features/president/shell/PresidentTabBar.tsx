import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
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
    <View style={[styles.root, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      {items.map((item) => {
        const selected = item.id === highlight || (item.id === 'menu' && highlight === 'menu');
        const isActive =
          item.id === 'menu'
            ? PRESIDENT_MENU_DEST_IDS.includes(activeId) || activeId === 'menu'
            : item.id === activeId;
        return (
          <PressableSpring
            key={item.id}
            onPress={() => onSelect(item.id)}
            scaleTo={0.92}
            haptic
            style={styles.item}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
          >
            <Icon
              name={item.icon}
              size={22}
              color={isActive ? tokens.accent : tokens.muted}
            />
            <PresidentText
              variant="caption"
              style={{
                color: isActive ? tokens.champagne : tokens.muted,
                fontWeight: isActive ? '800' : '500',
                fontSize: 10,
              }}
              numberOfLines={1}
            >
              {item.shortLabel ?? item.label}
            </PresidentText>
          </PressableSpring>
        );
      })}
    </View>
  );
}

function createStyles(tokens: PresidentThemeTokens) {
  return StyleSheet.create({
    root: {
      flexDirection: 'row',
      borderTopWidth: 1,
      borderTopColor: tokens.border,
      backgroundColor: tokens.dockBg,
      paddingTop: 8,
      paddingHorizontal: presidentSpace.sm,
    },
    item: {
      flex: 1,
      alignItems: 'center',
      gap: 2,
      paddingVertical: 4,
      borderRadius: presidentRadius.sm,
    },
  });
}
