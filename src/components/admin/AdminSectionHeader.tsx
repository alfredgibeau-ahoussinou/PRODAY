import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAdminStyles } from './adminStyles';
import { spacing } from '../../theme/designTokens';
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
      justifyContent: 'space-between',
      marginBottom: spacing.md,
      marginTop: spacing.sm,
    },
    title: {
      fontSize: 11,
      fontWeight: '800',
      color: c.brand,
      letterSpacing: 1.1,
    },
    badge: {
      backgroundColor: c.ink,
      paddingHorizontal: 10,
      paddingVertical: 3,
      minWidth: 28,
      alignItems: 'center',
    },
    badgeText: { color: c.brandInverse, fontSize: 11, fontWeight: '900' },
  });
}
