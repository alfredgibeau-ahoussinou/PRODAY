import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Icon, type IconName } from '../ui/Icon';
import { useAdminStyles } from './adminStyles';
import { spacing, radius } from '../../theme/designTokens';
import type { AppColors } from '../../theme/universeTheme';

interface AdminEmptyStateProps {
  icon: IconName;
  title: string;
  subtitle: string;
}

export const AdminEmptyState: React.FC<AdminEmptyStateProps> = ({
  icon,
  title,
  subtitle,
}) => {
  const { colors: c } = useAdminStyles();
  const styles = useMemo(() => createStyles(c), [c]);

  return (
    <View style={styles.wrap}>
      <View style={styles.iconCircle}>
        <Icon name={icon} size={32} color={c.brand} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
};

function createStyles(c: AppColors) {
  return StyleSheet.create({
    wrap: {
      alignItems: 'center',
      paddingVertical: spacing.xxl,
      paddingHorizontal: spacing.xl,
      backgroundColor: c.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: c.border,
    },
    iconCircle: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: c.brandSoft,
      borderWidth: 1,
      borderColor: c.accentMuted,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.lg,
    },
    title: { fontSize: 17, fontWeight: '800', color: c.text, textAlign: 'center' },
    subtitle: {
      fontSize: 13,
      color: c.textMuted,
      textAlign: 'center',
      marginTop: spacing.sm,
      lineHeight: 20,
    },
  });
}
