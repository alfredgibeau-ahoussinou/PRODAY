import React, { useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useAdminData } from '../data/AdminDataContext';
import {
  AdminBadge,
  AdminButton,
  AdminCard,
  AdminEmptyState,
  AdminLoading,
  AdminText,
} from '../ui/adminUi';
import { ADMIN_TOKENS } from '../theme/adminTokens';
import { adminSpace } from '../theme/adminDesignSystem';
import { adminService } from '../../../services/admin.service';
import { useAuth } from '../../../context/AuthContext';

type Filter = 'all' | 'verified' | 'unverified' | 'new';

export function AdminClubsPane({ focusId }: { focusId?: string }) {
  const data = useAdminData();
  const { firebaseUser } = useAuth();
  const t = ADMIN_TOKENS;
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [busyId, setBusyId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    const weekAgo = Date.now() - 7 * 24 * 3600 * 1000;
    return data.clubs.filter((c) => {
      if (focusId) return c.id === focusId;
      if (filter === 'verified' && !c.verified) return false;
      if (filter === 'unverified' && c.verified) return false;
      if (filter === 'new' && (c.created_at?.getTime() ?? 0) < weekAgo) return false;
      if (!query) return true;
      return (
        c.name.toLowerCase().includes(query) ||
        (c.city?.toLowerCase().includes(query) ?? false)
      );
    });
  }, [data.clubs, q, filter, focusId]);

  const toggleVerified = (clubId: string, verified: boolean) => {
    Alert.alert(
      verified ? 'Valider le club ?' : 'Retirer la validation ?',
      'Action auditée. Confirmation requise.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          style: verified ? 'default' : 'destructive',
          onPress: () => {
            void (async () => {
              setBusyId(clubId);
              try {
                await adminService.updateClubVerified(clubId, verified);
                await data.refresh();
              } catch (e) {
                Alert.alert('Erreur', e instanceof Error ? e.message : 'Échec');
              } finally {
                setBusyId(null);
              }
            })();
          },
        },
      ],
    );
  };

  if (data.loading) return <AdminLoading />;

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <AdminText variant="h1">Clubs</AdminText>
        <AdminText variant="caption" color={t.muted}>
          {data.clubs.length} clubs · dossiers plateforme
        </AdminText>
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder="Nom ou ville…"
          placeholderTextColor={t.faint}
          style={[styles.input, { color: t.foreground, borderColor: t.border, backgroundColor: t.surface }]}
        />
        <View style={styles.chips}>
          {(
            [
              ['all', 'Tous'],
              ['verified', 'Actifs'],
              ['unverified', 'À valider'],
              ['new', 'Nouveaux'],
            ] as const
          ).map(([id, label]) => (
            <Pressable
              key={id}
              onPress={() => setFilter(id)}
              style={[
                styles.chip,
                {
                  backgroundColor: filter === id ? t.accentSoft : t.surfaceRaised,
                  borderColor: filter === id ? t.accent : t.border,
                },
              ]}
            >
              <AdminText variant="caption" color={filter === id ? t.accentHot : t.muted}>
                {label}
              </AdminText>
            </Pressable>
          ))}
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: adminSpace.lg, gap: 8 }}
        ListEmptyComponent={
          <AdminEmptyState title="Aucun club" body="Aucune entrée ne correspond." />
        }
        renderItem={({ item }) => (
          <AdminCard>
            <View style={styles.row}>
              <View style={{ flex: 1, gap: 2 }}>
                <AdminText variant="h3">{item.name}</AdminText>
                <AdminText variant="caption" color={t.muted}>
                  {[item.city, item.department].filter(Boolean).join(' · ') || 'Localisation inconnue'}
                </AdminText>
                <AdminText variant="caption" color={t.faint}>
                  Owner {item.owner_uid?.slice(0, 8) ?? '—'}
                  {firebaseUser?.uid === item.owner_uid ? ' · vous' : ''}
                </AdminText>
              </View>
              <AdminBadge
                label={item.verified ? 'Validé' : 'En attente'}
                tone={item.verified ? 'success' : 'warn'}
              />
            </View>
            <View style={styles.actions}>
              <AdminButton
                label={item.verified ? 'Suspendre validation' : 'Valider'}
                variant={item.verified ? 'ghost' : 'primary'}
                disabled={busyId === item.id}
                onPress={() => toggleVerified(item.id, !item.verified)}
              />
            </View>
          </AdminCard>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    padding: adminSpace.lg,
    gap: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: ADMIN_TOKENS.hairline,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  row: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  actions: { marginTop: 8, flexDirection: 'row', gap: 8 },
});
