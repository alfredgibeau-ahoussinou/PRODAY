import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Platform, type LayoutChangeEvent } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { PressableSpring } from '../motion';
import { motion } from '../../theme/motion';
import { prodayHaptics } from '../../utils/prodayHaptics';
import { spacing, radius, shadows } from '../../theme/designTokens';
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
  const pillX = useSharedValue(0);
  const activeIndex = Math.max(0, TABS.findIndex((t) => t.id === active));
  const inset = 4;
  const segW = trackW > 0 ? (trackW - inset * 2) / TABS.length : 0;

  const movePill = useCallback(
    (index: number) => {
      if (segW <= 0) return;
      pillX.value = withSpring(index * segW, motion.spring.snappy);
    },
    [pillX, segW]
  );

  useEffect(() => {
    movePill(activeIndex);
  }, [activeIndex, movePill]);

  const pillStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: pillX.value }],
    width: segW,
  }));

  return (
    <View style={[styles.wrap, compact && styles.wrapCompact]}>
      <View
        style={[styles.track, compact && styles.trackCompact]}
        onLayout={(e: LayoutChangeEvent) => setTrackW(e.nativeEvent.layout.width)}
      >
        {segW > 0 ? (
          <Animated.View style={[styles.pill, pillStyle]}>
            <View style={styles.pillInner} />
          </Animated.View>
        ) : null}
        {TABS.map((tab, index) => {
          const on = tab.id === active;
          return (
            <PressableSpring
              key={tab.id}
              style={styles.tab}
              onPress={() => {
                if (tab.id !== active) prodayHaptics.tabSwitch();
                onSelect(tab.id);
                movePill(index);
              }}
              scaleTo={0.98}
            >
              <Text
                style={[styles.tabLabel, compact && styles.tabLabelCompact, on && styles.tabLabelOn]}
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
    },
    wrapCompact: {
      marginBottom: spacing.md,
    },
    track: {
      flexDirection: 'row',
      height: 48,
      position: 'relative',
      backgroundColor: c.surfaceMuted,
      borderRadius: radius.pill,
      padding: 4,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
    },
    trackCompact: {
      height: 44,
    },
    pill: {
      position: 'absolute',
      left: 4,
      top: 4,
      bottom: 4,
      borderRadius: radius.pill,
      overflow: 'hidden',
    },
    pillInner: {
      flex: 1,
      backgroundColor: c.surface,
      borderRadius: radius.pill,
      ...shadows.soft,
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
      color: c.text,
      fontWeight: '800',
    },
  });
}
