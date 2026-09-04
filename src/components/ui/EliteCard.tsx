import React from 'react';
import { View, StyleSheet, Pressable, type ViewStyle, type StyleProp } from 'react-native';
import { ELITE_COLORS, ELITE_RADIUS, ELITE_SPACING } from '../../theme/prodayEliteTheme';

interface EliteCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: 'default' | 'elevated' | 'subtle' | 'highlight' | 'gold';
  onPress?: () => void;
  padding?: keyof typeof ELITE_SPACING;
}

export const EliteCard: React.FC<EliteCardProps> = ({
  children,
  style,
  variant = 'default',
  onPress,
  padding = 'lg',
}) => {
  const getBackgroundColor = () => {
    switch (variant) {
      case 'elevated':
        return ELITE_COLORS.bgSurfaceElevated;
      case 'subtle':
        return ELITE_COLORS.bgSurfaceSubtle;
      case 'highlight':
        return ELITE_COLORS.primarySoft;
      case 'gold':
        return ELITE_COLORS.goldSoft;
      default:
        return ELITE_COLORS.bgSurface;
    }
  };

  const getBorderColor = () => {
    switch (variant) {
      case 'highlight':
        return ELITE_COLORS.borderAccent;
      case 'gold':
        return ELITE_COLORS.borderGold;
      case 'elevated':
        return ELITE_COLORS.borderHighlight;
      default:
        return ELITE_COLORS.border;
    }
  };

  const cardStyle = [
    styles.card,
    {
      backgroundColor: getBackgroundColor(),
      borderColor: getBorderColor(),
      padding: ELITE_SPACING[padding],
    },
    style,
  ];

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          cardStyle,
          pressed && styles.pressed,
        ]}
      >
        {children}
      </Pressable>
    );
  }

  return <View style={cardStyle}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    borderRadius: ELITE_RADIUS.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.985 }],
  },
});
