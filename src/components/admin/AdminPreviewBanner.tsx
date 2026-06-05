import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '../ui/Icon';
import { useAdminStyles } from './adminStyles';
import { spacing } from '../../theme/designTokens';
import type { AppColors } from '../../theme/universeTheme';

interface AdminPreviewBannerProps {
  onExitPreview: () => void;
}

export const AdminPreviewBanner: React.FC<AdminPreviewBannerProps> = ({ onExitPreview }) => {
  const insets = useSafeAreaInsets();
  const { colors: c } = useAdminStyles();
  const styles = useMemo(() => createStyles(c), [c]);

  return (
    <TouchableOpacity
      style={[styles.wrap, { paddingTop: Math.max(insets.top, spacing.xs) }]}
      onPress={onExitPreview}
      activeOpacity={0.9}
    >
      <Icon name="shield" size={18} color={c.brandInverse} />
      <View style={styles.body}>
        <Text style={styles.title}>Mode prévisualisation · app utilisateur</Text>
        <Text style={styles.sub}>Appuyez pour revenir à l’espace admin</Text>
      </View>
      <Icon name="chevron-forward" size={16} color={c.brandInverse} />
    </TouchableOpacity>
  );
};

function createStyles(c: AppColors) {
  return StyleSheet.create({
    wrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: c.ink,
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.sm,
      borderBottomWidth: 2,
      borderBottomColor: c.brand,
    },
    body: { flex: 1 },
    title: { color: c.brandInverse, fontSize: 12, fontWeight: '900' },
    sub: { color: c.heroMuted, fontSize: 10, marginTop: 1 },
  });
}
