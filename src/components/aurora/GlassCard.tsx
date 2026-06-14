import React from 'react';
import { View, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { useAppTheme } from '../../context/ProductLineContext';
import { radius } from '../../theme/designTokens';

type GlassCardVariant = 'default' | 'accent' | 'elevated';

interface GlassCardProps {
  variant?: GlassCardVariant;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}

/** Carte surface V3 — fond léger, bordure univers. */
export const GlassCard: React.FC<GlassCardProps> = ({
  variant = 'default',
  style,
  children,
}) => {
  const { colors } = useAppTheme();
  const backgroundColor =
    variant === 'accent' ? colors.accentSoft : colors.surface;
  const borderColor = variant === 'accent' ? colors.accentMuted : colors.border;

  return (
    <View
      style={[
        styles.card,
        variant === 'elevated' && styles.elevated,
        { backgroundColor, borderColor },
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  elevated: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
});
