import React from 'react';
import { View, Text, StyleSheet, type ViewStyle } from 'react-native';
import { ELITE_COLORS, ELITE_RADIUS } from '../../theme/prodayEliteTheme';

export type EliteBadgeVariant = 'success' | 'danger' | 'warning' | 'info' | 'gold' | 'neutral' | 'ai';

interface EliteBadgeProps {
  label: string;
  variant?: EliteBadgeVariant;
  size?: 'sm' | 'md';
  style?: ViewStyle;
}

export const EliteBadge: React.FC<EliteBadgeProps> = ({
  label,
  variant = 'neutral',
  size = 'md',
  style,
}) => {
  const getColors = () => {
    switch (variant) {
      case 'success':
        return { bg: ELITE_COLORS.primarySoft, text: ELITE_COLORS.primary, border: ELITE_COLORS.borderAccent };
      case 'danger':
        return { bg: ELITE_COLORS.dangerSoft, text: ELITE_COLORS.danger, border: 'rgba(239, 68, 68, 0.3)' };
      case 'warning':
        return { bg: ELITE_COLORS.warningSoft, text: ELITE_COLORS.warning, border: 'rgba(249, 115, 22, 0.3)' };
      case 'info':
        return { bg: ELITE_COLORS.secondarySoft, text: ELITE_COLORS.secondary, border: 'rgba(59, 130, 246, 0.3)' };
      case 'gold':
        return { bg: ELITE_COLORS.goldSoft, text: ELITE_COLORS.gold, border: ELITE_COLORS.borderGold };
      case 'ai':
        return { bg: ELITE_COLORS.aiPurpleSoft, text: ELITE_COLORS.aiPurple, border: ELITE_COLORS.aiPurpleGlow };
      default:
        return { bg: ELITE_COLORS.bgSurfaceElevated, text: ELITE_COLORS.textSecondary, border: ELITE_COLORS.border };
    }
  };

  const { bg, text, border } = getColors();

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: bg,
          borderColor: border,
          paddingVertical: size === 'sm' ? 2 : 4,
          paddingHorizontal: size === 'sm' ? 6 : 10,
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          {
            color: text,
            fontSize: size === 'sm' ? 10 : 12,
          },
        ]}
      >
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    borderRadius: ELITE_RADIUS.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: '800',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
});
