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

export function AdminSecurityPane() {
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
  );
}

const styles = StyleSheet.create({
  content: { padding: adminSpace.lg, gap: adminSpace.lg, paddingBottom: 48 },
  row: {
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
