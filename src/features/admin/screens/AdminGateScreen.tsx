import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../../context/AuthContext';
import { useIsAdmin } from '../../../hooks/useIsAdmin';
import { PLATFORM_ADMIN_EMAIL } from '../../../config/admin';
import { AdminBrandMark, AdminButton, AdminText } from '../ui/adminUi';
import { ADMIN_TOKENS } from '../theme/adminTokens';
import { adminSpace } from '../theme/adminDesignSystem';

export const AdminGateScreen: React.FC = () => {
  const { profile, refreshAdminClaim } = useAuth();
  const { claimLoading, needsSetup } = useIsAdmin();
  const t = ADMIN_TOKENS;

  if (claimLoading) {
    return (
      <View style={styles.loader} testID="admin-gate-loading">
        <ActivityIndicator size="large" color={t.accent} />
        <AdminText variant="caption" color={t.muted}>
          Vérification des droits…
        </AdminText>
      </View>
    );
  }

  return (
    <View style={styles.root} testID="admin-gate">
      <LinearGradient
        colors={['rgba(212,184,128,0.22)', 'transparent']}
        style={StyleSheet.absoluteFillObject}
        pointerEvents="none"
      />
      <AdminBrandMark />
      <AdminText variant="display" style={{ textAlign: 'center' }}>
        {needsSetup ? 'Configuration requise' : 'Accès refusé'}
      </AdminText>
      <AdminText variant="body" muted style={{ maxWidth: 420, textAlign: 'center' }}>
        {needsSetup
          ? `Votre compte (${PLATFORM_ADMIN_EMAIL}) est reconnu, mais le jeton Firebase n’a pas encore le droit administrateur. Exécutez npm run admin:setup, puis reconnectez-vous.`
          : `Connectez-vous avec le compte administrateur (${PLATFORM_ADMIN_EMAIL}).`}
      </AdminText>
      <AdminButton
        label="Rafraîchir le jeton"
        onPress={() => void refreshAdminClaim()}
        testID="admin-gate-refresh"
      />
      {profile?.email ? (
        <AdminText variant="caption" color={t.faint}>
          Connecté : {profile.email}
        </AdminText>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: adminSpace.md,
    padding: adminSpace.xl,
    backgroundColor: ADMIN_TOKENS.bg,
  },
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: adminSpace.md,
    backgroundColor: ADMIN_TOKENS.bg,
  },
});
