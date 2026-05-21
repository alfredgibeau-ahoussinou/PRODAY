import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, radius, shadows } from '../theme/designTokens';

interface StatCardProps {
  label: string;
  value: string;
}

export const StatCard: React.FC<StatCardProps> = ({ label, value }) => (
  <View style={[styles.card, shadows.card]}>
    <Text style={styles.value}>{value}</Text>
    <Text style={styles.label}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    minWidth: 96,
  },
  value: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  label: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 4,
    textAlign: 'center',
  },
});
