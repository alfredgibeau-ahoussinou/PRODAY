import React from 'react';
import { StyleSheet, Text, ActivityIndicator } from 'react-native';
import { PressableSpring } from '../motion';
import { Icon, type IconName } from './Icon';
import { ELITE_COLORS, ELITE_RADIUS, ELITE_SPACING } from '../../theme/prodayEliteTheme';

interface EliteButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'gold';
  size?: 'sm' | 'md' | 'lg';
  icon?: IconName;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  disabled?: boolean;
  style?: any;
}

export const EliteButton: React.FC<EliteButtonProps> = ({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  style,
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'secondary':
        return {
          btn: styles.btnSecondary,
          text: styles.textSecondary,
          iconColor: ELITE_COLORS.textPrimary,
        };
      case 'danger':
        return {
          btn: styles.btnDanger,
          text: styles.textDanger,
          iconColor: ELITE_COLORS.danger,
        };
      case 'gold':
        return {
          btn: styles.btnGold,
          text: styles.textGold,
          iconColor: '#000000',
        };
      case 'ghost':
        return {
          btn: styles.btnGhost,
          text: styles.textGhost,
          iconColor: ELITE_COLORS.textSecondary,
        };
      default:
        return {
          btn: styles.btnPrimary,
          text: styles.textPrimary,
          iconColor: '#000000',
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return {
          btn: styles.btnSm,
          text: styles.textSm,
          iconSize: 14,
        };
      case 'lg':
        return {
          btn: styles.btnLg,
          text: styles.textLg,
          iconSize: 20,
        };
      default:
        return {
          btn: styles.btnMd,
          text: styles.textMd,
          iconSize: 17,
        };
    }
  };

  const v = getVariantStyles();
  const s = getSizeStyles();

  return (
    <PressableSpring
      onPress={onPress}
      disabled={disabled || loading}
      scaleTo={0.97}
      haptic
      style={[
        styles.base,
        v.btn,
        s.btn,
        disabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' || variant === 'gold' ? '#000' : '#FFF'}
        />
      ) : (
        <>
          {icon && iconPosition === 'left' ? (
            <Icon name={icon} size={s.iconSize} color={v.iconColor} />
          ) : null}
          <Text style={[styles.textBase, v.text, s.text]}>{label}</Text>
          {icon && iconPosition === 'right' ? (
            <Icon name={icon} size={s.iconSize} color={v.iconColor} />
          ) : null}
        </>
      )}
    </PressableSpring>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: ELITE_SPACING.sm,
    borderRadius: ELITE_RADIUS.md,
    borderWidth: 1,
  },
  btnSm: {
    paddingVertical: 8,
    paddingHorizontal: ELITE_SPACING.md,
  },
  btnMd: {
    paddingVertical: 12,
    paddingHorizontal: ELITE_SPACING.lg,
  },
  btnLg: {
    paddingVertical: 15,
    paddingHorizontal: ELITE_SPACING.xl,
    borderRadius: ELITE_RADIUS.lg,
  },
  btnPrimary: {
    backgroundColor: ELITE_COLORS.primary,
    borderColor: ELITE_COLORS.primary,
  },
  btnSecondary: {
    backgroundColor: ELITE_COLORS.bgSurfaceElevated,
    borderColor: ELITE_COLORS.borderHighlight,
  },
  btnDanger: {
    backgroundColor: ELITE_COLORS.dangerSoft,
    borderColor: ELITE_COLORS.danger,
  },
  btnGold: {
    backgroundColor: ELITE_COLORS.gold,
    borderColor: ELITE_COLORS.gold,
  },
  btnGhost: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  },
  textBase: {
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  textSm: {
    fontSize: 12,
  },
  textMd: {
    fontSize: 14,
  },
  textLg: {
    fontSize: 16,
  },
  textPrimary: {
    color: '#000000',
  },
  textSecondary: {
    color: ELITE_COLORS.textPrimary,
  },
  textDanger: {
    color: ELITE_COLORS.danger,
  },
  textGold: {
    color: '#000000',
  },
  textGhost: {
    color: ELITE_COLORS.textSecondary,
  },
  disabled: {
    opacity: 0.5,
  },
});
