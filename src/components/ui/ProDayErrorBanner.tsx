import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useAppTheme } from '../../context/ProductLineContext';
import { spacing, radius } from '../../theme/designTokens';
import type { AppColors } from '../../theme/universeTheme';
import { Icon, type IconName } from './Icon';

export type ProDayBannerVariant = 'error' | 'warning' | 'info' | 'success';

interface ProDayErrorBannerProps {
  message: string;
  title?: string;
  variant?: ProDayBannerVariant;
  onDismiss?: () => void;
  actionLabel?: string;
  onAction?: () => void;
}

function getVariantStyles(
  c: AppColors
): Record<
  ProDayBannerVariant,
  {
    bg: string;
    border: string;
    text: string;
    icon: IconName;
    iconColor: string;
  }
> {
  return {
    error: {
      bg: c.errorBg,
      border: c.error,
      text: c.error,
      icon: 'alert-circle',
      iconColor: c.error,
    },
    warning: {
      bg: c.warningBg,
      border: c.warning,
      text: '#9A3412',
      icon: 'warning',
      iconColor: c.warning,
    },
    info: {
      bg: c.brandSoft,
      border: c.borderMedium,
      text: c.textSecondary,
      icon: 'alert-circle',
      iconColor: c.text,
    },
    success: {
      bg: c.successBg,
      border: c.success,
      text: c.success,
      icon: 'checkmark-circle',
      iconColor: c.success,
    },
  };
}

export const ProDayErrorBanner: React.FC<ProDayErrorBannerProps> = ({
  message,
  title,
  variant = 'error',
  onDismiss,
  actionLabel,
  onAction,
}) => {
  const { colors: c } = useAppTheme();
  const styles = useMemo(() => createStyles(), []);
  const variantStyles = useMemo(() => getVariantStyles(c), [c]);
  const v = variantStyles[variant];

  return (
    <View style={[styles.wrap, { backgroundColor: v.bg, borderColor: v.border }]}>
      <Icon name={v.icon} size={20} color={v.iconColor} />
      <View style={styles.body}>
        {title ? <Text style={[styles.title, { color: v.text }]}>{title}</Text> : null}
        <Text style={[styles.message, { color: v.text }]}>{message}</Text>
        {actionLabel && onAction ? (
          <TouchableOpacity onPress={onAction} hitSlop={8} style={styles.actionBtn}>
            <Text style={[styles.actionText, { color: v.text }]}>{actionLabel}</Text>
          </TouchableOpacity>
        ) : null}
      </View>
      {onDismiss ? (
        <TouchableOpacity onPress={onDismiss} hitSlop={12} accessibilityLabel="Fermer">
          <Icon name="close" size={18} color={v.iconColor} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

function createStyles() {
  return StyleSheet.create({
    wrap: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.sm,
      padding: spacing.md,
      borderRadius: radius.md,
      borderWidth: 1,
      marginBottom: spacing.md,
    },
    body: { flex: 1 },
    title: {
      fontSize: 14,
      fontWeight: '800',
      marginBottom: 2,
    },
    message: {
      fontSize: 13,
      lineHeight: 18,
      fontWeight: '600',
    },
    actionBtn: { marginTop: spacing.sm },
    actionText: {
      fontSize: 13,
      fontWeight: '800',
      textDecorationLine: 'underline',
    },
  });
}
