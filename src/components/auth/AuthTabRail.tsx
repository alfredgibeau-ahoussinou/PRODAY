import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Platform, type LayoutChangeEvent } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { PressableSpring } from '../discover/PressableSpring';
import { SPRING_SNAPPY } from '../discover/animationConfig';
import { spacing } from '../../theme/designTokens';
import { useAppTheme } from '../../context/ProductLineContext';
import type { AppColors } from '../../theme/universeTheme';

export type AuthTabId = 'login' | 'signup';

const TABS: { id: AuthTabId; label: string }[] = [
  { id: 'login', label: 'Connexion' },
  { id: 'signup', label: 'Inscription' },
];

interface AuthTabRailProps {
  active: AuthTabId;
  onSelect: (id: AuthTabId) => void;
  compact?: boolean;
}

export const AuthTabRail: React.FC<AuthTabRailProps> = ({ active, onSelect, compact }) => {
  const { colors: c } = useAppTheme();
  const styles = useMemo(() => createStyles(c), [c]);
  const [trackW, setTrackW] = useState(0);
  const lineX = useSharedValue(0);
  const activeIndex = Math.max(0, TABS.findIndex((t) => t.id === active));
  const tabW = trackW > 0 ? trackW / TABS.length : 0;

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
    <View style={[styles.wrap, compact && styles.wrapCompact]}>
      <View
        style={[styles.track, compact && styles.trackCompact]}
        onLayout={(e: LayoutChangeEvent) => setTrackW(e.nativeEvent.layout.width)}
      >
        {tabW > 0 ? <Animated.View style={[styles.line, lineStyle]} /> : null}
        {TABS.map((tab, index) => {
          const on = tab.id === active;
          return (
            <PressableSpring
              key={tab.id}
              style={styles.tab}
              onPress={() => {
                onSelect(tab.id);
                moveLine(index);
              }}
              scaleTo={0.98}
            >
              <Text
                style={[
                  styles.tabLabel,
                  compact && styles.tabLabelCompact,
                  on && styles.tabLabelOn,
                ]}
                numberOfLines={1}
                maxFontSizeMultiplier={1.1}
              >
                {tab.label}
              </Text>
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
      marginBottom: spacing.lg,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.border,
    },
    wrapCompact: {
      marginBottom: spacing.md,
    },
    track: {
      flexDirection: 'row',
      height: 46,
      position: 'relative',
    },
    trackCompact: {
      height: 42,
    },
    line: {
      position: 'absolute',
      left: 0,
      bottom: 0,
      height: 2,
      backgroundColor: c.ink,
      borderRadius: 1,
    },
    tab: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1,
    },
    tabLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: c.textMuted,
      textAlign: 'center',
      ...Platform.select({ android: { includeFontPadding: false } }),
    },
    tabLabelCompact: {
      fontSize: 13,
    },
    tabLabelOn: {
      color: c.ink,
      fontWeight: '800',
    },
  });
}
