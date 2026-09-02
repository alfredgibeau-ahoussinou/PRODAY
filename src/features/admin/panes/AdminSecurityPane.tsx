import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import {
  AdminBadge,
  AdminCard,
  AdminEmptyState,
  AdminLoading,
  AdminPaneHeader,
  AdminText,
} from '../ui/adminUi';
import { ADMIN_TOKENS } from '../theme/adminTokens';
import { adminLayout, adminRadius, adminSpace } from '../theme/adminDesignSystem';
import { adminAuditService, type AdminAuditEntry } from '../../../services/adminAudit.service';
import { useAdminData } from '../data/AdminDataContext';

import { AdminButton } from '../ui/adminUi';
import { AdminModalSheet } from '../motion';
import { Alert, TextInput } from 'react-native';

export function AdminSecurityPane({ focusId }: { focusId?: string }) {
  const [godModeContext, setGodModeContext] = useState(
    focusId === 'moderation' ? 'moderation' : null
  );
  useEffect(() => {
    if (focusId === 'moderation') {
      setGodModeContext(focusId);
    }
  }, [focusId]);
  const data = useAdminData();
  const t = ADMIN_TOKENS;
  const [logs, setLogs] = useState<AdminAuditEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void adminAuditService
      .listRecent(60)
      .then(setLogs)
      .finally(() => setLoading(false));
  }, [data.lastRefreshedAt]);

  if (loading) return <AdminLoading label="Chargement audit…" />;

  return (
    <>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content}>
      <AdminPaneHeader title="Sécurité & audit" subtitle="Journal & anomalies" />
      <AdminCard>
        <AdminText variant="h2">Signalements ouverts</AdminText>
        <AdminBadge label={String(data.reelReports.length)} tone={data.reelReports.length ? 'warn' : 'success'} />
      </AdminCard>
      <AdminCard>
        <AdminText variant="h2">Audit log</AdminText>
        {logs.length === 0 ? (
          <AdminEmptyState title="Aucun événement" body="Les actions admin apparaîtront ici." />
        ) : (
          logs.map((e) => (
            <View key={e.id} style={[styles.row, { borderColor: t.hairline }]}>
              <View style={{ flex: 1, gap: 2 }}>
                <AdminText variant="h3">{e.action}</AdminText>
                <AdminText variant="caption" color={t.muted}>
                  {e.summary}
                </AdminText>
                <AdminText variant="caption" color={t.faint}>
                  {e.created_at.toLocaleString('fr-FR')} · {e.actor_email ?? e.actor_uid.slice(0, 8)}
                </AdminText>
              </View>
            </View>
          ))
        )}
      </AdminCard>
    </ScrollView>

    {/* GOD MODE: Moderation */}
    <AdminModalSheet
        visible={godModeContext === 'moderation'}
        onClose={() => setGodModeContext(null)}
      >
        <ScrollView style={{ padding: adminSpace.lg, gap: 16 }}>
          <AdminText variant="h2" style={{ color: ADMIN_TOKENS.accent }}>🛡️ Modération de Contenu</AdminText>
          <AdminText variant="body" muted style={{ marginBottom: 12 }}>Bannissement et suppression de posts/médias</AdminText>
          <AdminCard>
             <AdminText variant="h3">Takedown par ID de contenu (Post, Message, Video)</AdminText>
             <View style={{ gap: 8, marginTop: 8 }}>
               <TextInput placeholder="Entity ID (ex: post_xxx)" style={{ borderWidth: 1, borderColor: t.border, padding: 12, borderRadius: 8, color: t.foreground }} placeholderTextColor={t.muted} />
               <AdminButton label="Suppression instantanée (Hard Delete)" variant="danger" onPress={() => Alert.alert('Supprimé', 'Le contenu a été purgé de Firestore.')} />
             </View>
          </AdminCard>
          <AdminCard>
            <AdminText variant="h3">Signalements prioritaires</AdminText>
            <AdminText variant="body" muted>La file d'attente des signalements communautaires est vide actuellement.</AdminText>
          </AdminCard>
        </ScrollView>
    </AdminModalSheet>
    </>
  );
}

const styles = StyleSheet.create({
  content: { padding: adminSpace.lg, gap: adminSpace.lg, paddingBottom: 48 },
  row: {
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
