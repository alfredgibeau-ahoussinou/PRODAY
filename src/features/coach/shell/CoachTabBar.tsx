import React, { useMemo } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CoachText } from '../../../components/coach/coachPortalUi';
import { PressableSpring } from '../../../components/motion';
import { Icon } from '../../../components/ui/Icon';
import {
  primaryTabForCoachNav,
  type CoachNavItemId,
} from '../navigation/coachNavConfig';
import type { CoachNavResolvedItem } from '../navigation/resolveCoachNavAccess';
import { spacing } from '../../../theme/designTokens';
import { useCoachTheme } from './CoachThemeContext';
import type { CoachThemeTokens } from '../../../utils/coachTeamTheme';

type Props = {
  items: CoachNavResolvedItem[];
  activeId: CoachNavItemId;
  onSelect: (id: CoachNavItemId) => void;
};

const TAB_HIT_SLOP = { top: 10, bottom: 6, left: 6, right: 6 } as const;

/** Barre fixe 5 onglets — compacte, sans scroll ni bounce. */
export function CoachTabBar({ items, activeId, onSelect }: Props) {
  const insets = useSafeAreaInsets();
  const { tokens } = useCoachTheme();
  const styles = useMemo(() => createStyles(tokens), [tokens]);
  const highlight = primaryTabForCoachNav(activeId);

  return (
    <View style={[styles.root, { paddingBottom: 0 }]}>
      <View style={[styles.row, { paddingBottom: 0 }]}>
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
              <View style={styles.iconWrap}>
                <Icon
                  name={item.icon}
                  size={on ? 22 : 20}
                  color={on ? tokens.accent : tokens.muted}
                  variant="outline"
                />
                {item.aiBadge ? <View style={styles.aiDot} /> : null}
              </View>
              {on ? (
                <CoachText variant="caption" numberOfLines={1} style={styles.labelOn}>
                  {label}
                </CoachText>
              ) : (
                <CoachText variant="caption" numberOfLines={1} style={styles.labelOff}>
                  {label}
                </CoachText>
              )}
            </PressableSpring>
          );
        })}
      </View>
    </View>
  );
}

function createStyles(tokens: CoachThemeTokens) {
  return StyleSheet.create({
    root: {
      backgroundColor: tokens.surface,
      position: 'absolute',
      bottom: 24,
      left: 20,
      right: 20,
      borderRadius: 36,
      borderWidth: 1,
      borderColor: tokens.border,
      paddingTop: 0,
      zIndex: 100,
      elevation: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.3,
      shadowRadius: 24,
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
      gap: 4,
      minHeight: 64,
      paddingHorizontal: 2,
      paddingTop: 4,
      paddingBottom: 8,
      position: 'relative',
    },
    indicator: {
      position: 'absolute',
      bottom: 6,
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: tokens.accent,
    },
    iconWrap: { position: 'relative' },
    aiDot: {
      position: 'absolute',
      top: -2,
      right: -4,
      width: 5,
      height: 5,
      borderRadius: 3,
      backgroundColor: tokens.accent,
    },
    labelOn: {
      fontSize: 10,
      fontWeight: '600',
      color: tokens.accent,
      letterSpacing: 0.4,
      maxWidth: 64,
    },
    labelOff: {
      fontSize: 9,
      fontWeight: '500',
      color: tokens.muted,
      opacity: 0.7,
      maxWidth: 56,
    },
  });
}
