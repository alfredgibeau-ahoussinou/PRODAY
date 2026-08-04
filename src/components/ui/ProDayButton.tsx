import React, { useMemo } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { PressableSpring } from '../motion';
import { ProDayText } from './ProDayText';
import { ProDayGradient } from './ProDayGradient';
import { Icon, type IconName } from './Icon';
import { useAppTheme } from '../../context/ProductLineContext';
import { spacing, radius, shadows } from '../../theme/designTokens';
import type { AppColors } from '../../theme/universeTheme';

export type ProDayButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ProDayButtonSize = 'md' | 'sm';

export interface ProDayButtonProps {
  label: string;
  onPress: () => void;
  variant?: ProDayButtonVariant;
  size?: ProDayButtonSize;
  icon?: IconName;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

/** Bouton ProDay canonique — remplace les primaryBtn locaux. */
export const ProDayButton: React.FC<ProDayButtonProps> = ({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  disabled = false,
  loading = false,
  style,
  accessibilityLabel,
}) => {
  const { colors: c } = useAppTheme();
  const styles = useMemo(() => createStyles(c), [c]);
  const padV = size === 'sm' ? spacing.sm : spacing.md;
  const busy = disabled || loading;

  const content = (
    <>
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' || variant === 'danger' ? c.brandInverse : c.brand}
        />
      ) : (
        <>
          {icon ? (
            <Icon
              name={icon}
              size={18}
              color={
                variant === 'primary' || variant === 'danger'
                  ? c.brandInverse
                  : variant === 'ghost'
                    ? c.accent
                    : c.text
              }
            />
          ) : null}
          <ProDayText
            variant="caption"
            inverse={variant === 'primary' || variant === 'danger'}
            accent={variant === 'ghost'}
            style={styles.label}
          >
            {label}
          </ProDayText>
        </>
      )}
    </>
  );

  if (variant === 'primary') {
    return (
      <PressableSpring
        onPress={onPress}
        disabled={busy}
        scaleTo={0.97}
        haptic
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? label}
        style={[busy && styles.disabled, style]}
      >
        <ProDayGradient kind="cta" style={[styles.base, { paddingVertical: padV }]}>
          {content}
        </ProDayGradient>
      </PressableSpring>
    );
  }

  return (
    <PressableSpring
      onPress={onPress}
      disabled={busy}
      scaleTo={0.97}
      haptic
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      style={[
        styles.base,
        { paddingVertical: padV },
        variant === 'secondary' && styles.secondary,
        variant === 'ghost' && styles.ghost,
        variant === 'danger' && styles.danger,
        busy && styles.disabled,
        style,
      ]}
    >
      {content}
    </PressableSpring>
  );
};

function createStyles(c: AppColors) {
  return StyleSheet.create({
    base: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      borderRadius: radius.pill,
      paddingHorizontal: spacing.xl,
      ...shadows.interactive,
    },
    secondary: {
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
      ...shadows.soft,
    },
    ghost: {
      backgroundColor: c.surfaceMuted,
      borderWidth: 1,
      borderColor: c.borderStrong,
      ...shadows.soft,
    },
    danger: {
      backgroundColor: c.error,
    },
    label: { fontWeight: '800', fontSize: 15 },
    disabled: { opacity: 0.55 },
  });
}
