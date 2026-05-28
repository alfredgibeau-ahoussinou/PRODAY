import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useAuth } from '../../../context/AuthContext';
import { useIsAdmin } from '../../../hooks/useIsAdmin';
import { useAdminData } from '../../../context/AdminDataContext';
import { adminService } from '../../../services/admin.service';
import { AdminPageScaffold } from '../../../components/admin/AdminPageScaffold';
import { AdminSectionHeader } from '../../../components/admin/AdminSectionHeader';
import { Icon } from '../../../components/ui/Icon';
import { colors, spacing, radius } from '../../../theme/designTokens';

interface AdminSystemPageProps {
  onPreviewUserApp: () => void;
}

export const AdminSystemPage: React.FC<AdminSystemPageProps> = ({ onPreviewUserApp }) => {
  const { profile, signOut, refreshAdminClaim } = useAuth();
  const { isAdmin } = useIsAdmin();
  const { loading, refresh } = useAdminData();
  const [systemBusy, setSystemBusy] = useState(false);

  const handleRefreshPublicStats = async () => {
    setSystemBusy(true);
    try {
      const published = await adminService.refreshPublicStats();
      Alert.alert(
        'Stats Discover',
        `Publiées : ${published.players} joueurs, ${published.coaches} coachs, ${published.recruitment_posts_open} annonces ouvertes.`
      );
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Publication impossible.');
    } finally {
      setSystemBusy(false);
    }
  };

  return (
    <AdminPageScaffold
      title="Système"
      subtitle="Opérations plateforme · prévisualisation · session"
      loading={loading}
    >
      <AdminSectionHeader title="OPÉRATIONS" />

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Stats page Discover</Text>
        <Text style={styles.cardSub}>
          Recalcule joueurs, coachs, agents, clubs et annonces ouvertes dans{' '}
          <Text style={styles.mono}>platform_stats/recruitment</Text>.
        </Text>
        <TouchableOpacity
          style={[styles.btn, systemBusy && styles.btnDisabled]}
          onPress={() => void handleRefreshPublicStats()}
          disabled={systemBusy}
        >
          <Text style={styles.btnText}>
            {systemBusy ? 'Publication…' : 'Publier les stats Discover'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Cloud Functions</Text>
        <Text style={styles.cardSub}>
          Création/suppression utilisateurs, validation profils et push nécessitent le plan Blaze et{' '}
          <Text style={styles.mono}>npm run firebase:deploy:functions</Text>.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Token admin</Text>
        <Text style={styles.cardSub}>
          Claim actif : {isAdmin ? 'oui' : 'non'}. Email : {profile?.email ?? '—'}
        </Text>
        <TouchableOpacity
          style={styles.btnOutline}
          onPress={() => {
            void refreshAdminClaim().then(() => refresh());
          }}
        >
          <Text style={styles.btnOutlineText}>Rafraîchir le token admin</Text>
        </TouchableOpacity>
      </View>

      <AdminSectionHeader title="SESSION & APERÇU" />

      <TouchableOpacity style={styles.previewBtn} onPress={onPreviewUserApp} activeOpacity={0.88}>
        <Icon name="eye" size={22} color={colors.accent} />
        <View style={styles.previewBody}>
          <Text style={styles.previewTitle}>Prévisualiser l’app utilisateur</Text>
          <Text style={styles.previewSub}>
            Ouvrir l’interface membre sans quitter votre session admin
          </Text>
        </View>
        <Icon name="chevron-forward" size={18} color={colors.textSecondary} />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.signOutBtn}
        onPress={() => {
          Alert.alert('Déconnexion', 'Quitter l’espace admin ?', [
            { text: 'Annuler', style: 'cancel' },
            { text: 'Se déconnecter', style: 'destructive', onPress: () => void signOut() },
          ]);
        }}
      >
        <Text style={styles.signOutText}>Se déconnecter</Text>
      </TouchableOpacity>
    </AdminPageScaffold>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  cardTitle: { fontSize: 15, fontWeight: '900', color: colors.text, marginBottom: spacing.xs },
  cardSub: { fontSize: 13, color: colors.textSecondary, lineHeight: 20, marginBottom: spacing.md },
  mono: { fontFamily: 'monospace', fontSize: 12 },
  btn: {
    backgroundColor: colors.ink,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: colors.brandInverse, fontWeight: '900', fontSize: 14 },
  btnOutline: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
  },
  btnOutlineText: { color: colors.text, fontWeight: '800', fontSize: 14 },
  previewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  previewBody: { flex: 1 },
  previewTitle: { fontSize: 14, fontWeight: '900', color: colors.text },
  previewSub: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.error,
    backgroundColor: colors.errorBg,
  },
  signOutText: { color: colors.error, fontWeight: '900', fontSize: 14 },
});
