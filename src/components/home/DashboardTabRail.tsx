import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, LayoutChangeEvent } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { DASHBOARD_CHAPTERS, type DashboardChapterId } from '../../content/dashboardChapters';
import { PressableSpring, AnimatedTabLabel } from '../motion';
import { prodayHaptics } from '../../utils/prodayHaptics';
import { SPRING_SNAPPY } from '../discover/animationConfig';
import { ProDayText } from '../ui/ProDayText';
import { useAppTheme } from '../../context/ProductLineContext';
import { spacing } from '../../theme/designTokens';

interface DashboardTabRailProps {
  active: DashboardChapterId;
  onSelect: (id: DashboardChapterId) => void;
}

export const DashboardTabRail: React.FC<DashboardTabRailProps> = ({ active, onSelect }) => {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [trackW, setTrackW] = useState(0);
  const lineX = useSharedValue(0);
  const activeIndex = Math.max(0, DASHBOARD_CHAPTERS.findIndex((c) => c.id === active));
  const tabW = trackW > 0 ? trackW / DASHBOARD_CHAPTERS.length : 0;

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
        {DASHBOARD_CHAPTERS.map((ch, index) => {
          const on = ch.id === active;
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
                <ProDayText
                  variant="caption"
                  accent={on}
                  style={[styles.tabLabel, on && styles.tabLabelOn]}
                >
                  {ch.label}
                </ProDayText>
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
    tab: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    tabLabel: {
      fontWeight: '700',
      color: c.textMuted,
    },
    tabLabelOn: {
      fontWeight: '800',
    },
  });
}
