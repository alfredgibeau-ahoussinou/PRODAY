import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import {
  AdminBadge,
  AdminButton,
  AdminCard,
  AdminEmptyState,
  AdminLoading,
  AdminPaneHeader,
  AdminSheetHeader,
  AdminText,
} from '../ui/adminUi';
import { ADMIN_TOKENS } from '../theme/adminTokens';
import { adminLayout, adminRadius, adminSpace } from '../theme/adminDesignSystem';
import { adminService } from '../../../services/admin.service';
import { useAdminData } from '../data/AdminDataContext';
import { useAuth } from '../../../context/AuthContext';
import { confirmAdminAction } from '../utils/confirmAdminAction';
import { adminAuditService } from '../../../services/adminAudit.service';
import { AdminModalSheet } from '../motion';

type RosterMeta = Awaited<ReturnType<typeof adminService.listClubRosterMeta>>[number];
type RosterDetail = NonNullable<Awaited<ReturnType<typeof adminService.getClubRosterDetail>>>;

export function AdminRosterDataPane() {
  const t = ADMIN_TOKENS;
  const data = useAdminData();
  const { firebaseUser, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [rosters, setRosters] = useState<RosterMeta[]>([]);
  const [q, setQ] = useState('');
  const [selected, setSelected] = useState<RosterDetail | null>(null);
  const [lastMsg, setLastMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    const rows = await adminService.listClubRosterMeta(200);
    setRosters(rows);
  }, []);

  useEffect(() => {
    void load().finally(() => setLoading(false));
  }, [load]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return rosters;
    return rosters.filter(
      (r) =>
        r.id.toLowerCase().includes(query) ||
        (r.club_name?.toLowerCase().includes(query) ?? false) ||
        (r.city?.toLowerCase().includes(query) ?? false),
    );
  }, [rosters, q]);

  const refresh = async () => {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  };

  const runGlobalSync = () => {
    confirmAdminAction(
      'Sync effectifs global ?',
      'Callable syncFffClubRostersNow · 30–90s',
      async () => {
        setBusy('global');
        try {
          const result = await adminService.triggerFffClubRostersSync();
          await adminAuditService.log({
            action: 'other',
            actor_uid: firebaseUser?.uid ?? 'admin',
            actor_email: profile?.email ?? undefined,
            target_type: 'fff_roster_sync',
            target_id: 'all',
            summary: 'Force sync effectifs global',
          });
          setLastMsg(typeof result === 'object' ? JSON.stringify(result).slice(0, 160) : 'OK');
          await load();
          Alert.alert('Sync OK', 'Caches effectifs mis à jour.');
        } catch (e) {
          Alert.alert('Erreur', e instanceof Error ? e.message : 'Échec');
        } finally {
          setBusy(null);
        }
      },
    );
  };

  const forceClub = (clubId?: string, fff?: string) => {
    confirmAdminAction(
      'Force sync ce club ?',
      fff || clubId || '—',
      async () => {
        setBusy(fff || clubId || 'club');
        try {
          const result = await adminService.triggerFffClubRosterForClub({
            club_id: clubId,
            fff_affiliation_number: fff,
          });
          setLastMsg(typeof result === 'object' ? JSON.stringify(result).slice(0, 160) : 'OK');
          await load();
          if (selected) {
            const detail = await adminService.getClubRosterDetail(selected.id);
            setSelected(detail);
          }
        } catch (e) {
          Alert.alert('Erreur', e instanceof Error ? e.message : 'Échec');
        } finally {
          setBusy(null);
        }
      },
    );
  };

  const openRoster = async (meta: RosterMeta) => {
    setBusy(`open-${meta.id}`);
    try {
      const detail = await adminService.getClubRosterDetail(meta.id);
      setSelected(detail);
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Échec');
    } finally {
      setBusy(null);
    }
  };

  if (loading) return <AdminLoading label="Chargement effectifs…" />;

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <AdminPaneHeader
          title="Effectifs live"
          subtitle="Inspect · manage · force-trigger imports effectifs"
        />
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder="FFF, club, ville…"
          placeholderTextColor={t.faint}
          style={[styles.input, { color: t.foreground, borderColor: t.border, backgroundColor: t.surfaceGlass }]}
        />
        <View style={styles.actions}>
          <AdminButton
            label={busy === 'global' ? '…' : 'Sync global'}
            disabled={!!busy}
            onPress={runGlobalSync}
          />
          <AdminBadge label={`${filtered.length} caches`} tone="info" />
        </View>
        {lastMsg ? (
          <AdminText variant="caption" color={t.faint}>
            {lastMsg}
          </AdminText>
        ) : null}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => void refresh()} tintColor={t.accent} />
        }
        contentContainerStyle={{ padding: adminSpace.lg, gap: 8, paddingBottom: adminLayout.dockClearance }}
        ListEmptyComponent={<AdminEmptyState title="Aucun roster" body="Lancez une sync." />}
        renderItem={({ item }) => (
          <Pressable onPress={() => void openRoster(item)}>
            <AdminCard>
              <View style={styles.row}>
                <View style={{ flex: 1, gap: 2 }}>
                  <AdminText variant="h3">{item.club_name || item.id}</AdminText>
                  <AdminText variant="caption" color={t.muted}>
                    FFF {item.id} · {item.city ?? '—'} · {item.members} licenciés
                  </AdminText>
                </View>
                <AdminBadge label={String(item.members)} tone={item.members > 0 ? 'success' : 'warn'} />
              </View>
            </AdminCard>
          </Pressable>
        )}
      />

      <AdminModalSheet visible={!!selected} onClose={() => setSelected(null)} variant="full">
        {selected ? (
          <View style={{ flex: 1 }}>
            <AdminSheetHeader
              title={selected.club_name || selected.id}
              onClose={() => setSelected(null)}
            />
            <View style={{ paddingHorizontal: adminSpace.lg, gap: 8 }}>
              <AdminText variant="caption" color={t.muted}>
                FFF {selected.id} · club {selected.proday_club_id ?? '—'}
              </AdminText>
              <View style={styles.actions}>
                <AdminButton
                  label="Force sync club"
                  disabled={!!busy}
                  onPress={() =>
                    forceClub(selected.proday_club_id, selected.id)
                  }
                />
                {!selected.proday_club_id && data.clubs.length ? (
                  <AdminButton
                    label="Sync via n° FFF"
                    variant="soft"
                    disabled={!!busy}
                    onPress={() => forceClub(undefined, selected.id)}
                  />
                ) : null}
              </View>
            </View>
            <FlatList
              data={selected.members}
              keyExtractor={(m, i) => m.id || `${i}`}
              contentContainerStyle={{ padding: adminSpace.lg, gap: 6 }}
              ListEmptyComponent={<AdminEmptyState title="Effectif vide" />}
              renderItem={({ item: m }) => (
                <AdminCard>
                  <AdminText variant="h3">{m.displayName}</AdminText>
                  <AdminText variant="caption" color={t.muted}>
                    {[m.role, m.category, m.licenseNumber].filter(Boolean).join(' · ') || '—'}
                  </AdminText>
                </AdminCard>
              )}
            />
          </View>
        ) : null}
      </AdminModalSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    paddingHorizontal: adminLayout.pageGutter,
    paddingTop: adminSpace.md,
    gap: 8,
  },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: adminRadius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
