import React, { useEffect, useMemo } from 'react';
import { View, StyleSheet, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { motion } from '../../theme/motion';
import { useAppTheme } from '../../context/ProductLineContext';
import { spacing, radius } from '../../theme/designTokens';

interface SkeletonBlockProps {
  width?: number | `${number}%`;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export const SkeletonBlock: React.FC<SkeletonBlockProps> = ({
  width = '100%',
  height = 14,
  borderRadius = radius.sm,
  style,
}) => {
  const { colors } = useAppTheme();
  const shimmer = useSharedValue(0);

  useEffect(() => {
    shimmer.value = withRepeat(
      withTiming(1, { duration: 1200, easing: motion.easing.inOut }),
      -1,
      true
    );
  }, [shimmer]);

  const bandStyle = useAnimatedStyle(() => ({
    opacity: interpolate(shimmer.value, [0, 1], [0.35, 0.75]),
    transform: [{ translateX: interpolate(shimmer.value, [0, 1], [-24, 24]) }],
  }));

  return (
    <View
      style={[
        styles.block,
        {
          width,
          height,
          borderRadius,
          backgroundColor: colors.surfaceMuted,
          borderColor: colors.border,
        },
        style,
      ]}
    >
      <Animated.View
        style={[
          styles.band,
          { backgroundColor: colors.surface, borderRadius },
          bandStyle,
        ]}
      />
    </View>
  );
};

interface SkeletonListProps {
  count?: number;
  variant?: 'row' | 'card' | 'grid';
}

export const SkeletonList: React.FC<SkeletonListProps> = ({
  count = 4,
  variant = 'row',
}) => {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createListStyles(colors), [colors]);

  return (
    <View style={styles.wrap}>
      {Array.from({ length: count }, (_, i) => (
        <View key={i} style={styles.item}>
          {variant === 'row' ? (
            <>
              <SkeletonBlock width={48} height={48} borderRadius={radius.md} />
              <View style={styles.rowBody}>
                <SkeletonBlock height={14} width="72%" />
                <SkeletonBlock height={11} width="48%" />
              </View>
            </>
          ) : variant === 'card' ? (
            <>
              <SkeletonBlock height={120} borderRadius={radius.lg} />
              <SkeletonBlock height={14} width="80%" style={{ marginTop: spacing.sm }} />
              <SkeletonBlock height={11} width="40%" />
            </>
          ) : (
            <View style={styles.gridCell}>
              <SkeletonBlock height={100} borderRadius={radius.md} />
              <SkeletonBlock height={12} width="90%" style={{ marginTop: spacing.xs }} />
            </View>
          )}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  block: {
    overflow: 'hidden',
    borderWidth: 1,
  },
  band: {
    ...StyleSheet.absoluteFillObject,
    width: '40%',
  },
});

function createListStyles(c: { surface: string; border: string }) {
  return StyleSheet.create({
    wrap: { gap: spacing.sm, paddingHorizontal: spacing.lg },
    item: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      padding: spacing.md,
      backgroundColor: c.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: c.border,
    },
    rowBody: { flex: 1, gap: spacing.xs },
    gridCell: { flex: 1 },
  });
}
