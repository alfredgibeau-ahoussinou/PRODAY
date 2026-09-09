import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import {
  AdminBadge,
  AdminButton,
  AdminCard,
  AdminEmptyState,
  AdminLoading,
  AdminPaneHeader,
  AdminText,
} from '../ui/adminUi';
import { ADMIN_TOKENS } from '../theme/adminTokens';
import { adminLayout, adminSpace } from '../theme/adminDesignSystem';
import { adminAuditService, type AdminAuditEntry } from '../../../services/adminAudit.service';
import { useAdminData } from '../data/AdminDataContext';
import { AdminModalSheet } from '../motion';
import { adminService } from '../../../services/admin.service';
import { useAuth } from '../../../context/AuthContext';
import { confirmAdminAction } from '../utils/confirmAdminAction';

const HARD_DELETE_COLLECTIONS = [
  { id: 'community_reels', label: 'Reel communauté' },
  { id: 'platform_feed', label: 'Fil plateforme' },
  { id: 'reel_reports', label: 'Signalement' },
  { id: 'recruitment_posts', label: 'Annonce recrutement' },
  { id: 'club_announcements', label: 'Annonce club' },
] as const;

export function AdminSecurityPane({ focusId }: { focusId?: string }) {
  const [godModeContext, setGodModeContext] = useState(
    focusId === 'moderation' ? 'moderation' : null,
  );
  useEffect(() => {
    if (focusId === 'moderation') {
      setGodModeContext(focusId);
    }
  }, [focusId]);
  const data = useAdminData();
  const { firebaseUser, profile } = useAuth();
  const t = ADMIN_TOKENS;
  const [logs, setLogs] = useState<AdminAuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [entityId, setEntityId] = useState('');
  const [collectionName, setCollectionName] =
    useState<(typeof HARD_DELETE_COLLECTIONS)[number]['id']>('community_reels');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void adminAuditService
      .listRecent(60)
      .then(setLogs)
      .finally(() => setLoading(false));
  }, [data.lastRefreshedAt]);

  const hardDelete = () => {
    if (!entityId.trim()) {
      Alert.alert('ID requis', 'Indiquez l’ID Firestore du contenu.');
      return;
    }
    confirmAdminAction(
      'Hard delete ?',
      `${collectionName}/${entityId.trim()}`,
      async () => {
        setBusy(true);
        try {
          await adminService.hardDeleteEntity(collectionName, entityId.trim(), {
            uid: firebaseUser?.uid ?? 'admin',
            email: profile?.email ?? undefined,
          });
          Alert.alert('Supprimé', 'Document retiré de Firestore.');
          setEntityId('');
          await data.refresh();
        } catch (e) {
          Alert.alert('Erreur', e instanceof Error ? e.message : 'Échec');
        } finally {
          setBusy(false);
        }
      },
      true,
    );
  };

  if (loading) return <AdminLoading label="Chargement audit…" />;

  return (
    <>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content}>
        <AdminPaneHeader
          title="Sécurité & audit"
          subtitle="Journal & anomalies"
          right={
            <AdminButton
              label="Modération"
              variant="soft"
              onPress={() => setGodModeContext('moderation')}
            />
          }
        />
        <AdminCard>
          <AdminText variant="h2">Signalements ouverts</AdminText>
          <AdminBadge
            label={String(data.reelReports.length)}
            tone={data.reelReports.length ? 'warn' : 'success'}
          />
          {data.reelReports.slice(0, 8).map((r) => (
            <View key={r.id} style={[styles.row, { borderColor: t.hairline }]}>
              <View style={{ flex: 1, gap: 2 }}>
                <AdminText variant="h3">{r.reason || 'Signalement'}</AdminText>
                <AdminText variant="caption" color={t.muted}>
                  {r.bookmark_key} · {r.id}
                </AdminText>
              </View>
              <AdminButton
                label="Purger"
                variant="danger"
                disabled={busy}
                onPress={() => {
                  setCollectionName('reel_reports');
                  setEntityId(r.id);
                  setGodModeContext('moderation');
                }}
              />
            </View>
          ))}
        </AdminCard>
        <AdminCard>
          <AdminText variant="h2">Audit log</AdminText>
          {logs.length === 0 ? (
            <AdminEmptyState
              title="Aucun événement"
              body="Les actions admin apparaîtront ici."
            />
          ) : (
            logs.map((e) => (
              <View key={e.id} style={[styles.row, { borderColor: t.hairline }]}>
                <View style={{ flex: 1, gap: 2 }}>
                  <AdminText variant="h3">{e.action}</AdminText>
                  <AdminText variant="caption" color={t.muted}>
                    {e.summary}
                  </AdminText>
                  <AdminText variant="caption" color={t.faint}>
                    {e.created_at.toLocaleString('fr-FR')} ·{' '}
                    {e.actor_email ?? e.actor_uid.slice(0, 8)}
                  </AdminText>
                </View>
              </View>
            ))
          )}
        </AdminCard>
      </ScrollView>

      <AdminModalSheet
        visible={godModeContext === 'moderation'}
        onClose={() => setGodModeContext(null)}
      >
        <ScrollView style={{ padding: adminSpace.lg }} contentContainerStyle={{ gap: 16 }}>
          <AdminText variant="h2" style={{ color: ADMIN_TOKENS.accent }}>
            Modération de contenu
          </AdminText>
          <AdminText variant="body" muted>
            Suppression Firestore réelle (collections whitelist).
          </AdminText>
          <AdminCard>
            <AdminText variant="h3">Hard delete par ID</AdminText>
            <View style={{ gap: 8, marginTop: 8 }}>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                {HARD_DELETE_COLLECTIONS.map((c) => (
                  <AdminButton
                    key={c.id}
                    label={c.label}
                    variant={collectionName === c.id ? 'primary' : 'ghost'}
                    onPress={() => setCollectionName(c.id)}
                  />
                ))}
              </View>
              <TextInput
                value={entityId}
                onChangeText={setEntityId}
                placeholder="Entity ID (ex: post_xxx)"
                placeholderTextColor={t.muted}
                style={{
                  borderWidth: 1,
                  borderColor: t.border,
                  padding: 12,
                  borderRadius: 8,
                  color: t.foreground,
                }}
              />
              <AdminButton
                label={busy ? '…' : 'Suppression instantanée'}
                variant="danger"
                disabled={busy}
                onPress={hardDelete}
              />
            </View>
          </AdminCard>
          <AdminCard>
            <AdminText variant="h3">Signalements prioritaires</AdminText>
            {data.reelReports.length === 0 ? (
              <AdminText variant="body" muted>
                File vide.
              </AdminText>
            ) : (
              data.reelReports.slice(0, 5).map((r) => (
                <AdminText key={r.id} variant="caption" muted>
                  {r.id} · {r.reason}
                </AdminText>
              ))
            )}
          </AdminCard>
        </ScrollView>
      </AdminModalSheet>
    </>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: adminSpace.lg,
    gap: adminSpace.lg,
    paddingBottom: 48,
  },
  row: {
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
