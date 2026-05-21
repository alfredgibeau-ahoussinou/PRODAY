import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, radius } from '../../theme/designTokens';
import { Icon, type IconName } from './Icon';

interface StatIconCardProps {
  icon: IconName;
  value: string | number;
  label: string;
}

export const StatIconCard: React.FC<StatIconCardProps> = ({ icon, value, label }) => (
  <View style={styles.card}>
    <View style={styles.iconWrap}>
      <Icon name={icon} size={22} color={colors.brand} />
    </View>
    <Text style={styles.value}>{value}</Text>
    <Text style={styles.label}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  value: { fontSize: 22, fontWeight: '800', color: colors.text },
  label: { fontSize: 11, color: colors.textMuted, marginTop: 4, textAlign: 'center' },
});
