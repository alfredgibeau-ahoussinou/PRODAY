import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Icon, type IconName } from '../ui/Icon';
import { useAdminStyles } from './adminStyles';
import { spacing, radius, shadows } from '../../theme/designTokens';
import type { AppColors } from '../../theme/universeTheme';

interface AdminSettingsCardProps {
  icon?: IconName;
  title: string;
  children: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  actionDisabled?: boolean;
  variant?: 'default' | 'danger';
}

export const AdminSettingsCard: React.FC<AdminSettingsCardProps> = ({
  icon,
  title,
  children,
  actionLabel,
  onAction,
  actionDisabled,
  variant = 'default',
}) => {
  const { colors: c } = useAdminStyles();
  const styles = useMemo(() => createStyles(c, variant), [c, variant]);

  return (
    <View style={styles.card}>
      <View style={styles.head}>
        {icon ? (
          <View style={styles.iconWrap}>
            <Icon name={icon} size={18} color={c.brand} />
          </View>
        ) : null}
        <Text style={styles.title}>{title}</Text>
      </View>
      <View style={styles.body}>{children}</View>
      {actionLabel && onAction ? (
        <TouchableOpacity
          style={[styles.action, actionDisabled && styles.actionDisabled]}
          onPress={onAction}
          disabled={actionDisabled}
          activeOpacity={0.85}
        >
          <Text style={styles.actionText}>{actionLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

function createStyles(c: AppColors, variant: 'default' | 'danger') {
  return StyleSheet.create({
    card: {
      backgroundColor: c.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: variant === 'danger' ? c.errorBg : c.border,
      padding: spacing.md,
      marginBottom: spacing.md,
      ...shadows.card,
    },
    head: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
    iconWrap: {
      width: 32,
      height: 32,
      borderRadius: radius.sm,
      backgroundColor: c.brandSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: { fontSize: 15, fontWeight: '800', color: c.text, flex: 1 },
    body: { gap: spacing.xs },
    action: {
      marginTop: spacing.md,
      backgroundColor: c.brand,
      borderRadius: radius.md,
      padding: spacing.md,
      alignItems: 'center',
    },
    actionDisabled: { opacity: 0.55 },
    actionText: { color: c.brandInverse, fontWeight: '800', fontSize: 14 },
  });
}
