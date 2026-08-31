import React, { useMemo } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PressableSpring } from '../../../components/motion';
import { Icon } from '../../../components/ui/Icon';
import { ProDayText } from '../../../components/ui/ProDayText';
import { spacing } from '../../../theme/designTokens';
import { useThemedScreen } from '../../../hooks/useThemedScreen';
import {
  primaryTabForParentNav,
  type ParentNavItem,
  type ParentTabId,
} from '../navigation/parentNavConfig';

type Props = {
  items: ParentNavItem[];
  activeId: ParentTabId;
  onSelect: (id: ParentTabId) => void;
};

const TAB_HIT_SLOP = { top: 10, bottom: 6, left: 6, right: 6 } as const;

/** Barre fixe 5 onglets — compacte, style Coach. */
export function ParentTabBar({ items, activeId, onSelect }: Props) {
  const insets = useSafeAreaInsets();
  const { colors: c } = useThemedScreen();
  const styles = useMemo(() => createStyles(c), [c]);
  const highlight = primaryTabForParentNav(activeId);

  return (
    <View style={[styles.root, { paddingBottom: Math.max(insets.bottom, 6) }]}>
      <View style={styles.row}>
        {items.map((item) => {
          const on = item.id === highlight;
          const label = item.shortLabel ?? item.label;
          return (
            <PressableSpring
              key={item.id}
              onPress={() => onSelect(item.id)}
              style={styles.tab}
              scaleTo={0.92}
              haptic
              hitSlop={TAB_HIT_SLOP}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              accessibilityLabel={item.label}
            >
              {on ? <View style={styles.indicator} pointerEvents="none" /> : null}
              <Icon
                name={item.icon}
                size={on ? 22 : 20}
                color={on ? c.brand : c.textMuted}
                variant="outline"
              />
              <ProDayText
                variant="caption"
                numberOfLines={1}
                style={on ? styles.labelOn : styles.labelOff}
              >
                {label}
              </ProDayText>
            </PressableSpring>
          );
        })}
      </View>
    </View>
  );
}

function createStyles(c: { background: string; border: string; brand: string; textMuted: string }) {
  return StyleSheet.create({
    root: {
      backgroundColor: c.background,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: c.border,
      paddingTop: 4,
      flexShrink: 0,
      zIndex: 20,
      elevation: Platform.OS === 'android' ? 12 : 0,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      justifyContent: 'space-around',
      paddingHorizontal: spacing.xs,
    },
    tab: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 2,
      minHeight: 48,
      paddingHorizontal: 2,
      paddingTop: 6,
      position: 'relative',
    },
    indicator: {
      position: 'absolute',
      top: 0,
      width: 28,
      height: 2,
      borderRadius: 1,
      backgroundColor: c.brand,
    },
    labelOn: {
      fontSize: 10,
      fontWeight: '600',
      color: c.brand,
      letterSpacing: 0.4,
      maxWidth: 64,
    },
    labelOff: {
      fontSize: 9,
      fontWeight: '500',
      color: c.textMuted,
      opacity: 0.7,
      maxWidth: 56,
    },
  });
}
