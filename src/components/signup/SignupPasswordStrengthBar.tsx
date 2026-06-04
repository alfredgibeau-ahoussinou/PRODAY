import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { colors, spacing, radius } from '../../theme/designTokens';
import { motion } from '../../theme/motion';

interface SignupPasswordStrengthBarProps {
  level: number;
  label: string;
}

const LEVEL_COLORS = [
  colors.surfaceMuted,
  colors.error,
  colors.warning,
  colors.success,
  colors.success,
];

export const SignupPasswordStrengthBar: React.FC<SignupPasswordStrengthBarProps> = ({
  level,
  label,
}) => {
  const width = useSharedValue(0);

  useEffect(() => {
    width.value = withSpring(Math.max(0.08, level / 4), motion.spring.smooth);
  }, [level, width]);

  const fillStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: width.value }],
  }));

  return (
    <View style={styles.wrap}>
      <View style={styles.track}>
        <Animated.View
          style={[
            styles.fill,
            fillStyle,
            { backgroundColor: LEVEL_COLORS[level] ?? colors.surfaceMuted },
          ]}
        />
      </View>
      <Text style={[styles.label, { color: LEVEL_COLORS[level] ?? colors.textMuted }]}>
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { marginTop: -spacing.sm, marginBottom: spacing.sm },
  track: {
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceMuted,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    width: '100%',
    borderRadius: radius.pill,
    transformOrigin: 'left',
  },
  label: {
    fontSize: 11,
    fontWeight: '800',
    marginTop: spacing.xs,
  },
});
