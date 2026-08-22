import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PressableSpring } from '../../../components/motion';
import { Icon } from '../../../components/ui/Icon';
import { ClubText } from '../ui/clubUi';
import {
  primaryTabForClubNav,
  type ClubNavItemId,
} from '../navigation/clubNavConfig';
import type { ClubNavResolvedItem } from '../navigation/resolveClubNavAccess';
import { useClubTheme } from './ClubThemeContext';
import type { ClubThemeTokens } from '../theme/clubTokens';
import { clubRadius, clubSpace } from '../theme/clubDesignSystem';

type Props = {
  items: ClubNavResolvedItem[];
  activeId: ClubNavItemId;
  onSelect: (id: ClubNavItemId) => void;
};

const TAB_HIT_SLOP = { top: 10, bottom: 6, left: 6, right: 6 } as const;

/** Barre mobile premium — Accueil · Équipes · Matchs · Menu · Club. */
export function ClubTabBar({ items, activeId, onSelect }: Props) {
  const insets = useSafeAreaInsets();
  const { tokens } = useClubTheme();
  const styles = useMemo(() => createStyles(tokens), [tokens]);
  const highlight = primaryTabForClubNav(activeId);

  return (
    <View style={[styles.root, { paddingBottom: Math.max(insets.bottom, 8) }]}>
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
              <View style={[styles.iconWrap, on && styles.iconWrapOn]}>
                <Icon
                  name={item.icon}
                  size={on ? 22 : 20}
                  color={on ? tokens.accent : tokens.faint}
                  variant="outline"
                />
                {item.aiBadge ? <View style={styles.aiDot} /> : null}
              </View>
              <ClubText
                variant="caption"
                numberOfLines={1}
                style={on ? styles.labelOn : styles.labelOff}
              >
                {label}
              </ClubText>
            </PressableSpring>
          );
        })}
      </View>
    </View>
  );
}

function createStyles(tokens: ClubThemeTokens) {
  return StyleSheet.create({
    root: {
      backgroundColor: tokens.bg,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: tokens.border,
      paddingTop: 6,
      flexShrink: 0,
      zIndex: 20,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      justifyContent: 'space-around',
      paddingHorizontal: clubSpace.xs,
    },
    tab: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 2,
      minHeight: 52,
      paddingHorizontal: 2,
      paddingTop: 8,
      position: 'relative',
    },
    iconWrap: {
      position: 'relative',
      width: 40,
      height: 28,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: clubRadius.pill,
    },
    iconWrapOn: { backgroundColor: 'transparent' },
    aiDot: {
      position: 'absolute',
      top: 0,
      right: 2,
      width: 5,
      height: 5,
      borderRadius: 3,
      backgroundColor: tokens.accent,
    },
    labelOn: {
      fontSize: 10,
      fontWeight: '700',
      color: tokens.accent,
      letterSpacing: 0.3,
      maxWidth: 64,
    },
    labelOff: {
      fontSize: 9,
      fontWeight: '500',
      color: tokens.faint,
      maxWidth: 56,
    },
  });
}
