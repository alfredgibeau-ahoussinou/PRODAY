import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { colors, spacing, radius, shadows, surfaces } from '../../theme/designTokens';
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
    style={styles.card}
    onPress={onPress}
    activeOpacity={0.85}
  >
    <View style={styles.iconBox}>
      <Icon name={icon} size={22} color={colors.accent} variant="filled" />
    </View>
    <Text style={styles.title}>{title}</Text>
    {loading ? (
      <ActivityIndicator size="small" color={colors.accent} style={styles.loader} />
    ) : (
      <Text style={styles.count}>{count}</Text>
    )}
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  card: {
    flex: 1,
    ...surfaces.card,
    padding: spacing.lg,
    minHeight: 128,
    ...shadows.card,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.accentSoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: { fontSize: 16, fontWeight: '800', color: colors.text },
  count: { fontSize: 12, color: colors.textMuted, marginTop: 6, fontWeight: '600' },
  loader: { marginTop: 8, alignSelf: 'flex-start' },
});
