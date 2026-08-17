import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PressableSpring } from '../../../components/motion';
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

const TAB_MIN_WIDTH = 56;

export function CoachTabBar({ items, activeId, onSelect }: Props) {
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(), []);
  const highlight = primaryTabForCoachNav(activeId);
  const scrollable = items.length > 5;

  const tabs = (
    <>
      {items.map((item) => {
        const on = item.id === highlight;
        const label = item.shortLabel ?? item.label;
        return (
          <PressableSpring
            key={item.id}
            onPress={() => onSelect(item.id)}
            scaleTo={0.94}
            haptic
            style={[styles.tab, scrollable && styles.tabScroll]}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            accessibilityLabel={item.label}
          >
            <View style={styles.iconWrap}>
              <Icon
                name={item.icon}
                size={20}
                color={on ? COACH_SITE.accent : COACH_SITE.muted}
                variant="outline"
              />
              {item.aiBadge ? <View style={styles.aiDot} /> : null}
            </View>
            <CoachText
              variant="caption"
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.75}
              style={[styles.label, on ? styles.labelOn : styles.labelOff]}
            >
              {label}
            </CoachText>
          </PressableSpring>
        );
      })}
    </>
  );

  return (
    <View style={[styles.root, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      {scrollable ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {tabs}
        </ScrollView>
      ) : (
        <View style={styles.row}>{tabs}</View>
      )}
    </View>
  );
}

function createStyles() {
  return StyleSheet.create({
    root: {
      backgroundColor: COACH_SITE.bg,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: 'rgba(255,255,255,0.08)',
      paddingTop: 6,
      flexShrink: 0,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-around',
      paddingHorizontal: spacing.xs,
    },
    scrollContent: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      paddingHorizontal: spacing.xs,
      gap: 2,
    },
    tab: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 3,
      minHeight: 46,
      paddingHorizontal: 2,
    },
    tabScroll: {
      flex: 0,
      minWidth: TAB_MIN_WIDTH,
      paddingHorizontal: 6,
    },
    iconWrap: { position: 'relative' },
    aiDot: {
      position: 'absolute',
      top: -2,
      right: -4,
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: COACH_SITE.accent,
    },
    label: { fontSize: 10, fontWeight: '600', maxWidth: TAB_MIN_WIDTH + 8 },
    labelOn: { color: COACH_SITE.accent, fontWeight: '700' },
    labelOff: { color: COACH_SITE.muted },
  });
}
