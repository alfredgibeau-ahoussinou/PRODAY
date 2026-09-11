import React, { useMemo } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { PressableSpring } from '../../../components/motion';
import { Icon } from '../../../components/ui/Icon';
import {
  primaryTabForClubNav,
  type ClubNavItemId,
} from '../navigation/clubNavConfig';
import type { ClubNavResolvedItem } from '../navigation/resolveClubNavAccess';
import { spacing } from '../../../theme/designTokens';
import { useClubTheme } from './ClubThemeContext';
import type { ClubThemeTokens } from '../theme/clubTokens';
import { PLAYER_DARK, PLAYER_DARK_RADIUS } from '../../../theme/playerDarkPremium';

type Props = {
  items: ClubNavResolvedItem[];
  activeId: ClubNavItemId;
  onSelect: (id: ClubNavItemId) => void;
};

const TAB_HIT_SLOP = { top: 8, bottom: 6, left: 6, right: 6 } as const;

/** Dock club dark premium — calqué sur le pôle coach (5 onglets capsule flottante, accent club & micro-labels). */
export function ClubTabBar({ items, activeId, onSelect }: Props) {
  const insets = useSafeAreaInsets();
  const { tokens } = useClubTheme();
  const styles = useMemo(() => createStyles(tokens), [tokens]);
  const highlight = primaryTabForClubNav(activeId);

  return (
    <View
      style={[
        styles.root,
        {
          paddingBottom: Math.max(insets.bottom, 8),
        },
      ]}
      accessibilityRole="tablist"
      testID="club-tab-bar"
    >
      <View style={styles.dock}>
        <BlurView
          intensity={Platform.OS === 'ios' ? 45 : 30}
          tint="dark"
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.row}>
          {items.map((item) => {
            const on = item.id === highlight;
            const label = (item.shortLabel ?? item.label).toUpperCase();
            return (
              <PressableSpring
                key={item.id}
                onPress={() => onSelect(item.id)}
                style={styles.slot}
                scaleTo={0.96}
                haptic
                hitSlop={TAB_HIT_SLOP}
                accessibilityRole="tab"
                accessibilityState={{ selected: on }}
                accessibilityLabel={item.label}
                accessibilityHint={item.hint}
                testID={`club-tab-${item.id}`}
              >
                <View
                  style={[
                    styles.iconWrap,
                    on && {
                      borderColor: tokens.accent,
                      backgroundColor: tokens.accentSoft,
                    },
                  ]}
                >
                  <Icon
                    name={item.icon}
                    size={22}
                    color={on ? tokens.accent : PLAYER_DARK.textMuted}
                    variant={on ? 'filled' : 'outline'}
                  />
                  {item.aiBadge ? (
                    <View style={[styles.aiDot, { backgroundColor: tokens.accent }]} />
                  ) : null}
                </View>

                <Text
                  style={[
                    styles.slotLabel,
                    { color: on ? tokens.accent : PLAYER_DARK.textMuted },
                  ]}
                  adjustsFontSizeToFit
                  minimumFontScale={0.82}
                  numberOfLines={1}
                >
                  {label}
                </Text>

                {on ? (
                  <View style={[styles.activeLine, { backgroundColor: tokens.accent }]} />
                ) : null}
              </PressableSpring>
            );
          })}
        </View>
      </View>
    </View>
  );
}

function createStyles(tokens: ClubThemeTokens) {
  return StyleSheet.create({
    root: {
      paddingHorizontal: spacing.md,
      paddingTop: 0,
      backgroundColor: 'transparent',
      flexShrink: 0,
      zIndex: 20,
    },
    dock: {
      borderWidth: 1,
      borderRadius: PLAYER_DARK_RADIUS.dock,
      paddingTop: 8,
      paddingBottom: 8,
      paddingHorizontal: 6,
      overflow: 'hidden',
      backgroundColor: 'rgba(14, 16, 24, 0.72)',
      borderColor: 'rgba(255, 255, 255, 0.12)',
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOpacity: 0.45,
          shadowRadius: 14,
          shadowOffset: { width: 0, height: 6 },
        },
        android: { elevation: 10 },
        default: {},
      }),
    },
    row: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
    },
    slot: {
      flex: 1,
      alignItems: 'center',
      gap: 3,
      minWidth: 0,
      paddingBottom: 2,
    },
    iconWrap: {
      width: 44,
      height: 44,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: 'transparent',
      position: 'relative',
    },
    aiDot: {
      position: 'absolute',
      top: -2,
      right: -2,
      width: 7,
      height: 7,
      borderRadius: 4,
    },
    slotLabel: {
      fontSize: 9,
      fontWeight: '800',
      letterSpacing: 0.3,
      textTransform: 'uppercase',
      width: '100%',
      textAlign: 'center',
    },
    activeLine: {
      width: 18,
      height: 2,
      borderRadius: 1,
      marginTop: 2,
    },
  });
}
