import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, LayoutChangeEvent } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { PressableSpring } from '../motion';
import { SPRING_SNAPPY } from './animationConfig';
import { spacing, radius } from '../../theme/designTokens';
import { useDiscoverStyles } from './discoverStyles';
import type { AppColors } from '../../theme/universeTheme';

export type DiscoverStageMode = 'explore' | 'live';

const MODES: { id: DiscoverStageMode; label: string }[] = [
  { id: 'explore', label: 'Explorer' },
  { id: 'live', label: 'Live' },
];

const PADDING = 4;

interface DiscoverStageSegmentProps {
  active: DiscoverStageMode;
  onChange: (mode: DiscoverStageMode) => void;
}

export const DiscoverStageSegment: React.FC<DiscoverStageSegmentProps> = ({
  active,
  onChange,
}) => {
  const { colors: c } = useDiscoverStyles();
  const styles = useMemo(() => createStyles(c), [c]);
  const [trackW, setTrackW] = useState(0);
  const pillX = useSharedValue(PADDING);

  const activeIndex = Math.max(0, MODES.findIndex((m) => m.id === active));
  const segW = trackW > 0 ? (trackW - PADDING * 2) / MODES.length : 0;

  const movePill = useCallback(
    (index: number) => {
      if (segW <= 0) return;
      pillX.value = withSpring(PADDING + index * segW, SPRING_SNAPPY);
    },
    [pillX, segW]
  );

  useEffect(() => {
    movePill(activeIndex);
  }, [activeIndex, movePill]);

  const onTrackLayout = useCallback((e: LayoutChangeEvent) => {
    setTrackW(e.nativeEvent.layout.width);
  }, []);

  const pillStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: pillX.value }],
    width: segW,
  }));

  return (
    <View style={styles.wrap}>
      <View style={styles.track} onLayout={onTrackLayout}>
        {segW > 0 ? <Animated.View style={[styles.pill, pillStyle]} /> : null}
        {MODES.map((mode, index) => {
          const on = mode.id === active;
          return (
            <PressableSpring
              key={mode.id}
              style={styles.tab}
              onPress={() => {
                onChange(mode.id);
                movePill(index);
              }}
              scaleTo={0.98}
            >
              <Text style={[styles.tabText, on && styles.tabTextOn]}>{mode.label}</Text>
            </PressableSpring>
          );
        })}
      </View>
    </View>
  );
};

function createStyles(c: AppColors) {
  return StyleSheet.create({
    wrap: {
      paddingHorizontal: spacing.lg,
      marginBottom: spacing.md,
    },
    track: {
      flexDirection: 'row',
      backgroundColor: c.surfaceMuted,
      borderRadius: radius.pill,
      padding: PADDING,
      borderWidth: 1,
      borderColor: c.border,
    },
    pill: {
      position: 'absolute',
      top: PADDING,
      left: 0,
      bottom: PADDING,
      backgroundColor: c.ink,
      borderRadius: radius.pill,
    },
    tab: {
      flex: 1,
      paddingVertical: spacing.sm + 2,
      alignItems: 'center',
      zIndex: 1,
    },
    tabText: {
      fontSize: 13,
      fontWeight: '600',
      color: c.textMuted,
      letterSpacing: 0.2,
    },
    tabTextOn: {
      color: c.brandInverse,
      fontWeight: '800',
    },
  });
}
