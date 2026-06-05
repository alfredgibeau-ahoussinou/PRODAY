import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useAppTheme } from '../../context/ProductLineContext';
import { spacing, radius, shadows, surfaces } from '../../theme/designTokens';
import type { AppColors } from '../../theme/universeTheme';
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
}) => {
  const { colors: c } = useAppTheme();
  const styles = useMemo(() => createStyles(c), [c]);

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={styles.iconBox}>
        <Icon name={icon} size={22} color={c.brand} variant="filled" />
      </View>
      <Text style={styles.title}>{title}</Text>
      {loading ? (
        <ActivityIndicator size="small" color={c.brand} style={styles.loader} />
      ) : (
        <Text style={styles.count}>{count}</Text>
      )}
    </TouchableOpacity>
  );
};

function createStyles(c: AppColors) {
  return StyleSheet.create({
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
      backgroundColor: c.brandSoft,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: spacing.md,
    },
    title: { fontSize: 16, fontWeight: '800', color: c.text },
    count: { fontSize: 12, color: c.textMuted, marginTop: 6, fontWeight: '600' },
    loader: { marginTop: 8, alignSelf: 'flex-start' },
  });
}
