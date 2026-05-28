import React, { useEffect, useRef } from 'react';
import { Animated, TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { colors, spacing, radius } from '../../theme/designTokens';

interface PulseCtaProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
}

export const PulseCta: React.FC<PulseCtaProps> = ({
  label,
  onPress,
  variant = 'primary',
}) => {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.02,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [scale]);

  const isPrimary = variant === 'primary';

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        style={[styles.btn, isPrimary ? styles.primary : styles.secondary]}
        onPress={onPress}
        activeOpacity={0.88}
      >
        <Text style={[styles.text, !isPrimary && styles.textSecondary]}>{label}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  btn: {
    borderRadius: radius.md,
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  primary: { backgroundColor: colors.brand },
  secondary: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.brand,
  },
  text: { color: '#FFFFFF', fontWeight: '800', fontSize: 16 },
  textSecondary: { color: colors.brand },
});
