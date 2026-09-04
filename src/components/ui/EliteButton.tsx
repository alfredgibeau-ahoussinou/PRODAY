import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, View, type ViewStyle, type TextStyle } from 'react-native';
import { ELITE_COLORS, ELITE_RADIUS, ELITE_SPACING } from '../../theme/prodayEliteTheme';
import { Icon } from './Icon';
import type { IconName } from './iconNames';

interface EliteButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'ai';
  size?: 'sm' | 'md' | 'lg';
  icon?: IconName;
  iconRight?: IconName;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

export const EliteButton: React.FC<EliteButtonProps> = ({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  iconRight,
  loading = false,
  disabled = false,
  style,
  textStyle,
  fullWidth = false,
}) => {
  const getBackgroundColor = () => {
    if (disabled) return '#1E293B';
    switch (variant) {
      case 'primary':
        return ELITE_COLORS.primary;
      case 'secondary':
        return ELITE_COLORS.bgSurfaceElevated;
      case 'danger':
        return ELITE_COLORS.danger;
      case 'ai':
        return ELITE_COLORS.aiPurple;
      case 'ghost':
        return 'transparent';
      default:
        return ELITE_COLORS.primary;
    }
  };

  const getTextColor = () => {
    if (disabled) return ELITE_COLORS.textDisabled;
    switch (variant) {
      case 'primary':
        return '#000000'; // Noir sur vert néon pour un contraste parfait
      case 'secondary':
        return ELITE_COLORS.textPrimary;
      case 'danger':
      case 'ai':
        return '#FFFFFF';
      case 'ghost':
        return ELITE_COLORS.primary;
      default:
        return '#000000';
    }
  };

  const getBorderColor = () => {
    if (variant === 'secondary') return ELITE_COLORS.borderHighlight;
    if (variant === 'ai') return ELITE_COLORS.aiPurpleGlow;
    if (variant === 'ghost') return 'transparent';
    return 'transparent';
  };

  const sizeStyles = {
    sm: { paddingVertical: 6, paddingHorizontal: 12, minHeight: 32 },
    md: { paddingVertical: 10, paddingHorizontal: 16, minHeight: 44 },
    lg: { paddingVertical: 14, paddingHorizontal: 22, minHeight: 52 },
  }[size];

  const fontSize = {
    sm: 12,
    md: 14,
    lg: 16,
  }[size];

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.button,
        sizeStyles,
        {
          backgroundColor: getBackgroundColor(),
          borderColor: getBorderColor(),
          borderWidth: variant === 'secondary' || variant === 'ai' ? 1 : 0,
          width: fullWidth ? '100%' : 'auto',
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={getTextColor()} />
      ) : (
        <>
          {icon && (
            <View style={{ marginRight: ELITE_SPACING.sm }}>
              <Icon
                name={icon}
                size={fontSize + 2}
                color={getTextColor()}
              />
            </View>
          )}
          <Text
            style={[
              styles.text,
              {
                color: getTextColor(),
                fontSize,
              },
              textStyle,
            ]}
          >
            {label}
          </Text>
          {iconRight && (
            <View style={{ marginLeft: ELITE_SPACING.sm }}>
              <Icon
                name={iconRight}
                size={fontSize + 2}
                color={getTextColor()}
              />
            </View>
          )}
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: ELITE_RADIUS.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
