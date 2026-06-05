import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, LayoutChangeEvent } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { DISCOVER_CHAPTERS, type DiscoverChapterId } from '../../content/discoverChapters';
import { PressableSpring } from './PressableSpring';
import { SPRING_SNAPPY } from './animationConfig';
import { discoverLayout, getDiscoverPalette, useDiscoverStyles } from './discoverStyles';
import { spacing } from '../../theme/designTokens';

interface DiscoverTabRailProps {
  active: DiscoverChapterId;
  onSelect: (id: DiscoverChapterId) => void;
}

export const DiscoverTabRail: React.FC<DiscoverTabRailProps> = ({ active, onSelect }) => {
  const { palette } = useDiscoverStyles();
  const styles = useMemo(() => createTabRailStyles(palette), [palette]);
  const [trackW, setTrackW] = useState(0);
  const lineX = useSharedValue(0);
  const activeIndex = Math.max(0, DISCOVER_CHAPTERS.findIndex((c) => c.id === active));
  const tabW = trackW > 0 ? trackW / DISCOVER_CHAPTERS.length : 0;

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
      <View style={styles.track} onLayout={(e: LayoutChangeEvent) => setTrackW(e.nativeEvent.layout.width)}>
        {tabW > 0 ? <Animated.View style={[styles.line, lineStyle]} /> : null}
        {DISCOVER_CHAPTERS.map((ch, index) => {
          const on = ch.id === active;
          return (
            <PressableSpring
              key={ch.id}
              style={styles.tab}
              onPress={() => {
                onSelect(ch.id);
                moveLine(index);
              }}
              scaleTo={0.98}
            >
              <Text style={[styles.tabLabel, on && styles.tabLabelOn]}>{ch.label}</Text>
            </PressableSpring>
          );
        })}
      </View>
    </View>
  );
};

function createTabRailStyles(palette: ReturnType<typeof getDiscoverPalette>) {
  return StyleSheet.create({
    wrap: {
      paddingHorizontal: discoverLayout.pagePadH,
      marginBottom: spacing.sm,
      backgroundColor: palette.card,
      borderBottomWidth: 1,
      borderBottomColor: palette.cardBorder,
    },
    track: {
      flexDirection: 'row',
      height: discoverLayout.tabHeight,
    },
    line: {
      position: 'absolute',
      left: 0,
      bottom: 0,
      height: 2,
      backgroundColor: palette.ink,
      borderRadius: 1,
    },
    tab: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1,
    },
    tabLabel: {
      fontSize: 13,
      fontWeight: '600',
      color: palette.faint,
      letterSpacing: 0.2,
    },
    tabLabelOn: {
      color: palette.ink,
      fontWeight: '800',
    },
  });
}
