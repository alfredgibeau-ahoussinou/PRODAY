import React, { useMemo } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PressableSpring } from '../../../components/motion';
import { Icon } from '../../../components/ui/Icon';
import { DockPillIndicator, TabUnderline } from '../../../motion';
import { ClubText } from '../ui/clubUi';
import {
  primaryTabForClubNav,
  type ClubNavItemId,
} from '../navigation/clubNavConfig';
import type { ClubNavResolvedItem } from '../navigation/resolveClubNavAccess';
import { useClubTheme } from './ClubThemeContext';
import type { ClubThemeTokens } from '../theme/clubTokens';
import { clubChrome, clubRadius, clubSpace } from '../theme/clubDesignSystem';

type Props = {
  items: ClubNavResolvedItem[];
  activeId: ClubNavItemId;
  onSelect: (id: ClubNavItemId) => void;
};

const TAB_HIT_SLOP = { top: 12, bottom: 8, left: 4, right: 4 } as const;
/** Labels dock — lisibles (≥11), jamais 9–10 px. */
const LABEL_SIZE = 11;

/**
 * Dock mobile Pôle Club — Accueil · Équipes · Matchs · Outils · Club.
 * Actif = pill émeraude animée (ProDay) ; FAB Créer reste le bleu primaire à part.
 */
export function ClubTabBar({ items, activeId, onSelect }: Props) {
  const insets = useSafeAreaInsets();
  const { tokens } = useClubTheme();
  const styles = useMemo(() => createStyles(tokens), [tokens]);
  const highlight = primaryTabForClubNav(activeId);
  const bottomPad = Math.max(insets.bottom, 10);

  return (
    <View
      style={[styles.root, { paddingBottom: bottomPad }]}
      accessibilityRole="tablist"
      testID="club-tab-bar"
    >
      <LinearGradient
        colors={['rgba(5, 150, 105, 0.10)', 'transparent']}
        locations={[0, 1]}
        style={styles.wash}
        pointerEvents="none"
      />
      <View style={styles.rail}>
        {items.map((item) => {
          const on = item.id === highlight;
          const label = item.shortLabel ?? item.label;
          const ink = on ? tokens.pitch : tokens.faint;
          return (
            <PressableSpring
              key={item.id}
              onPress={() => onSelect(item.id)}
              style={styles.tab}
              scaleTo={0.92}
              haptic
              hitSlop={TAB_HIT_SLOP}
              accessibilityRole="tab"
              accessibilityState={{ selected: on }}
              accessibilityLabel={item.label}
              accessibilityHint={item.hint}
              testID={`club-tab-${item.id}`}
            >
              <View style={styles.topMark} pointerEvents="none">
                <TabUnderline active={on} color={tokens.pitch} widthPercent="55%" />
              </View>
              <View style={styles.iconSlot}>
                <DockPillIndicator active={on} color={tokens.pitchSoft} />
                <Icon
                  name={item.icon}
                  size={on ? clubChrome.tabBarIcon + 2 : clubChrome.tabBarIcon}
                  color={ink}
                  variant="outline"
                />
                {item.aiBadge ? (
                  <View style={[styles.aiDot, { backgroundColor: tokens.pitch }]} />
                ) : null}
              </View>
              <ClubText
                variant="caption"
                numberOfLines={1}
                style={[styles.label, on ? styles.labelOn : styles.labelOff, { color: ink }]}
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
      backgroundColor: tokens.surface,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: tokens.borderStrong,
      paddingTop: clubSpace.xs,
      flexShrink: 0,
      zIndex: 20,
      overflow: 'hidden',
      ...Platform.select({
        ios: {
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: -6 },
          shadowOpacity: 0.28,
          shadowRadius: 14,
        },
        android: { elevation: 14 },
        default: {},
      }),
    },
    wash: {
      ...StyleSheet.absoluteFillObject,
      height: 28,
    },
    rail: {
      flexDirection: 'row',
      alignItems: 'stretch',
      justifyContent: 'space-around',
      paddingHorizontal: clubSpace.xs,
      minHeight: clubChrome.dockRailHeight,
    },
    tab: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
      minHeight: clubChrome.dockRailHeight,
      paddingHorizontal: 2,
      paddingTop: 8,
      paddingBottom: 4,
      position: 'relative',
    },
    topMark: {
      position: 'absolute',
      top: 2,
      left: 0,
      right: 0,
      alignItems: 'center',
      height: 3,
    },
    iconSlot: {
      position: 'relative',
      width: 48,
      height: 32,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: clubRadius.sm,
      overflow: 'hidden',
    },
    aiDot: {
      position: 'absolute',
      top: 3,
      right: 6,
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    label: {
      fontSize: LABEL_SIZE,
      lineHeight: 14,
      maxWidth: 72,
      textAlign: 'center',
    },
    labelOn: {
      fontWeight: '700',
      letterSpacing: 0.15,
    },
    labelOff: {
      fontWeight: '500',
      letterSpacing: 0,
      opacity: 0.92,
    },
  });
}
