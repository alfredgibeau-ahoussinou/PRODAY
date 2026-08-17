import React, { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CoachText } from '../../../components/coach/coachPortalUi';
import { Icon } from '../../../components/ui/Icon';
import { COACH_SITE } from '../../../content/coachPageIdentity';
import {
  primaryTabForCoachNav,
  type CoachNavItemId,
} from '../navigation/coachNavConfig';
import type { CoachNavResolvedItem } from '../navigation/resolveCoachNavAccess';
import { spacing } from '../../../theme/designTokens';

type Props = {
  items: CoachNavResolvedItem[];
  activeId: CoachNavItemId;
  onSelect: (id: CoachNavItemId) => void;
};

/** Barre fixe 5 onglets — compacte, sans scroll ni bounce. */
export function CoachTabBar({ items, activeId, onSelect }: Props) {
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(), []);
  const highlight = primaryTabForCoachNav(activeId);

  return (
    <View style={[styles.root, { paddingBottom: Math.max(insets.bottom, 6) }]}>
      <View style={styles.row}>
        {items.map((item) => {
          const on = item.id === highlight;
          const label = item.shortLabel ?? item.label;
          return (
            <Pressable
              key={item.id}
              onPress={() => onSelect(item.id)}
              style={({ pressed }) => [styles.tab, pressed && styles.tabPressed]}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              accessibilityLabel={item.label}
            >
              {on ? <View style={styles.indicator} /> : null}
              <View style={styles.iconWrap}>
                <Icon
                  name={item.icon}
                  size={on ? 22 : 20}
                  color={on ? COACH_SITE.accent : COACH_SITE.muted}
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
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function createStyles() {
  return StyleSheet.create({
    root: {
      backgroundColor: '#000000',
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: 'rgba(255,255,255,0.08)',
      paddingTop: 4,
      flexShrink: 0,
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
      minHeight: 42,
      paddingHorizontal: 2,
      paddingTop: 6,
      position: 'relative',
    },
    tabPressed: { opacity: 0.65 },
    indicator: {
      position: 'absolute',
      top: 0,
      width: 28,
      height: 2,
      borderRadius: 1,
      backgroundColor: COACH_SITE.accent,
    },
    iconWrap: { position: 'relative' },
    aiDot: {
      position: 'absolute',
      top: -2,
      right: -4,
      width: 5,
      height: 5,
      borderRadius: 3,
      backgroundColor: COACH_SITE.accent,
    },
    labelOn: {
      fontSize: 10,
      fontWeight: '600',
      color: COACH_SITE.accent,
      letterSpacing: 0.4,
      maxWidth: 64,
    },
    labelOff: {
      fontSize: 9,
      fontWeight: '500',
      color: COACH_SITE.muted,
      opacity: 0.7,
      maxWidth: 56,
    },
  });
}
