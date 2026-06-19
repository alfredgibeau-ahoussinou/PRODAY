import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAdminStyles } from './adminStyles';
import { spacing, radius } from '../../theme/designTokens';
import type { AppColors } from '../../theme/universeTheme';

interface AdminSectionHeaderProps {
  title: string;
  count?: number;
}

export const AdminSectionHeader: React.FC<AdminSectionHeaderProps> = ({ title, count }) => {
  const { colors: c } = useAdminStyles();
  const styles = useMemo(() => createStyles(c), [c]);

  return (
    <View style={styles.wrap}>
      <View style={styles.accent} />
      <Text style={styles.title}>{title}</Text>
      {count !== undefined ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{count}</Text>
        </View>
      ) : null}
    </View>
  );
};

function createStyles(c: AppColors) {
  return StyleSheet.create({
    wrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginBottom: spacing.md,
      marginTop: spacing.xs,
    },
    accent: {
      width: 3,
      height: 14,
      borderRadius: 2,
      backgroundColor: c.brand,
    },
    title: {
      flex: 1,
      fontSize: 12,
      fontWeight: '700',
      color: c.text,
      letterSpacing: 0.8,
      textTransform: 'uppercase',
    },
    badge: {
      backgroundColor: c.brandSoft,
      paddingHorizontal: 10,
      paddingVertical: 3,
      borderRadius: radius.pill,
      minWidth: 28,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: c.accentMuted,
    },
    badgeText: { color: c.brand, fontSize: 11, fontWeight: '800' },
  });
}
