import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useIsAdmin } from '../../hooks/useIsAdmin';
import { Icon } from '../../components/ui/Icon';
import { PLATFORM_ADMIN_EMAIL } from '../../config/admin';
import { useAdminStyles, adminChrome } from '../../components/admin/adminStyles';
import { spacing, radius } from '../../theme/designTokens';
import type { AppColors } from '../../theme/universeTheme';

export const AdminGateScreen: React.FC = () => {
  const { profile, refreshAdminClaim } = useAuth();
  const { claimLoading, needsSetup } = useIsAdmin();
  const { styles: baseStyles, colors: c } = useAdminStyles();
  const styles = useMemo(() => createStyles(c), [c]);

  if (claimLoading) {
    return (
      <View style={styles.loaderRoot} testID="admin-gate-loading">
        <ActivityIndicator size="large" color={c.brand} />
        <Text style={styles.loaderText}>Vérification des droits admin…</Text>
      </View>
    );
  }

  return (
    <View style={styles.root} testID="admin-gate">
      <View style={styles.hero}>
        <View style={styles.logoMark}>
          <Icon name="shield" size={28} color={c.brandInverse} />
        </View>
        <Text style={styles.eyebrow}>ProDay Console</Text>
        <Text style={styles.heroTitle}>{needsSetup ? 'Configuration requise' : 'Accès refusé'}</Text>
      </View>
      <View style={styles.body}>
        <Text style={styles.title}>Droits administrateur requis</Text>
        <Text style={styles.sub}>
          {needsSetup
            ? `Votre compte (${PLATFORM_ADMIN_EMAIL}) est reconnu, mais le token Firebase n’a pas encore le claim admin.\n\nExécutez npm run admin:setup sur votre Mac, puis déconnectez-vous et reconnectez-vous.`
            : `Connectez-vous avec le compte administrateur (${PLATFORM_ADMIN_EMAIL}) pour accéder à cet espace.`}
        </Text>
        <TouchableOpacity
          style={baseStyles.btn}
          onPress={() => refreshAdminClaim()}
          testID="admin-gate-refresh"
        >
          <Text style={baseStyles.btnText}>Rafraîchir le token</Text>
        </TouchableOpacity>
        {profile?.email ? (
          <Text style={styles.email}>Connecté : {profile.email}</Text>
        ) : null}
      </View>
    </View>
  );
};

function createStyles(c: AppColors) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: adminChrome.shell },
    loaderRoot: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.md,
      backgroundColor: adminChrome.shell,
    },
    loaderText: { color: adminChrome.textMuted, fontSize: 14 },
    hero: {
      alignItems: 'center',
      paddingTop: spacing.xxl,
      paddingBottom: spacing.xl,
      paddingHorizontal: spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: adminChrome.shellBorder,
    },
    logoMark: {
      width: 56,
      height: 56,
      borderRadius: radius.lg,
      backgroundColor: c.brand,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.md,
    },
    eyebrow: {
      color: c.brandLight,
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 1.4,
      textTransform: 'uppercase',
      marginBottom: spacing.xs,
    },
    heroTitle: {
      color: adminChrome.text,
      fontSize: 24,
      fontWeight: '800',
      letterSpacing: -0.3,
    },
    body: {
      flex: 1,
      padding: spacing.lg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: {
      fontSize: 18,
      fontWeight: '800',
      color: adminChrome.text,
      textAlign: 'center',
      marginBottom: spacing.sm,
    },
    sub: {
      fontSize: 14,
      color: adminChrome.textMuted,
      textAlign: 'center',
      lineHeight: 22,
      marginBottom: spacing.lg,
    },
    email: { marginTop: spacing.lg, fontSize: 12, color: adminChrome.textMuted },
  });
}
