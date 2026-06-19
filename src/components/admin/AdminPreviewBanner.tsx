import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '../ui/Icon';
import { adminChrome } from './adminStyles';
import { spacing } from '../../theme/designTokens';

interface AdminPreviewBannerProps {
  onExitPreview: () => void;
}

export const AdminPreviewBanner: React.FC<AdminPreviewBannerProps> = ({ onExitPreview }) => {
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(), []);

  return (
    <TouchableOpacity
      style={[styles.wrap, { paddingTop: Math.max(insets.top, spacing.xs) }]}
      onPress={onExitPreview}
      activeOpacity={0.9}
    >
      <View style={styles.iconMark}>
        <Icon name="shield" size={14} color="#FFFFFF" />
      </View>
      <View style={styles.body}>
        <Text style={styles.title}>Mode prévisualisation · app utilisateur</Text>
        <Text style={styles.sub}>Appuyez pour revenir à la console admin</Text>
      </View>
      <Icon name="chevron-forward" size={16} color={adminChrome.textMuted} />
    </TouchableOpacity>
  );
};

function createStyles() {
  return StyleSheet.create({
    wrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: adminChrome.shell,
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: adminChrome.shellBorder,
    },
    iconMark: {
      width: 28,
      height: 28,
      borderRadius: 8,
      backgroundColor: adminChrome.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },
    body: { flex: 1 },
    title: { color: adminChrome.text, fontSize: 12, fontWeight: '800' },
    sub: { color: adminChrome.textMuted, fontSize: 10, marginTop: 1 },
  });
}
