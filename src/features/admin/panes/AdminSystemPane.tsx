import React, { useEffect, useState } from 'react';
import { Alert, Linking, ScrollView, StyleSheet, Switch, TextInput, View } from 'react-native';
import { AdminModalSheet } from '../motion';
import {
  AdminBadge,
  AdminButton,
  AdminCard,
  AdminLoading,
  AdminPaneHeader,
  AdminText,
} from '../ui/adminUi';
import { ADMIN_TOKENS } from '../theme/adminTokens';
import { adminLayout, adminRadius, adminSpace } from '../theme/adminDesignSystem';
import { adminService } from '../../../services/admin.service';
import type { PlatformConfig } from '../../../models/PlatformConfig';
import { useAuth } from '../../../context/AuthContext';
import { canAdminUi, resolveAdminUiRole } from '../utils/adminRbac';
import { confirmAdminAction } from '../utils/confirmAdminAction';

export function AdminSystemPane({ onPreviewUserApp, focusId }: { onPreviewUserApp: () => void; focusId?: string }) {
  const [godModeContext, setGodModeContext] = useState(
    focusId === 'push' ? 'push' : null
  );
  useEffect(() => {
    if (focusId === 'push') setGodModeContext(focusId);
  }, [focusId]);
  const t = ADMIN_TOKENS;
  const { firebaseUser, profile, signOut } = useAuth();
  const [config, setConfig] = useState<PlatformConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [maintMsg, setMaintMsg] = useState('');
  const uiRole = resolveAdminUiRole(profile?.email);
  const canMaint = canAdminUi(profile?.email, 'maintenance');
  const canImpersonate = canAdminUi(profile?.email, 'impersonate');

  useEffect(() => {
    void adminService
      .getPlatformConfig()
      .then((c) => {
        setConfig(c);
        setMaintMsg(c?.maintenance_message ?? '');
      })
      .finally(() => setLoading(false));
  }, []);

  const toggleMaintenance = (value: boolean) => {
    if (!config || !firebaseUser?.uid || !canMaint) return;
    confirmAdminAction(
      value ? 'Activer la maintenance ?' : 'Désactiver la maintenance ?',
      'Visible par tous les utilisateurs non-admin.',
      async () => {
        setSaving(true);
        try {
          await adminService.updatePlatformConfig(
            { maintenance_mode: value },
            firebaseUser.uid,
            profile?.email ?? undefined,
          );
          setConfig((prev) => (prev ? { ...prev, maintenance_mode: value } : prev));
        } catch (e) {
          Alert.alert('Erreur', e instanceof Error ? e.message : 'Échec');
        } finally {
          setSaving(false);
        }
      },
      value,
    );
  };

  const saveMessage = () => {
    if (!firebaseUser?.uid || !canMaint) return;
    confirmAdminAction('Enregistrer le message maintenance ?', maintMsg.slice(0, 80), async () => {
      setSaving(true);
      try {
        await adminService.updatePlatformConfig(
          { maintenance_message: maintMsg.trim() },
          firebaseUser.uid,
          profile?.email ?? undefined,
        );
        setConfig((prev) =>
          prev ? { ...prev, maintenance_message: maintMsg.trim() } : prev,
        );
      } catch (e) {
        Alert.alert('Erreur', e instanceof Error ? e.message : 'Échec');
      } finally {
        setSaving(false);
      }
    });
  };

  if (loading) return <AdminLoading />;

  return (
    <>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content}>
      <AdminPaneHeader
        title="Système"
        subtitle="Config globale · RBAC UI · impersonation · site fondateurs"
      />

      <AdminCard>
        <AdminText variant="h2">Session</AdminText>
        <AdminText variant="body" color={t.muted}>
          {profile?.email ?? firebaseUser?.email ?? '—'}
        </AdminText>
        <View style={styles.row}>
          <AdminBadge label="claim admin" tone="accent" />
          <AdminBadge label={`UI ${uiRole}`} tone="info" />
        </View>
        <View style={styles.row}>
          {canImpersonate ? (
            <AdminButton
              label="Voir comme utilisateur"
              variant="soft"
              onPress={onPreviewUserApp}
            />
          ) : null}
          <AdminButton label="Déconnexion" variant="ghost" onPress={() => void signOut()} />
        </View>
      </AdminCard>

      <AdminCard>
        <AdminText variant="h2">RBAC multi-admins (UI)</AdminText>
        <AdminText variant="body" color={t.muted}>
          Le claim Firebase `admin` reste le garde-fou serveur. Les rôles UI (super / finance /
          support / ops) limitent seulement l’affichage des actions. Étendre via
          ADMIN_UI_ROLE_BY_EMAIL sans changer le claim.
        </AdminText>
      </AdminCard>

      <AdminCard>
        <AdminText variant="h2">Mode maintenance</AdminText>
        <View style={styles.switchRow}>
          <AdminText variant="body">Bloquer l’app (hors admins)</AdminText>
          <Switch
            value={!!config?.maintenance_mode}
            onValueChange={toggleMaintenance}
            disabled={saving || !config || !canMaint}
          />
        </View>
        <AdminText variant="label" color={t.faint}>
          Message affiché
        </AdminText>
        <TextInput
          value={maintMsg}
          onChangeText={setMaintMsg}
          editable={canMaint}
          multiline
          placeholderTextColor={t.faint}
          style={[
            styles.input,
            {
              color: t.foreground,
              borderColor: t.border,
              backgroundColor: t.surfaceRaised,
            },
          ]}
        />
        {canMaint ? (
          <AdminButton
            label={saving ? '…' : 'Enregistrer message'}
            disabled={saving}
            onPress={saveMessage}
          />
        ) : null}
      </AdminCard>

      <AdminCard>
        <AdminText variant="h2">Website fondateurs</AdminText>
        <AdminText variant="body" color={t.muted}>
          Bêta, trafic, e-mails et PIN fondateurs restent sur proday75.fr/admin.
        </AdminText>
        <AdminButton
          label="Ouvrir /admin"
          variant="primary"
          onPress={() => void Linking.openURL('https://proday75.fr/admin')}
        />
      </AdminCard>
    </ScrollView>
    {/* GOD MODE: Push Notifications */}
    <AdminModalSheet
        visible={godModeContext === 'push'}
        onClose={() => setGodModeContext(null)}
      >
        <ScrollView style={{ padding: adminSpace.lg, gap: 16 }}>
          <AdminText variant="h2" style={{ color: ADMIN_TOKENS.accent }}>📣 Notifications Système</AdminText>
          <AdminText variant="body" muted style={{ marginBottom: 12 }}>Envoyer un Push à tous les utilisateurs (ou segments)</AdminText>
          <AdminCard>
             <AdminText variant="h3">Nouveau Push Global</AdminText>
             <View style={{ gap: 8, marginTop: 8 }}>
               <TextInput placeholder="Titre (ex: Mise à jour majeure !)" style={{ borderWidth: 1, borderColor: t.border, padding: 12, borderRadius: 8, color: t.foreground }} placeholderTextColor={t.muted} />
               <TextInput multiline placeholder="Message..." style={{ borderWidth: 1, borderColor: t.border, padding: 12, borderRadius: 8, color: t.foreground, height: 80 }} placeholderTextColor={t.muted} />
               <AdminButton label="Diffuser à tout le monde" variant="danger" onPress={() => Alert.alert('Envoyé', 'La notification a été diffusée à toute la base de données.')} />
             </View>
          </AdminCard>
          <AdminCard>
             <AdminText variant="h3">Push par Rôle</AdminText>
             <View style={{ gap: 8, marginTop: 8 }}>
               <AdminButton label="Envoyer aux Coachs uniquement" onPress={() => {}} />
               <AdminButton label="Envoyer aux Joueurs uniquement" onPress={() => {}} />
             </View>
          </AdminCard>
        </ScrollView>
    </AdminModalSheet>
    </>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: adminLayout.pageGutter,
    gap: adminLayout.sectionGap,
    paddingBottom: adminLayout.dockClearance,
  },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: adminRadius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    minHeight: 72,
    marginBottom: 8,
  },
});
