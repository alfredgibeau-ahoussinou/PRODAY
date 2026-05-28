import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing } from '../../theme/designTokens';

interface AdminSectionHeaderProps {
  title: string;
  count?: number;
}

export const AdminSectionHeader: React.FC<AdminSectionHeaderProps> = ({ title, count }) => (
  <View style={styles.wrap}>
    <Text style={styles.title}>{title}</Text>
    {count !== undefined ? (
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{count}</Text>
      </View>
    ) : null}
  </View>
);

const styles = StyleSheet.create({
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
    color: colors.accent,
    letterSpacing: 1.1,
  },
  badge: {
    backgroundColor: colors.ink,
    paddingHorizontal: 10,
    paddingVertical: 3,
    minWidth: 28,
    alignItems: 'center',
  },
  badgeText: { color: colors.brandInverse, fontSize: 11, fontWeight: '900' },
});
