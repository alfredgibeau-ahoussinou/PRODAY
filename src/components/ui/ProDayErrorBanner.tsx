import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Icon, type IconName } from './Icon';
import { colors, spacing, radius } from '../../theme/designTokens';

export type ProDayBannerVariant = 'error' | 'warning' | 'info' | 'success';

interface ProDayErrorBannerProps {
  message: string;
  title?: string;
  variant?: ProDayBannerVariant;
  onDismiss?: () => void;
  actionLabel?: string;
  onAction?: () => void;
}

const VARIANT_STYLES: Record<
  ProDayBannerVariant,
  {
    bg: string;
    border: string;
    text: string;
    icon: IconName;
    iconColor: string;
  }
> = {
  error: {
    bg: colors.errorBg,
    border: colors.error,
    text: colors.error,
    icon: 'alert-circle',
    iconColor: colors.error,
  },
  warning: {
    bg: colors.warningBg,
    border: colors.warning,
    text: '#9A3412',
    icon: 'warning',
    iconColor: colors.warning,
  },
  info: {
    bg: colors.accentSoft,
    border: colors.borderMedium,
    text: colors.textSecondary,
    icon: 'alert-circle',
    iconColor: colors.text,
  },
  success: {
    bg: colors.successBg,
    border: colors.success,
    text: colors.success,
    icon: 'checkmark-circle',
    iconColor: colors.success,
  },
};

export const ProDayErrorBanner: React.FC<ProDayErrorBannerProps> = ({
  message,
  title,
  variant = 'error',
  onDismiss,
  actionLabel,
  onAction,
}) => {
  const v = VARIANT_STYLES[variant];

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

const styles = StyleSheet.create({
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
