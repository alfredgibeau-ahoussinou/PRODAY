import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useIsAdmin } from '../../hooks/useIsAdmin';
import { Icon } from '../../components/ui/Icon';
import { useAdminStyles } from '../../components/admin/adminStyles';
import { spacing } from '../../theme/designTokens';
import type { AppColors } from '../../theme/universeTheme';

export const AdminGateScreen: React.FC = () => {
  const { profile, refreshAdminClaim } = useAuth();
  const { claimLoading, needsSetup } = useIsAdmin();
  const { styles: baseStyles, colors: c } = useAdminStyles();
  const styles = useMemo(() => createStyles(c), [c]);

  if (claimLoading) {
    return (
      <View style={styles.loaderRoot}>
        <ActivityIndicator size="large" color={c.brand} />
        <Text style={styles.loaderText}>Vérification des droits admin…</Text>
      </View>
    );
  }

  return (
    <View style={baseStyles.root}>
      <View style={baseStyles.header}>
        <Text style={baseStyles.headerBrand}>PRODAY · ESPACE ADMIN</Text>
        <Text style={baseStyles.headerTitle}>Accès refusé</Text>
      </View>
      <View style={styles.body}>
        <View style={styles.iconWrap}>
          <Icon name="shield" size={40} color={c.brand} />
        </View>
        <Text style={styles.title}>Droits administrateur requis</Text>
        <Text style={styles.sub}>
          {needsSetup
            ? 'Votre compte est reconnu, mais le token Firebase n’a pas encore le claim admin.\n\nExécutez npm run admin:setup sur votre Mac, puis déconnectez-vous et reconnectez-vous.'
            : 'Connectez-vous avec un compte administrateur ProDay pour accéder à cet espace.'}
        </Text>
        <TouchableOpacity style={baseStyles.btn} onPress={() => refreshAdminClaim()}>
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
    loaderRoot: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
    loaderText: { color: c.textSecondary, fontSize: 14 },
    body: { flex: 1, padding: spacing.lg, alignItems: 'center', justifyContent: 'center' },
    iconWrap: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: c.surface,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.lg,
      borderWidth: 2,
      borderColor: c.brand,
    },
    title: {
      fontSize: 18,
      fontWeight: '900',
      color: c.text,
      textAlign: 'center',
      marginBottom: spacing.sm,
    },
    sub: {
      fontSize: 14,
      color: c.textSecondary,
      textAlign: 'center',
      lineHeight: 22,
      marginBottom: spacing.lg,
    },
    email: { marginTop: spacing.lg, fontSize: 12, color: c.textSecondary },
  });
}
