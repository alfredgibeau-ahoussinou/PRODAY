import React from 'react';
import { View, StyleSheet, type ViewStyle, type StyleProp } from 'react-native';
import { ELITE_COLORS, ELITE_RADIUS, ELITE_SPACING } from '../../theme/prodayEliteTheme';

interface EliteCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: 'default' | 'elevated' | 'subtle' | 'accent';
  noPadding?: boolean;
}

export const EliteCard: React.FC<EliteCardProps> = ({
  children,
  style,
  variant = 'default',
  noPadding = false,
}) => {
  const getVariantStyle = () => {
    switch (variant) {
      case 'elevated':
        return styles.elevated;
      case 'subtle':
        return styles.subtle;
      case 'accent':
        return styles.accent;
      default:
        return styles.default;
    }
  };

  return (
    <View
      style={[
        styles.base,
        getVariantStyle(),
        noPadding ? styles.noPad : styles.pad,
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: ELITE_RADIUS.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  default: {
    backgroundColor: ELITE_COLORS.bgSurface,
    borderColor: ELITE_COLORS.border,
  },
  elevated: {
    backgroundColor: ELITE_COLORS.bgSurfaceElevated,
    borderColor: ELITE_COLORS.borderHighlight,
  },
  subtle: {
    backgroundColor: ELITE_COLORS.bgSurfaceSubtle,
    borderColor: ELITE_COLORS.border,
  },
  accent: {
    backgroundColor: ELITE_COLORS.bgSurface,
    borderColor: ELITE_COLORS.borderAccent,
  },
  pad: {
    padding: ELITE_SPACING.lg,
  },
  noPad: {
    padding: 0,
  },
});
