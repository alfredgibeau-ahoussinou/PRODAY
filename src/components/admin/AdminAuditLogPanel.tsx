import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { adminAuditService, type AdminAuditEntry } from '../../services/adminAudit.service';
import { AdminSectionHeader } from './AdminSectionHeader';
import { AdminEmptyState } from './AdminEmptyState';
import { ProDayText } from '../ui/ProDayText';
import { useAdminStyles } from './adminStyles';
import { spacing, radius } from '../../theme/designTokens';
import { formatRelativeTime } from '../../utils/formatRelativeTime';

const ACTION_LABEL: Record<string, string> = {
  reel_submitted: 'Nouvelle publication',
  reel_approved: 'Publication approuvée',
  reel_rejected: 'Publication refusée',
  reel_deleted: 'Publication supprimée',
  user_verified: 'Profil vérifié',
  user_rejected: 'Profil refusé',
  user_deleted: 'Compte supprimé',
  user_created: 'Compte créé',
  user_updated: 'Compte modifié',
  club_verified: 'Club vérifié',
  club_deleted: 'Club supprimé',
  message_deleted: 'Message supprimé',
  thread_deleted: 'Conversation supprimée',
  weekly_response_deleted: 'Réponse fil supprimée',
  payment_marked_paid: 'Paiement validé',
  snapshot_recorded: 'Instantané enregistré',
  subscription_granted: 'Abonnement accordé',
  subscription_revoked: 'Abonnement retiré',
  subscription_changed: 'Formule modifiée',
  subscription_extended: 'Abonnement prolongé',
  other: 'Action',
};

export const AdminAuditLogPanel: React.FC = () => {
  const { colors: c } = useAdminStyles();
  const styles = useMemo(() => createStyles(c), [c]);
  const [entries, setEntries] = useState<AdminAuditEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setEntries(await adminAuditService.listRecent(100));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <View>
      <AdminSectionHeader title="JOURNAL D'AUDIT" count={entries.length} />
      <ProDayText variant="caption" muted style={{ marginBottom: spacing.sm, lineHeight: 18 }}>
        Historique des actions admin sur la plateforme.
      </ProDayText>
      {loading ? (
        <ActivityIndicator color={c.brand} style={{ marginVertical: spacing.lg }} />
      ) : entries.length === 0 ? (
        <AdminEmptyState
          icon="document"
          title="Journal vide"
          subtitle="Les actions de modération apparaîtront ici."
        />
      ) : (
        entries.map((entry) => (
          <View
            key={entry.id}
            style={[styles.row, { borderColor: c.border, backgroundColor: c.surface }]}
          >
            <ProDayText variant="caption" accent style={{ fontWeight: '900' }}>
              {ACTION_LABEL[entry.action] ?? entry.action}
            </ProDayText>
            <ProDayText variant="body" style={{ color: c.text, marginTop: 4 }}>
              {entry.summary}
            </ProDayText>
            <ProDayText variant="caption" muted style={{ marginTop: 4 }}>
              {entry.actor_email ?? entry.actor_uid.slice(0, 12)} ·{' '}
              {formatRelativeTime(entry.created_at, (k) => k, new Date(), 'fr')}
            </ProDayText>
          </View>
        ))
      )}
    </View>
  );
};

function createStyles(_c: { border: string }) {
  return StyleSheet.create({
    row: {
      borderWidth: 1,
      borderRadius: radius.md,
      padding: spacing.md,
      marginBottom: spacing.sm,
    },
  });
}
