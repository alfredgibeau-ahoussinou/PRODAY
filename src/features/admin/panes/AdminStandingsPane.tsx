import React, { useCallback, useEffect, useState } from 'react';
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
  AdminAvatarMark,
  AdminBadge,
  AdminButton,
  AdminCard,
  AdminEmptyState,
  AdminEntityRow,
  AdminLoading,
  AdminPaneHeader,
  AdminSearchField,
  AdminSheetHeader,
  AdminText,
} from '../ui/adminUi';
import { ADMIN_TOKENS } from '../theme/adminTokens';
import { adminLayout, adminRadius, adminSpace } from '../theme/adminDesignSystem';
import { adminService } from '../../../services/admin.service';
import { useAuth } from '../../../context/AuthContext';
import { confirmAdminAction } from '../utils/confirmAdminAction';
import { adminAuditService } from '../../../services/adminAudit.service';
import { AdminModalSheet } from '../motion';

type StandingMeta = Awaited<ReturnType<typeof adminService.listLeagueStandingsMeta>>[number];
type StandingDetail = NonNullable<Awaited<ReturnType<typeof adminService.getLeagueStandingDetail>>>;

export function AdminStandingsPane() {
  const t = ADMIN_TOKENS;
  const { firebaseUser, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [meta, setMeta] = useState<StandingMeta[]>([]);
  const [selected, setSelected] = useState<StandingDetail | null>(null);
  const [editTeamId, setEditTeamId] = useState<string | null>(null);
  const [points, setPoints] = useState('');
  const [played, setPlayed] = useState('');
  const [won, setWon] = useState('');
  const [drawn, setDrawn] = useState('');
  const [lost, setLost] = useState('');
  const [gf, setGf] = useState('');
  const [ga, setGa] = useState('');
  const [reason, setReason] = useState('');
  const [lastMsg, setLastMsg] = useState<string | null>(null);
  const [q, setQ] = useState('');

  const load = useCallback(async () => {
    const rows = await adminService.listLeagueStandingsMeta(60);
    setMeta(rows);
  }, []);

  useEffect(() => {
    void load().finally(() => setLoading(false));
  }, [load]);

  const refresh = async () => {
    setRefreshing(true);
    try {
      await load();
      if (selected) {
        const d = await adminService.getLeagueStandingDetail(selected.id);
        setSelected(d);
      }
    } finally {
      setRefreshing(false);
    }
  };

  const syncAll = () => {
    confirmAdminAction(
      'Sync classements daily ?',
      'Callable syncFffStandingsNow · R1/R2/nationaux',
      async () => {
        setBusy('sync');
        try {
          const result = await adminService.triggerFffStandingsSync();
          await adminAuditService.log({
            action: 'other',
            actor_uid: firebaseUser?.uid ?? 'admin',
            actor_email: profile?.email ?? undefined,
            target_type: 'fff_standings_sync',
            target_id: 'all',
            summary: 'Force sync classements',
          });
          setLastMsg(typeof result === 'object' ? JSON.stringify(result).slice(0, 160) : 'OK');
          await load();
          Alert.alert('Sync OK', 'Snapshots classements mis à jour.');
        } catch (e) {
          Alert.alert('Erreur', e instanceof Error ? e.message : 'Échec');
        } finally {
          setBusy(null);
        }
      },
    );
  };

  const openLeague = async (row: StandingMeta) => {
    setBusy(`open-${row.id}`);
    try {
      const detail = await adminService.getLeagueStandingDetail(row.id);
      setSelected(detail);
      setEditTeamId(null);
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Échec');
    } finally {
      setBusy(null);
    }
  };

  const startEdit = (teamId: string) => {
    const row = selected?.standings.find((s) => s.team_id === teamId);
    if (!row) return;
    setEditTeamId(teamId);
    setPoints(String(row.points));
    setPlayed(String(row.played));
    setWon(String(row.won));
    setDrawn(String(row.drawn));
    setLost(String(row.lost));
    setGf(String(row.goals_for));
    setGa(String(row.goals_against));
    setReason('');
  };

  const saveOverride = () => {
    if (!selected || !editTeamId) return;
    confirmAdminAction(
      'Écrire override classement ?',
      'Callable adminAdjustLeagueStanding · DB réelle',
      async () => {
        setBusy('adjust');
        try {
          await adminService.adjustLeagueStanding({
            league_id: selected.id,
            team_id: editTeamId,
            patch: {
              points: Number(points) || 0,
              played: Number(played) || 0,
              won: Number(won) || 0,
              drawn: Number(drawn) || 0,
              lost: Number(lost) || 0,
              goals_for: Number(gf) || 0,
              goals_against: Number(ga) || 0,
            },
            reason: reason.trim() || 'Override admin',
          });
          await adminAuditService.log({
            action: 'other',
            actor_uid: firebaseUser?.uid ?? 'admin',
            actor_email: profile?.email ?? undefined,
            target_type: 'fff_league_standings',
            target_id: `${selected.id}:${editTeamId}`,
            summary: `Override points=${points}`,
          });
          const detail = await adminService.getLeagueStandingDetail(selected.id);
          setSelected(detail);
          setEditTeamId(null);
          await load();
          Alert.alert('Override OK', 'Classement mis à jour.');
        } catch (e) {
          Alert.alert('Erreur', e instanceof Error ? e.message : 'Échec');
        } finally {
          setBusy(null);
        }
      },
    );
  };

  if (loading) return <AdminLoading label="Chargement classements…" />;

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <AdminPaneHeader
          title="Tableaux classements"
          subtitle="Monitor · force-sync · ajustement manuel (R1, R2, nationaux)"
        />
        <View style={styles.actions}>
          <AdminButton label={busy === 'sync' ? '…' : 'Force sync'} disabled={!!busy} onPress={syncAll} />
          <AdminBadge label={`${meta.length} ligues`} tone="info" />
        </View>
        <AdminSearchField value={q} onChangeText={setQ} placeholder="Ligues, saison, source…" />
        {lastMsg ? (
          <AdminText variant="caption" color={t.faint}>
            {lastMsg}
          </AdminText>
        ) : null}
      </View>

      <FlatList
        data={meta.filter((m) => {
          const query = q.trim().toLowerCase();
          if (!query) return true;
          return (
            m.name.toLowerCase().includes(query) ||
            m.id.toLowerCase().includes(query) ||
            (m.season?.toLowerCase().includes(query) ?? false) ||
            (m.source?.toLowerCase().includes(query) ?? false)
          );
        })}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => void refresh()} tintColor={t.accent} />
        }
        contentContainerStyle={{ padding: adminSpace.lg, gap: 8, paddingBottom: adminLayout.dockClearance }}
        ListEmptyComponent={
          <AdminEmptyState
            title="Aucun snapshot"
            body="Lancez une sync ou attendez le job 04:15."
            icon="stats-chart"
            actionLabel="Force sync"
            onAction={syncAll}
          />
        }
        renderItem={({ item }) => (
          <AdminEntityRow
            title={item.name}
            subtitle={`${item.id} · ${item.season ?? '—'} · ${item.source ?? '—'}`}
            meta={item.lastSyncAt ? `Sync ${item.lastSyncAt}` : undefined}
            badge={`${item.rows}`}
            badgeTone={item.source === 'admin_override' ? 'warn' : item.rows > 0 ? 'success' : 'warn'}
            leading={<AdminAvatarMark label={item.name} tone="info" />}
            onPress={() => void openLeague(item)}
          />
        )}
      />

      <AdminModalSheet visible={!!selected} onClose={() => setSelected(null)} variant="full">
        {selected ? (
          <View style={{ flex: 1 }}>
            <AdminSheetHeader title={selected.name} onClose={() => setSelected(null)} />
            <AdminText variant="caption" color={t.muted} style={{ paddingHorizontal: adminSpace.lg }}>
              {selected.id} · {selected.source ?? '—'} · {selected.standings.length} clubs
            </AdminText>
            <FlatList
              data={selected.standings}
              keyExtractor={(r) => r.team_id || r.name}
              contentContainerStyle={{ padding: adminSpace.lg, gap: 6, paddingBottom: 120 }}
              renderItem={({ item: row }) => (
                <Pressable onPress={() => startEdit(row.team_id)}>
                  <AdminCard
                    style={
                      editTeamId === row.team_id ? { borderColor: ADMIN_TOKENS.accent } : undefined
                    }
                  >
                    <View style={styles.row}>
                      <AdminBadge label={`#${row.rank}`} tone="info" />
                      <View style={{ flex: 1 }}>
                        <AdminText variant="h3">{row.name}</AdminText>
                        <AdminText variant="caption" color={t.muted}>
                          {row.played}j · {row.won}V {row.drawn}N {row.lost}D · {row.goals_for}:
                          {row.goals_against} · {row.points} pts
                        </AdminText>
                      </View>
                    </View>
                  </AdminCard>
                </Pressable>
              )}
            />
            {editTeamId ? (
              <View style={[styles.editor, { borderColor: t.border, backgroundColor: t.surfaceRaised }]}>
                <AdminText variant="h3">Override · {editTeamId}</AdminText>
                <View style={styles.editGrid}>
                  {(
                    [
                      ['Pts', points, setPoints],
                      ['J', played, setPlayed],
                      ['V', won, setWon],
                      ['N', drawn, setDrawn],
                      ['D', lost, setLost],
                      ['BP', gf, setGf],
                      ['BC', ga, setGa],
                    ] as const
                  ).map(([label, value, setter]) => (
                    <View key={label} style={styles.editCell}>
                      <AdminText variant="label" muted>
                        {label}
                      </AdminText>
                      <TextInput
                        value={value}
                        onChangeText={setter}
                        keyboardType="number-pad"
                        style={[styles.input, { color: t.foreground, borderColor: t.border }]}
                      />
                    </View>
                  ))}
                </View>
                <TextInput
                  value={reason}
                  onChangeText={setReason}
                  placeholder="Raison audit…"
                  placeholderTextColor={t.faint}
                  style={[styles.input, { color: t.foreground, borderColor: t.border }]}
                />
                <View style={styles.actions}>
                  <AdminButton label="Enregistrer" disabled={!!busy} onPress={saveOverride} />
                  <AdminButton label="Annuler" variant="ghost" onPress={() => setEditTeamId(null)} />
                </View>
              </View>
            ) : null}
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
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  editor: {
    borderTopWidth: StyleSheet.hairlineWidth,
    padding: adminSpace.lg,
    gap: 10,
  },
  editGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  editCell: { width: 64, gap: 4 },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: adminRadius.md,
    paddingHorizontal: 8,
    paddingVertical: 8,
    fontSize: 13,
  },
});
