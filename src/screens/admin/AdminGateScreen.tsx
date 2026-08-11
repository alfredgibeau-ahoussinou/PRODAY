import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useIsAdmin } from '../../hooks/useIsAdmin';
import { PressableSpring } from '../../components/motion';
import { PLATFORM_ADMIN_EMAIL } from '../../config/admin';
import { useAdminStyles, adminChrome } from '../../components/admin/adminStyles';
import { spacing, radius } from '../../theme/designTokens';
import type { AppColors } from '../../theme/universeTheme';

export const AdminGateScreen: React.FC = () => {
  const { profile, refreshAdminClaim } = useAuth();
  const { claimLoading, needsSetup } = useIsAdmin();
  const { colors: c } = useAdminStyles();
  const styles = useMemo(() => createStyles(c), [c]);

  if (claimLoading) {
    return (
      <View style={styles.loaderRoot} testID="admin-gate-loading">
        <ActivityIndicator size="large" color={c.brand} />
        <Text style={styles.loaderText}>Vérification des droits…</Text>
      </View>
    );
  }

  return (
    <View style={styles.root} testID="admin-gate">
      <View style={styles.hero}>
        <View style={styles.logoMark}>
          <Text style={styles.logoLetter}>P</Text>
        </View>
        <Text style={styles.brand}>ProDay</Text>
        <Text style={styles.heroTitle}>{needsSetup ? 'Configuration requise' : 'Accès refusé'}</Text>
      </View>
      <View style={styles.body}>
        <View style={styles.card}>
          <Text style={styles.title}>Droits administrateur requis</Text>
          <Text style={styles.sub}>
            {needsSetup
              ? `Votre compte (${PLATFORM_ADMIN_EMAIL}) est reconnu, mais le jeton Firebase n’a pas encore le droit administrateur.\n\nExécutez npm run admin:setup, puis reconnectez-vous.`
              : `Connectez-vous avec le compte administrateur (${PLATFORM_ADMIN_EMAIL}).`}
          </Text>
          <PressableSpring
            style={styles.btn}
            onPress={() => refreshAdminClaim()}
            scaleTo={0.97}
            haptic
            testID="admin-gate-refresh"
          >
            <Text style={styles.btnText}>Rafraîchir le jeton</Text>
          </PressableSpring>
          {profile?.email ? (
            <Text style={styles.email}>Connecté : {profile.email}</Text>
          ) : null}
        </View>
      </View>
    </View>
  );
};

function createStyles(c: AppColors) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: c.background },
    loaderRoot: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.md,
      backgroundColor: c.background,
    },
    loaderText: { color: c.textMuted, fontSize: 14 },
    hero: {
      alignItems: 'center',
      paddingTop: spacing.xxl + spacing.lg,
      paddingBottom: spacing.xl,
      paddingHorizontal: spacing.lg,
      backgroundColor: adminChrome.shellElevated,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: adminChrome.shellBorder,
    },
    logoMark: {
      width: 56,
      height: 56,
      borderRadius: 16,
      backgroundColor: adminChrome.accent,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.md,
    },
    logoLetter: { color: '#FFFFFF', fontSize: 26, fontWeight: '900' },
    brand: {
      color: adminChrome.accent,
      fontSize: 12,
      fontWeight: '900',
      letterSpacing: 2,
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
      marginTop: -spacing.lg,
    },
    card: {
      backgroundColor: '#FFFFFF',
      borderRadius: radius.xl,
      borderWidth: 1,
      borderColor: c.border,
      padding: spacing.lg,
      gap: spacing.md,
    },
    title: {
      fontSize: 17,
      fontWeight: '800',
      color: c.text,
      textAlign: 'center',
    },
    sub: {
      fontSize: 14,
      color: c.textMuted,
      textAlign: 'center',
      lineHeight: 22,
    },
    btn: {
      backgroundColor: adminChrome.accent,
      borderRadius: radius.lg,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.xl,
      alignItems: 'center',
    },
    btnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 14 },
    email: { fontSize: 12, color: c.textMuted, textAlign: 'center' },
  });
}
