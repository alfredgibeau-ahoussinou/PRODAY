import React, { useEffect, useMemo } from 'react';
import { Text, StyleSheet } from 'react-native';
import Animated, {
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { PressableSpring } from './PressableSpring';
import { spacing, radius, shadows } from '../../theme/designTokens';
import { motion } from '../../theme/motion';
import { useDiscoverStyles } from './discoverStyles';
import type { AppColors } from '../../theme/universeTheme';

interface ShimmerCTAProps {
  label: string;
  variant?: 'primary' | 'secondary' | 'accent';
  onPress: () => void;
  delay?: number;
}

export const ShimmerCTA: React.FC<ShimmerCTAProps> = ({
  label,
  variant = 'primary',
  onPress,
  delay = 0,
}) => {
  const { colors: c } = useDiscoverStyles();
  const styles = useMemo(() => createStyles(c), [c]);
  const shimmer = useSharedValue(0);

  useEffect(() => {
    shimmer.value = withRepeat(
      withTiming(1, { duration: 2400, easing: motion.easing.inOut }),
      -1,
      true
    );
  }, [shimmer]);

  const shimmerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(shimmer.value, [0, 1], [0, 0.28]),
    transform: [{ translateX: interpolate(shimmer.value, [0, 1], [-100, 100]) }],
  }));

  const btnStyle =
    variant === 'accent' || variant === 'primary'
      ? styles.primary
      : styles.secondary;
  const textStyle = variant === 'secondary' ? styles.textAlt : styles.text;

  return (
    <Animated.View entering={FadeInUp.delay(delay).springify().damping(14)}>
      <PressableSpring style={[styles.btn, btnStyle]} onPress={onPress} scaleTo={0.97}>
        {(variant === 'primary' || variant === 'accent') && (
          <Animated.View style={[styles.shimmerBand, shimmerStyle]} pointerEvents="none" />
        )}
        <Text style={textStyle}>{label}</Text>
      </PressableSpring>
    </Animated.View>
  );
};

function createStyles(c: AppColors) {
  return StyleSheet.create({
    btn: {
      borderRadius: radius.pill,
      paddingVertical: spacing.md + 2,
      paddingHorizontal: spacing.lg,
      alignItems: 'center',
      overflow: 'hidden',
    },
    shimmerBand: {
      position: 'absolute',
      top: 0,
      bottom: 0,
      width: 72,
      backgroundColor: 'rgba(255,255,255,0.45)',
    },
    primary: {
      backgroundColor: c.brand,
      ...shadows.interactive,
    },
    secondary: {
      backgroundColor: c.surface,
      borderWidth: 1.5,
      borderColor: c.border,
      ...shadows.soft,
    },
    text: {
      color: c.brandInverse,
      fontWeight: '800',
      fontSize: 15,
    },
    textAlt: {
      color: c.brand,
      fontWeight: '700',
      fontSize: 15,
    },
  });
}
