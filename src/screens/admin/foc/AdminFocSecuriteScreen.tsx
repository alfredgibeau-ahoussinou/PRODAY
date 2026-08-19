import React, { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AdminButton } from '../../../components/admin/AdminButton';
import { AdminFocPageHeader } from '../../../components/admin/foc/AdminFocTabs';
import { useAuth } from '../../../context/AuthContext';
import { adminChrome, adminType } from '../../../theme/adminTheme';
import { spacing } from '../../../theme/designTokens';

type Props = {
  onPreviewUserApp?: () => void;
};

/**
 * Sessions admin + rappel des actions irréversibles (toujours confirmées).
 */
export function AdminFocSecuriteScreen({ onPreviewUserApp }: Props) {
  const { profile, firebaseUser, signOut, refreshAdminClaim } = useAuth();
  const [busy, setBusy] = useState(false);
  const styles = useMemo(() => createStyles(), []);

  const refreshToken = async () => {
    setBusy(true);
    try {
      await refreshAdminClaim();
      Alert.alert('Session', 'Jeton admin rafraîchi.');
    } catch {
      Alert.alert('Erreur', 'Impossible de rafraîchir le jeton.');
    } finally {
      setBusy(false);
    }
  };

  const confirmSignOut = () => {
    Alert.alert('Déconnexion', 'Quitter la console admin ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Se déconnecter',
        style: 'destructive',
        onPress: () => {
          void signOut();
        },
      },
    ]);
  };

  return (
    <View style={styles.root}>
      <AdminFocPageHeader
        title="Sécurité"
        subtitle="Session courante et garde-fous sur les suppressions."
      />
      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={styles.kicker}>Session</Text>
          <Text style={styles.title}>{profile?.display_name || 'Admin'}</Text>
          <Text style={styles.meta}>{firebaseUser?.email ?? profile?.email ?? '—'}</Text>
          <Text style={styles.meta}>UID · {profile?.uid ?? '—'}</Text>
          <AdminButton
            label="Rafraîchir le jeton admin"
            variant="secondary"
            size="sm"
            loading={busy}
            disabled={busy}
            onPress={() => void refreshToken()}
          />
          {onPreviewUserApp ? (
            <AdminButton
              label="Prévisualiser l’app utilisateur"
              variant="ghost"
              size="sm"
              onPress={onPreviewUserApp}
            />
          ) : null}
          <AdminButton
            label="Se déconnecter"
            variant="danger"
            size="sm"
            onPress={confirmSignOut}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.kicker}>Actions irréversibles</Text>
          <Text style={styles.bodyText}>
            Toute suppression (compte, club, message, paiement) et tout passage en gratuit
            immédiat demandent une confirmation. Aucun bouton destructif n’exécute l’action
            au premier tap.
          </Text>
          <Text style={styles.bullet}>· Valider / refuser un joueur</Text>
          <Text style={styles.bullet}>· Accorder ou révoquer un abonnement</Text>
          <Text style={styles.bullet}>· Supprimer un club ou une équipe</Text>
          <Text style={styles.bullet}>· Marquer un paiement payé ou le supprimer</Text>
        </View>
      </ScrollView>
    </View>
  );
}

function createStyles() {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: adminChrome.band },
    body: { padding: spacing.md, gap: spacing.md, paddingBottom: 80 },
    card: {
      backgroundColor: adminChrome.shell,
      borderRadius: adminChrome.radius,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: adminChrome.shellBorder,
      padding: spacing.md,
      gap: spacing.sm,
    },
    kicker: {
      fontFamily: adminType.bodyExtra,
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 1.2,
      textTransform: 'uppercase',
      color: adminChrome.accent,
    },
    title: {
      fontFamily: adminType.bodyExtra,
      fontSize: 18,
      fontWeight: '800',
      color: adminChrome.text,
    },
    meta: {
      fontFamily: adminType.body,
      fontSize: 13,
      color: adminChrome.textMuted,
    },
    bodyText: {
      fontFamily: adminType.body,
      fontSize: 13,
      lineHeight: 19,
      color: adminChrome.textSecondary,
    },
    bullet: {
      fontFamily: adminType.body,
      fontSize: 13,
      color: adminChrome.textMuted,
    },
  });
}
