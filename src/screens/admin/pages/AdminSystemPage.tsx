import React, { useMemo, useState } from 'react';
import { useTranslation } from '../../../context/LocaleContext';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useAuth } from '../../../context/AuthContext';
import { useIsAdmin } from '../../../hooks/useIsAdmin';
import { useAdminData } from '../../../context/AdminDataContext';
import { adminService } from '../../../services/admin.service';
import { adminAuditService } from '../../../services/adminAudit.service';
import { AdminPageScaffold } from '../../../components/admin/AdminPageScaffold';
import { AdminAuditLogPanel } from '../../../components/admin/AdminAuditLogPanel';
import { AdminSettingsCard } from '../../../components/admin/AdminSettingsCard';
import { AdminSectionHeader } from '../../../components/admin/AdminSectionHeader';
import { Icon } from '../../../components/ui/Icon';
import { PLATFORM_ADMIN_EMAIL } from '../../../config/admin';
import { useAdminStyles } from '../../../components/admin/adminStyles';
import { spacing, radius, shadows } from '../../../theme/designTokens';
import type { AppColors } from '../../../theme/universeTheme';

interface AdminSystemPageProps {
  onPreviewUserApp: () => void;
}

export const AdminSystemPage: React.FC<AdminSystemPageProps> = ({ onPreviewUserApp }) => {
  const { t } = useTranslation();
  const { profile, signOut, refreshAdminClaim, firebaseUser } = useAuth();
  const { isAdmin } = useIsAdmin();
  const { loading, refresh, dailySnapshots, stats } = useAdminData();
  const { colors: c } = useAdminStyles();
  const styles = useMemo(() => createStyles(c), [c]);
  const [systemBusy, setSystemBusy] = useState(false);

  const handleRefreshPublicStats = async () => {
    setSystemBusy(true);
    try {
      const published = await adminService.refreshPublicStats();
      Alert.alert(
        'Stats Discover',
        `Publiées : ${published.players} joueurs, ${published.coaches} coachs, ${published.recruitment_posts_open} annonces ouvertes.`,
      );
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Publication impossible.');
    } finally {
      setSystemBusy(false);
    }
  };

  const handleForceSnapshot = async () => {
    setSystemBusy(true);
    try {
      const s = await adminService.getPlatformStats();
      await adminService.recordDailyPlatformSnapshot(s);
      await adminAuditService.log({
        action: 'snapshot_recorded',
        actor_uid: profile?.uid ?? '',
        actor_email: firebaseUser?.email ?? profile?.email,
        target_type: 'platform_stats_daily',
        target_id: new Date().toISOString().slice(0, 10),
        summary: 'Snapshot plateforme enregistré manuellement',
      });
      await refresh();
      Alert.alert('Snapshot', 'Snapshot du jour enregistré.');
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Échec snapshot.');
    } finally {
      setSystemBusy(false);
    }
  };

  return (
    <AdminPageScaffold loading={loading}>
      <AdminSectionHeader title="Compte admin" />

      <AdminSettingsCard icon="shield" title="Identifiants plateforme">
        <Text style={styles.bodyText}>
          Email : <Text style={styles.mono}>{PLATFORM_ADMIN_EMAIL}</Text>
        </Text>
        <Text style={styles.bodyText}>
          Mot de passe via <Text style={styles.mono}>ADMIN_SETUP_PASSWORD</Text> dans{' '}
          <Text style={styles.mono}>.env</Text>
        </Text>
        <Text style={styles.bodyText}>
          Setup : <Text style={styles.mono}>npm run admin:setup</Text>
        </Text>
      </AdminSettingsCard>

      <AdminSectionHeader title="Analytics & snapshots" />

      <AdminSettingsCard
        icon="star-four-points"
        title="Snapshots quotidiens"
        actionLabel={systemBusy ? 'Enregistrement…' : 'Forcer snapshot du jour'}
        onAction={() => void handleForceSnapshot()}
        actionDisabled={systemBusy}
      >
        <Text style={styles.bodyText}>
          {dailySnapshots.length > 0
            ? `Dernier : ${dailySnapshots[0]?.day_key} · ${dailySnapshots[0]?.users ?? 0} utilisateurs`
            : 'Aucun snapshot enregistré.'}
        </Text>
        {stats ? (
          <Text style={styles.bodyText}>
            État actuel : {stats.users} users · {stats.teamEvents} events · charge modération{' '}
            {stats.pendingVerifications + stats.pendingCommunityReels + stats.reelReports}.
          </Text>
        ) : null}
      </AdminSettingsCard>

      <AdminSectionHeader title={t('admin.system.ops')} />

      <AdminSettingsCard
        icon="business"
        title="Stats page Discover"
        actionLabel={systemBusy ? 'Publication…' : 'Publier les stats Discover'}
        onAction={() => void handleRefreshPublicStats()}
        actionDisabled={systemBusy}
      >
        <Text style={styles.bodyText}>
          Recalcule joueurs, coachs, agents, clubs et annonces dans{' '}
          <Text style={styles.mono}>platform_stats/recruitment</Text>.
        </Text>
      </AdminSettingsCard>

      <AdminSettingsCard icon="settings" title="Cloud Functions">
        <Text style={styles.bodyText}>
          Création utilisateurs, validation profils et push nécessitent Blaze +{' '}
          <Text style={styles.mono}>npm run firebase:deploy:functions</Text>.
        </Text>
      </AdminSettingsCard>

      <AdminSettingsCard
        icon="shield"
        title="Token admin"
        actionLabel="Rafraîchir le token"
        onAction={() => void refreshAdminClaim().then(() => refresh())}
      >
        <Text style={styles.bodyText}>
          Claim actif : {isAdmin ? 'oui' : 'non'} · {profile?.email ?? '—'}
        </Text>
      </AdminSettingsCard>

      <AdminSectionHeader title={t('admin.system.session')} />

      <TouchableOpacity style={styles.previewBtn} onPress={onPreviewUserApp} activeOpacity={0.88}>
        <View style={styles.previewIcon}>
          <Icon name="eye" size={20} color={c.brand} />
        </View>
        <View style={styles.previewBody}>
          <Text style={styles.previewTitle}>Prévisualiser l’app utilisateur</Text>
          <Text style={styles.previewSub}>Interface membre sans quitter la session admin</Text>
        </View>
        <Icon name="chevron-forward" size={18} color={c.textMuted} />
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

      <AdminAuditLogPanel />
    </AdminPageScaffold>
  );
};

function createStyles(c: AppColors) {
  return StyleSheet.create({
    bodyText: { fontSize: 13, color: c.textSecondary, lineHeight: 20 },
    mono: { fontFamily: 'monospace', fontSize: 12, color: c.text },
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
      ...shadows.card,
    },
    previewIcon: {
      width: 40,
      height: 40,
      borderRadius: radius.md,
      backgroundColor: c.brandSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    previewBody: { flex: 1 },
    previewTitle: { fontSize: 14, fontWeight: '800', color: c.text },
    previewSub: { fontSize: 12, color: c.textSecondary, marginTop: 2 },
    signOutBtn: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing.md,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: c.error,
      backgroundColor: c.errorBg,
      marginBottom: spacing.lg,
    },
    signOutText: { color: c.error, fontWeight: '800', fontSize: 14 },
  });
}
