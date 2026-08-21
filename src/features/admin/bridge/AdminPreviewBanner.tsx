import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '../../../components/ui/Icon';
import { AdminText } from '../ui/adminUi';
import { ADMIN_TOKENS } from '../theme/adminTokens';
import { adminSpace } from '../theme/adminDesignSystem';

interface AdminPreviewBannerProps {
  onExitPreview: () => void;
}

export const AdminPreviewBanner: React.FC<AdminPreviewBannerProps> = ({
  onExitPreview,
}) => {
  const insets = useSafeAreaInsets();
  const t = ADMIN_TOKENS;

  return (
    <TouchableOpacity
      style={[styles.wrap, { paddingTop: Math.max(insets.top, adminSpace.xs) }]}
      onPress={onExitPreview}
      activeOpacity={0.9}
    >
      <View style={styles.iconMark}>
        <Icon name="shield" size={14} color="#FFFFFF" />
      </View>
      <View style={styles.body}>
        <AdminText variant="caption">Mode prévisualisation · app utilisateur</AdminText>
        <AdminText variant="caption" color={t.muted}>
          Appuyez pour revenir au Control Center
        </AdminText>
      </View>
      <Icon name="chevron-forward" size={16} color={t.muted} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpace.sm,
    backgroundColor: ADMIN_TOKENS.surface,
    paddingHorizontal: adminSpace.md,
    paddingBottom: adminSpace.sm,
    borderBottomWidth: 1,
    borderBottomColor: ADMIN_TOKENS.border,
  },
  iconMark: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: ADMIN_TOKENS.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1, gap: 1 },
});
