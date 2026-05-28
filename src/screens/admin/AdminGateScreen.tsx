import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useIsAdmin } from '../../hooks/useIsAdmin';
import { Icon } from '../../components/ui/Icon';
import { colors, spacing, radius } from '../../theme/designTokens';

export const AdminGateScreen: React.FC = () => {
  const { profile, refreshAdminClaim } = useAuth();
  const { claimLoading, needsSetup } = useIsAdmin();

  if (claimLoading) {
    return (
      <View style={styles.loaderRoot}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={styles.loaderText}>Vérification des droits admin…</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.headerBrand}>PRODAY · ESPACE ADMIN</Text>
        <Text style={styles.headerTitle}>Accès refusé</Text>
      </View>
      <View style={styles.body}>
        <View style={styles.iconWrap}>
          <Icon name="shield" size={40} color={colors.accent} />
        </View>
        <Text style={styles.title}>Droits administrateur requis</Text>
        <Text style={styles.sub}>
          {needsSetup
            ? 'Votre compte est reconnu, mais le token Firebase n’a pas encore le claim admin.\n\nExécutez npm run admin:setup sur votre Mac, puis déconnectez-vous et reconnectez-vous.'
            : 'Connectez-vous avec un compte administrateur ProDay pour accéder à cet espace.'}
        </Text>
        <TouchableOpacity style={styles.btn} onPress={() => refreshAdminClaim()}>
          <Text style={styles.btnText}>Rafraîchir le token</Text>
        </TouchableOpacity>
        {profile?.email ? (
          <Text style={styles.email}>Connecté : {profile.email}</Text>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.backgroundAlt },
  loaderRoot: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  loaderText: { color: colors.textSecondary, fontSize: 14 },
  header: {
    backgroundColor: colors.surfaceInverse,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.lg,
    borderBottomWidth: 3,
    borderBottomColor: colors.accent,
  },
  headerBrand: {
    color: colors.accent,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: spacing.sm,
  },
  headerTitle: { color: colors.brandInverse, fontSize: 22, fontWeight: '900' },
  body: { flex: 1, padding: spacing.lg, alignItems: 'center', justifyContent: 'center' },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    borderWidth: 2,
    borderColor: colors.accent,
  },
  title: { fontSize: 18, fontWeight: '900', color: colors.text, textAlign: 'center', marginBottom: spacing.sm },
  sub: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  btn: {
    backgroundColor: colors.ink,
    borderRadius: radius.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  btnText: { color: colors.brandInverse, fontWeight: '900', fontSize: 14 },
  email: { marginTop: spacing.lg, fontSize: 12, color: colors.textSecondary },
});
