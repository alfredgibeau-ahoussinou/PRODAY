import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '../ui/Icon';
import { colors, spacing } from '../../theme/designTokens';

interface AdminPreviewBannerProps {
  onExitPreview: () => void;
}

export const AdminPreviewBanner: React.FC<AdminPreviewBannerProps> = ({ onExitPreview }) => {
  const insets = useSafeAreaInsets();

  return (
    <TouchableOpacity
      style={[styles.wrap, { paddingTop: Math.max(insets.top, spacing.xs) }]}
      onPress={onExitPreview}
      activeOpacity={0.9}
    >
      <Icon name="shield" size={18} color={colors.brandInverse} />
      <View style={styles.body}>
        <Text style={styles.title}>Mode prévisualisation · app utilisateur</Text>
        <Text style={styles.sub}>Appuyez pour revenir à l’espace admin</Text>
      </View>
      <Icon name="chevron-forward" size={16} color={colors.brandInverse} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.ink,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 2,
    borderBottomColor: colors.accent,
  },
  body: { flex: 1 },
  title: { color: colors.brandInverse, fontSize: 12, fontWeight: '900' },
  sub: { color: colors.heroMuted, fontSize: 10, marginTop: 1 },
});
