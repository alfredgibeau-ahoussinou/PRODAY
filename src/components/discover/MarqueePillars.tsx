import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';
import { colors, spacing, radius } from '../../theme/designTokens';

const ITEMS = [
  'RECRUTEMENT',
  'CV FOOT',
  'MATCHS',
  'VÉRIFIÉ',
  'ARENA',
  'PRODAY',
  'SAISON',
  'COMMUNAUTÉ',
];

export const MarqueePillars: React.FC = () => {
  const offset = useSharedValue(0);
  const [paused, setPaused] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);
  const TRACK_W = ITEMS.length * 130;

  const startLoop = useCallback(() => {
    offset.value = 0;
    offset.value = withRepeat(
      withTiming(-TRACK_W, { duration: 18000, easing: Easing.linear }),
      -1,
      false
    );
  }, [offset, TRACK_W]);

  React.useEffect(() => {
    startLoop();
    return () => cancelAnimation(offset);
  }, [offset, startLoop]);

  const trackStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: offset.value }],
  }));

  const onItemPress = (label: string) => {
    if (paused) {
      startLoop();
      setPaused(false);
    } else {
      cancelAnimation(offset);
      setPaused(true);
    }
    setFlash(label);
    setTimeout(() => setFlash(null), 600);
  };

  const doubled = [...ITEMS, ...ITEMS];

  return (
    <View style={styles.wrap}>
      <Pressable
        style={styles.pauseHint}
        onPress={() => {
          if (paused) {
            startLoop();
            setPaused(false);
          } else {
            cancelAnimation(offset);
            setPaused(true);
          }
        }}
      >
        <Text style={styles.pauseText}>{paused ? '▶ Défiler' : '⏸ Pause'}</Text>
      </Pressable>
      <Animated.View style={[styles.track, trackStyle]}>
        {doubled.map((label, i) => (
          <Pressable key={`${label}-${i}`} onPress={() => onItemPress(label)}>
            <Text style={[styles.item, flash === label && styles.itemFlash]}>{label}</Text>
          </Pressable>
        ))}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    overflow: 'hidden',
    marginTop: spacing.lg,
    marginHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.accentSoft,
    borderWidth: 1,
    borderColor: colors.accentMuted,
  },
  pauseHint: {
    position: 'absolute',
    right: spacing.md,
    top: spacing.sm,
    zIndex: 2,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pauseText: {
    color: colors.accent,
    fontSize: 10,
    fontWeight: '700',
  },
  track: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  item: {
    color: colors.accent,
    fontWeight: '800',
    fontSize: 12,
    letterSpacing: 2.5,
    opacity: 0.85,
  },
  itemFlash: {
    color: colors.accentLight,
    opacity: 1,
  },
});
