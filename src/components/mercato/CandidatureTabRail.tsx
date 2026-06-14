import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, LayoutChangeEvent } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import {
  CANDIDATURE_CHAPTERS,
  type CandidatureChapterId,
} from '../../content/candidatureChapters';
import { PressableSpring, AnimatedTabLabel } from '../motion';
import { prodayHaptics } from '../../utils/prodayHaptics';
import { SPRING_SNAPPY } from '../discover/animationConfig';
import { ProDayText } from '../ui/ProDayText';
import { useAppTheme } from '../../context/ProductLineContext';
import { spacing } from '../../theme/designTokens';

interface CandidatureTabRailProps {
  active: CandidatureChapterId;
  onSelect: (id: CandidatureChapterId) => void;
  suiviBadge?: number;
}

export const CandidatureTabRail: React.FC<CandidatureTabRailProps> = ({
  active,
  onSelect,
  suiviBadge,
}) => {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [trackW, setTrackW] = useState(0);
  const lineX = useSharedValue(0);
  const activeIndex = Math.max(0, CANDIDATURE_CHAPTERS.findIndex((c) => c.id === active));
  const tabW = trackW > 0 ? trackW / CANDIDATURE_CHAPTERS.length : 0;

  const moveLine = useCallback(
    (index: number) => {
      if (tabW <= 0) return;
      lineX.value = withSpring(index * tabW, SPRING_SNAPPY);
    },
    [lineX, tabW]
  );

  useEffect(() => {
    moveLine(activeIndex);
  }, [activeIndex, moveLine]);

  const lineStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: lineX.value }],
    width: tabW,
  }));

  return (
    <View style={styles.wrap}>
      <View
        style={styles.track}
        onLayout={(e: LayoutChangeEvent) => setTrackW(e.nativeEvent.layout.width)}
      >
        {tabW > 0 ? (
          <Animated.View style={[styles.line, lineStyle]}>
            <View style={[styles.lineInner, { backgroundColor: colors.accent }]} />
          </Animated.View>
        ) : null}
        {CANDIDATURE_CHAPTERS.map((ch, index) => {
          const on = ch.id === active;
          const badge = ch.id === 'suivi' && suiviBadge && suiviBadge > 0 ? suiviBadge : null;
          return (
            <PressableSpring
              key={ch.id}
              style={styles.tab}
              onPress={() => {
                prodayHaptics.tabSwitch();
                onSelect(ch.id);
                moveLine(index);
              }}
              scaleTo={0.96}
            >
              <AnimatedTabLabel active={on}>
                <View style={styles.tabInner}>
                  <ProDayText
                    variant="caption"
                    accent={on}
                    style={[styles.tabLabel, on && styles.tabLabelOn]}
                  >
                    {ch.label}
                  </ProDayText>
                  {badge ? (
                    <View style={[styles.badge, { backgroundColor: colors.accent }]}>
                      <ProDayText variant="caption" inverse style={styles.badgeText}>
                        {badge > 9 ? '9+' : badge}
                      </ProDayText>
                    </View>
                  ) : null}
                </View>
              </AnimatedTabLabel>
            </PressableSpring>
          );
        })}
      </View>
    </View>
  );
};

function createStyles(c: { surface: string; border: string; text: string; textMuted: string }) {
  return StyleSheet.create({
    wrap: {
      backgroundColor: c.surface,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.border,
    },
    track: {
      flexDirection: 'row',
      height: 44,
      position: 'relative',
    },
    line: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      height: 3,
    },
    lineInner: {
      flex: 1,
      marginHorizontal: spacing.sm,
      borderTopLeftRadius: 2,
      borderTopRightRadius: 2,
    },
    tab: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    tabInner: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    tabLabel: { fontWeight: '700', color: c.textMuted },
    tabLabelOn: { fontWeight: '800' },
    badge: {
      minWidth: 18,
      height: 18,
      borderRadius: 9,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 4,
    },
    badgeText: { fontSize: 10, fontWeight: '900', lineHeight: 12 },
  });
}
