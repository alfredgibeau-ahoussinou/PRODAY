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
import { adminAuditService } from '../../../services/adminAudit.service';

export function AdminSystemPane({
  onPreviewUserApp,
  focusId,
}: {
  onPreviewUserApp: () => void;
  focusId?: string;
}) {
  const [godModeContext, setGodModeContext] = useState(
    focusId === 'push' ? 'push' : null,
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
  const [pushTitle, setPushTitle] = useState('');
  const [pushBody, setPushBody] = useState('');
  const [pushBusy, setPushBusy] = useState(false);
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

  const broadcast = (roles?: string[]) => {
    if (!firebaseUser?.uid) return;
    const title = pushTitle.trim();
    const body = pushBody.trim();
    if (!title || !body) {
      Alert.alert('Champs requis', 'Titre et message obligatoires.');
      return;
    }
    const label = roles?.length ? roles.join(', ') : 'tous';
    confirmAdminAction(
      `Diffuser (${label}) ?`,
      'Écriture platform_feed → push FCM via Cloud Function.',
      async () => {
        setPushBusy(true);
        try {
          const id = await adminService.createPlatformFeedNews({
            author_uid: firebaseUser.uid,
            author_name: profile?.display_name || profile?.email || 'Admin ProDay',
            title,
            body,
            audience: 'all',
            notify_roles: roles,
          });
          await adminAuditService.log({
            action: 'other',
            actor_uid: firebaseUser.uid,
            actor_email: profile?.email ?? undefined,
            target_type: 'platform_feed',
            target_id: id,
            summary: `Broadcast fil · ${label} · ${title}`,
          });
          Alert.alert('Diffusé', `Publication ${id} créée — push en cours côté Functions.`);
          setPushTitle('');
          setPushBody('');
          setGodModeContext(null);
        } catch (e) {
          Alert.alert('Erreur', e instanceof Error ? e.message : 'Échec diffusion');
        } finally {
          setPushBusy(false);
        }
      },
      true,
    );
  };

  if (loading) return <AdminLoading />;

  return (
    <>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content}>
        <AdminPaneHeader
          title="Système"
          subtitle="Config globale · RBAC UI · impersonation · site fondateurs"
          right={
            <AdminButton
              label="Push"
              variant="soft"
              onPress={() => setGodModeContext('push')}
            />
          }
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

      <AdminModalSheet
        visible={godModeContext === 'push'}
        onClose={() => setGodModeContext(null)}
      >
        <ScrollView style={{ padding: adminSpace.lg }} contentContainerStyle={{ gap: 16 }}>
          <AdminText variant="h2" style={{ color: ADMIN_TOKENS.accent }}>
            Notifications système
          </AdminText>
          <AdminText variant="body" muted>
            Crée une news `platform_feed` — la Function `onPlatformFeedCreated` envoie les push.
          </AdminText>
          <AdminCard>
            <AdminText variant="h3">Nouveau push</AdminText>
            <View style={{ gap: 8, marginTop: 8 }}>
              <TextInput
                value={pushTitle}
                onChangeText={setPushTitle}
                placeholder="Titre"
                placeholderTextColor={t.muted}
                style={{
                  borderWidth: 1,
                  borderColor: t.border,
                  padding: 12,
                  borderRadius: 8,
                  color: t.foreground,
                }}
              />
              <TextInput
                value={pushBody}
                onChangeText={setPushBody}
                multiline
                placeholder="Message…"
                placeholderTextColor={t.muted}
                style={{
                  borderWidth: 1,
                  borderColor: t.border,
                  padding: 12,
                  borderRadius: 8,
                  color: t.foreground,
                  height: 80,
                }}
              />
              <AdminButton
                label={pushBusy ? '…' : 'Diffuser à tout le monde'}
                variant="danger"
                disabled={pushBusy}
                onPress={() => broadcast()}
              />
            </View>
          </AdminCard>
          <AdminCard>
            <AdminText variant="h3">Push par rôle</AdminText>
            <View style={{ gap: 8, marginTop: 8 }}>
              <AdminButton
                label="Coachs uniquement"
                disabled={pushBusy}
                onPress={() => broadcast(['coach'])}
              />
              <AdminButton
                label="Joueurs uniquement"
                disabled={pushBusy}
                onPress={() => broadcast(['player'])}
              />
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
