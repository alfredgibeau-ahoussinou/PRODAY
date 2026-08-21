import React, { useEffect, useState } from 'react';
import { Alert, Linking, ScrollView, StyleSheet, Switch, View } from 'react-native';
import {
  AdminBadge,
  AdminButton,
  AdminCard,
  AdminLoading,
  AdminText,
} from '../ui/adminUi';
import { ADMIN_TOKENS } from '../theme/adminTokens';
import { adminSpace } from '../theme/adminDesignSystem';
import { adminService } from '../../../services/admin.service';
import type { PlatformConfig } from '../../../models/PlatformConfig';
import { useAuth } from '../../../context/AuthContext';

export function AdminSystemPane({ onPreviewUserApp }: { onPreviewUserApp: () => void }) {
  const t = ADMIN_TOKENS;
  const { firebaseUser, profile, signOut } = useAuth();
  const [config, setConfig] = useState<PlatformConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void adminService
      .getPlatformConfig()
      .then(setConfig)
      .finally(() => setLoading(false));
  }, []);

  const toggleMaintenance = (value: boolean) => {
    if (!config || !firebaseUser?.uid) return;
    Alert.alert(
      value ? 'Activer la maintenance ?' : 'Désactiver la maintenance ?',
      'Confirmation requise. Visible par tous les utilisateurs non-admin.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: () => {
            void (async () => {
              setSaving(true);
              try {
                await adminService.updatePlatformConfig(
                  { maintenance_mode: value },
                  firebaseUser.uid,
                  profile?.email ?? undefined,
                );
                setConfig((prev) =>
                  prev ? { ...prev, maintenance_mode: value } : prev,
                );
              } catch (e) {
                Alert.alert('Erreur', e instanceof Error ? e.message : 'Échec');
              } finally {
                setSaving(false);
              }
            })();
          },
        },
      ],
    );
  };

  if (loading) return <AdminLoading />;

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content}>
      <AdminText variant="h1">Système</AdminText>
      <AdminText variant="caption" color={t.muted}>
        Configuration globale · session admin · pont site fondateurs
      </AdminText>

      <AdminCard>
        <AdminText variant="h2">Session</AdminText>
        <AdminText variant="body" color={t.muted}>
          {profile?.email ?? firebaseUser?.email ?? '—'}
        </AdminText>
        <AdminBadge label="claim admin" tone="accent" />
        <View style={styles.row}>
          <AdminButton label="Voir comme utilisateur" variant="soft" onPress={onPreviewUserApp} />
          <AdminButton label="Déconnexion" variant="ghost" onPress={() => void signOut()} />
        </View>
      </AdminCard>

      <AdminCard>
        <AdminText variant="h2">Mode maintenance</AdminText>
        <View style={styles.switchRow}>
          <AdminText variant="body">Bloquer l’app (hors admins)</AdminText>
          <Switch
            value={!!config?.maintenance_mode}
            onValueChange={toggleMaintenance}
            disabled={saving || !config}
          />
        </View>
      </AdminCard>

      <AdminCard>
        <AdminText variant="h2">Website fondateurs</AdminText>
        <AdminText variant="body" color={t.muted}>
          Bêta, trafic, e-mails et PIN fondateurs restent sur proday75.fr/admin (surface séparée).
        </AdminText>
        <AdminButton
          label="Ouvrir /admin"
          variant="primary"
          onPress={() => void Linking.openURL('https://proday75.fr/admin')}
        />
      </AdminCard>

      <AdminCard>
        <AdminText variant="h2">Versions</AdminText>
        <AdminText variant="caption" color={t.muted}>
          Admin Control Center app · fondation v1
        </AdminText>
      </AdminCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: adminSpace.lg, gap: adminSpace.lg, paddingBottom: 48 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
});
