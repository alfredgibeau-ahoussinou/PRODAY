import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAppTheme } from '../context/ProductLineContext';
import { spacing, radius, shadows } from '../theme/designTokens';
import type { AppColors } from '../theme/universeTheme';

interface StatCardProps {
  label: string;
  value: string;
}

export const StatCard: React.FC<StatCardProps> = ({ label, value }) => {
  const { colors: c } = useAppTheme();
  const styles = useMemo(() => createStyles(c), [c]);

  return (
    <View style={[styles.card, shadows.card]}>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
};

function createStyles(c: AppColors) {
  return StyleSheet.create({
    card: {
      flex: 1,
      backgroundColor: c.surface,
      borderRadius: radius.md,
      padding: spacing.md,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: c.border,
      minWidth: 96,
    },
    value: {
      color: c.text,
      fontSize: 18,
      fontWeight: '800',
    },
    label: {
      color: c.textMuted,
      fontSize: 11,
      marginTop: 4,
      textAlign: 'center',
    },
  });
}
