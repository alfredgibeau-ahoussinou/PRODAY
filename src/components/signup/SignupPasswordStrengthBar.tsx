import React, { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { spacing, radius } from '../../theme/designTokens';
import { motion } from '../../theme/motion';
import { useSignupFlowTheme } from '../../screens/signup/SignupFlowContext';
import type { AppColors } from '../../theme/universeTheme';

interface SignupPasswordStrengthBarProps {
  level: number;
  label: string;
}

export const SignupPasswordStrengthBar: React.FC<SignupPasswordStrengthBarProps> = ({
  level,
  label,
}) => {
  const { colors: c } = useSignupFlowTheme();
  const styles = useMemo(() => createStyles(c), [c]);
  const levelColors = useMemo(
    () => [c.surfaceMuted, c.error, c.warning, c.success, c.success],
    [c]
  );
  const width = useSharedValue(0);

  useEffect(() => {
    width.value = withSpring(Math.max(0.08, level / 4), motion.spring.smooth);
  }, [level, width]);

  const fillStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: width.value }],
  }));

  const levelColor = levelColors[level] ?? c.surfaceMuted;

  return (
    <View style={styles.wrap}>
      <View style={styles.track}>
        <Animated.View
          style={[styles.fill, fillStyle, { backgroundColor: levelColor }]}
        />
      </View>
      <Text style={[styles.label, { color: levelColor }]}>{label}</Text>
    </View>
  );
};

function createStyles(c: AppColors) {
  return StyleSheet.create({
    wrap: { marginTop: -spacing.sm, marginBottom: spacing.sm },
    track: {
      height: 6,
      borderRadius: radius.pill,
      backgroundColor: c.surfaceMuted,
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
}
