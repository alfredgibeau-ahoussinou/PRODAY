import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { spacing, radius } from '../../theme/designTokens';
import { useDiscoverStyles } from './discoverStyles';
import type { AppColors } from '../../theme/universeTheme';

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
  const { colors: c } = useDiscoverStyles();
  const styles = useMemo(() => createStyles(c), [c]);
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

function createStyles(c: AppColors) {
  return StyleSheet.create({
    btn: {
      borderRadius: radius.md,
      paddingVertical: spacing.lg,
      alignItems: 'center',
    },
    primary: { backgroundColor: c.brand },
    secondary: {
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.brand,
    },
    text: { color: c.brandInverse, fontWeight: '800', fontSize: 16 },
    textSecondary: { color: c.brand },
  });
}
