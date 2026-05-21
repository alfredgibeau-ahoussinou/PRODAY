import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { colors, spacing, radius, shadows } from '../../theme/designTokens';
import { Icon, type IconName } from './Icon';

interface QuickAccessCardProps {
  icon: IconName;
  title: string;
  count: string;
  onPress?: () => void;
  loading?: boolean;
}

export const QuickAccessCard: React.FC<QuickAccessCardProps> = ({
  icon,
  title,
  count,
  onPress,
  loading,
}) => (
  <TouchableOpacity
    style={[styles.card, shadows.card]}
    onPress={onPress}
    activeOpacity={0.85}
  >
    <View style={styles.iconCircle}>
      <Icon name={icon} size={24} color={colors.brand} />
    </View>
    <Text style={styles.title}>{title}</Text>
    {loading ? (
      <ActivityIndicator size="small" color={colors.brand} style={styles.loader} />
    ) : (
      <Text style={styles.count}>{count}</Text>
    )}
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 130,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.brandSoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: { fontSize: 17, fontWeight: '700', color: colors.text },
  count: { fontSize: 13, color: colors.textMuted, marginTop: 6 },
  loader: { marginTop: 8, alignSelf: 'flex-start' },
});
