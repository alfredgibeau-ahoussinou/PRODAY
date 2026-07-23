import React from 'react';
import { View, StyleSheet, type StyleProp, type ViewStyle, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { useAppTheme } from '../../context/ProductLineContext';
import { radius } from '../../theme/designTokens';

type GlassCardVariant = 'default' | 'accent' | 'elevated';

interface GlassCardProps {
  variant?: GlassCardVariant;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}

/** Carte glass FLASH — blur + bordure cyan/blanc faible. */
export const GlassCard: React.FC<GlassCardProps> = ({
  variant = 'default',
  style,
  children,
}) => {
  const { colors } = useAppTheme();
  const borderColor =
    variant === 'accent' ? colors.accentMuted : 'rgba(255, 255, 255, 0.12)';
  const tintBg =
    variant === 'accent' ? colors.accentSoft : 'rgba(20, 20, 20, 0.55)';

  return (
    <View style={[styles.wrap, { borderColor }, variant === 'elevated' && styles.elevated, style]}>
      {Platform.OS === 'ios' ? (
        <BlurView intensity={28} tint="dark" style={StyleSheet.absoluteFill} />
      ) : null}
      <View style={[styles.inner, { backgroundColor: tintBg }]}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    backgroundColor: 'rgba(20, 20, 20, 0.72)',
  },
  inner: {
    borderRadius: radius.lg,
  },
  elevated: {
    shadowColor: '#22D3EE',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 4,
  },
});
