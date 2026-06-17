import React, { useMemo, useState } from 'react';
import { useTranslation } from '../../../context/LocaleContext';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useAuth } from '../../../context/AuthContext';
import { useIsAdmin } from '../../../hooks/useIsAdmin';
import { useAdminData } from '../../../context/AdminDataContext';
import { adminService } from '../../../services/admin.service';
import { AdminPageScaffold } from '../../../components/admin/AdminPageScaffold';
import { AdminSectionHeader } from '../../../components/admin/AdminSectionHeader';
import { Icon } from '../../../components/ui/Icon';
import { PLATFORM_ADMIN_EMAIL } from '../../../config/admin';
import { useAdminStyles } from '../../../components/admin/adminStyles';
import { spacing, radius } from '../../../theme/designTokens';
import type { AppColors } from '../../../theme/universeTheme';

interface AdminSystemPageProps {
  onPreviewUserApp: () => void;
}

export const AdminSystemPage: React.FC<AdminSystemPageProps> = ({ onPreviewUserApp }) => {
  const { t } = useTranslation();
  const { profile, signOut, refreshAdminClaim } = useAuth();
  const { isAdmin } = useIsAdmin();
  const { loading, refresh } = useAdminData();
  const { colors: c } = useAdminStyles();
  const styles = useMemo(() => createStyles(c), [c]);
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
      title={t('admin.system.title')}
      subtitle={t('admin.system.subtitle')}
      loading={loading}
    >
      <AdminSectionHeader title="COMPTE ADMIN" />

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Identifiants plateforme</Text>
        <Text style={styles.cardSub}>
          Email : <Text style={styles.mono}>{PLATFORM_ADMIN_EMAIL}</Text>
          {'\n'}Mot de passe : défini localement via{' '}
          <Text style={styles.mono}>ADMIN_SETUP_PASSWORD</Text> dans votre fichier{' '}
          <Text style={styles.mono}>.env</Text> (jamais committé).
        </Text>
        <Text style={styles.cardSub}>
          Création ou réinitialisation :{' '}
          <Text style={styles.mono}>npm run admin:setup</Text>
        </Text>
      </View>

      <AdminSectionHeader title={t('admin.system.ops')} />

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

      <AdminSectionHeader title={t('admin.system.session')} />

      <TouchableOpacity style={styles.previewBtn} onPress={onPreviewUserApp} activeOpacity={0.88}>
        <Icon name="eye" size={22} color={c.brand} />
        <View style={styles.previewBody}>
          <Text style={styles.previewTitle}>Prévisualiser l’app utilisateur</Text>
          <Text style={styles.previewSub}>
            Ouvrir l’interface membre sans quitter votre session admin
          </Text>
        </View>
        <Icon name="chevron-forward" size={18} color={c.textSecondary} />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.signOutBtn}
        onPress={() => {
          Alert.alert(t('admin.system.logout.title'), t('admin.system.logout.body'), [
            { text: 'Annuler', style: 'cancel' },
            { text: t('admin.system.logout.confirm'), style: 'destructive', onPress: () => void signOut() },
          ]);
        }}
      >
        <Text style={styles.signOutText}>Se déconnecter</Text>
      </TouchableOpacity>
    </AdminPageScaffold>
  );
};

function createStyles(c: AppColors) {
  return StyleSheet.create({
    card: {
      backgroundColor: c.surface,
      borderRadius: radius.lg,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: c.border,
      marginBottom: spacing.md,
    },
    cardTitle: { fontSize: 15, fontWeight: '900', color: c.text, marginBottom: spacing.xs },
    cardSub: { fontSize: 13, color: c.textSecondary, lineHeight: 20, marginBottom: spacing.md },
    mono: { fontFamily: 'monospace', fontSize: 12 },
    btn: {
      backgroundColor: c.ink,
      borderRadius: radius.md,
      padding: spacing.md,
      alignItems: 'center',
    },
    btnDisabled: { opacity: 0.6 },
    btnText: { color: c.brandInverse, fontWeight: '900', fontSize: 14 },
    btnOutline: {
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: radius.md,
      padding: spacing.md,
      alignItems: 'center',
    },
    btnOutlineText: { color: c.text, fontWeight: '800', fontSize: 14 },
    previewBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      backgroundColor: c.surface,
      borderRadius: radius.lg,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: c.border,
      marginBottom: spacing.md,
    },
    previewBody: { flex: 1 },
    previewTitle: { fontSize: 14, fontWeight: '900', color: c.text },
    previewSub: { fontSize: 12, color: c.textSecondary, marginTop: 2 },
    signOutBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      padding: spacing.md,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: c.error,
      backgroundColor: c.errorBg,
    },
    signOutText: { color: c.error, fontWeight: '900', fontSize: 14 },
  });
}
