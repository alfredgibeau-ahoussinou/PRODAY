import React, { useCallback, useEffect, useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
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
import { adminService } from '../../../services/admin.service';
import { useAuth } from '../../../context/AuthContext';
import { confirmAdminAction } from '../utils/confirmAdminAction';
import { adminAuditService } from '../../../services/adminAudit.service';

type StandingsMeta = Awaited<ReturnType<typeof adminService.listLeagueStandingsMeta>>[number];
type RosterMeta = Awaited<ReturnType<typeof adminService.listClubRosterMeta>>[number];
type PendingClaim = Awaited<ReturnType<typeof adminService.listPendingPublicClubClaims>>[number];

export function AdminDataPane() {
  const t = ADMIN_TOKENS;
  const { firebaseUser, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [standings, setStandings] = useState<StandingsMeta[]>([]);
  const [rosters, setRosters] = useState<RosterMeta[]>([]);
  const [claims, setClaims] = useState<PendingClaim[]>([]);
  const [lastSyncMsg, setLastSyncMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [s, r, c] = await Promise.all([
      adminService.listLeagueStandingsMeta(40),
      adminService.listClubRosterMeta(40),
      adminService.listPendingPublicClubClaims(50),
    ]);
    setStandings(s);
    setRosters(r);
    setClaims(c);
  }, []);

  useEffect(() => {
    void load().finally(() => setLoading(false));
  }, [load]);

  const refresh = async () => {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  };

  const runSync = (
    key: string,
    title: string,
    fn: () => Promise<unknown>,
  ) => {
    confirmAdminAction(
      title,
      'Callable admin-only · peut prendre 30–90s.',
      async () => {
        setBusy(key);
        try {
          const result = await fn();
          await adminAuditService.log({
            action: 'other',
            actor_uid: firebaseUser?.uid ?? 'admin',
            actor_email: profile?.email ?? undefined,
            target_type: 'fff_sync',
            target_id: key,
            summary: title,
          });
          setLastSyncMsg(
            typeof result === 'object' && result
              ? JSON.stringify(result).slice(0, 180)
              : 'OK',
          );
          await load();
          Alert.alert('Sync terminée', 'Snapshots mis à jour.');
        } catch (e) {
          Alert.alert('Erreur sync', e instanceof Error ? e.message : 'Échec');
        } finally {
          setBusy(null);
        }
      },
    );
  };

  const resolveClaim = (claim: PendingClaim, action: 'approve' | 'reject') => {
    confirmAdminAction(
      action === 'approve' ? 'Valider le claim ?' : 'Refuser le claim ?',
      `${claim.club_name ?? claim.fff_affiliation_number}`,
      async () => {
        setBusy(`claim-${claim.fff_affiliation_number}`);
        try {
          await adminService.resolvePublicClubClaim(
            claim.fff_affiliation_number,
            action,
            action === 'reject' ? 'Refus admin Control Center' : undefined,
          );
          await adminAuditService.log({
            action: 'other',
            actor_uid: firebaseUser?.uid ?? 'admin',
            actor_email: profile?.email ?? undefined,
            target_type: 'fff_public_club_claim',
            target_id: claim.fff_affiliation_number,
            summary: `Claim ${action} · ${claim.club_name ?? claim.fff_affiliation_number}`,
          });
          await load();
        } catch (e) {
          Alert.alert('Erreur', e instanceof Error ? e.message : 'Échec');
        } finally {
          setBusy(null);
        }
      },
      action === 'reject',
    );
  };

  if (loading) return <AdminLoading label="Chargement data FFF…" />;

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => void refresh()}
          tintColor={t.accent}
        />
      }
    >
      <AdminPaneHeader
        title="Data & classements"
        subtitle="Sync FFF · standings · rosters · claims"
      />

      <AdminCard>
        <AdminText variant="h2">Santé sync</AdminText>
        <AdminText variant="body" color={t.muted}>
          Jobs planifiés : `scheduledFffStandingsSync` (04:15) · `scheduledFffClubRosterSync`
          (03:15) · annuaire (03:45). Relance manuelle admin-only.
        </AdminText>
        {lastSyncMsg ? (
          <AdminText variant="caption" color={t.faint}>
            Dernier résultat : {lastSyncMsg}
          </AdminText>
        ) : null}
        <View style={styles.actions}>
          <AdminButton
            label={busy === 'standings' ? '…' : 'Sync classements'}
            disabled={!!busy}
            onPress={() =>
              runSync('standings', 'Lancer syncFffStandingsNow ?', () =>
                adminService.triggerFffStandingsSync(),
              )
            }
          />
          <AdminButton
            label={busy === 'rosters' ? '…' : 'Sync effectifs'}
            variant="soft"
            disabled={!!busy}
            onPress={() =>
              runSync('rosters', 'Lancer syncFffClubRostersNow ?', () =>
                adminService.triggerFffClubRostersSync(),
              )
            }
          />
          <AdminButton
            label={busy === 'directory' ? '…' : 'Sync annuaire'}
            variant="ghost"
            disabled={!!busy}
            onPress={() =>
              runSync('directory', 'Lancer syncPublicClubDirectoryNow ?', () =>
                adminService.triggerPublicClubDirectorySync(),
              )
            }
          />
        </View>
      </AdminCard>

      <AdminCard>
        <AdminText variant="h2">Claims FFF en attente</AdminText>
        <AdminBadge
          label={String(claims.length)}
          tone={claims.length ? 'warn' : 'success'}
        />
        {claims.length === 0 ? (
          <AdminEmptyState title="Aucun claim pending" body="claimed_pending vide." />
        ) : (
          claims.map((c) => (
            <View key={c.fff_affiliation_number} style={[styles.row, { borderColor: t.hairline }]}>
              <View style={{ flex: 1, gap: 2 }}>
                <AdminText variant="h3">
                  {c.club_name || c.fff_affiliation_number}
                </AdminText>
                <AdminText variant="caption" color={t.muted}>
                  FFF {c.fff_affiliation_number} · club {c.proday_club_id ?? '—'} · claimer{' '}
                  {c.claimed_by_uid.slice(0, 8)}…
                </AdminText>
              </View>
              <View style={styles.actions}>
                <AdminButton
                  label="OK"
                  disabled={!!busy}
                  onPress={() => resolveClaim(c, 'approve')}
                />
                <AdminButton
                  label="Refus"
                  variant="danger"
                  disabled={!!busy}
                  onPress={() => resolveClaim(c, 'reject')}
                />
              </View>
            </View>
          ))
        )}
      </AdminCard>

      <AdminCard>
        <AdminText variant="h2">
          Classements (`fff_league_standings`) · {standings.length}
        </AdminText>
        {standings.length === 0 ? (
          <AdminEmptyState
            title="Aucun snapshot"
            body="Lancez une sync ou attendez le job quotidien 04:15."
          />
        ) : (
          standings.map((s) => (
            <View key={s.id} style={[styles.row, { borderColor: t.hairline }]}>
              <View style={{ flex: 1, gap: 2 }}>
                <AdminText variant="h3">{s.name}</AdminText>
                <AdminText variant="caption" color={t.muted}>
                  {s.id} · {s.rows} clubs · {s.season ?? '—'} · {s.source ?? '—'}
                </AdminText>
                {s.lastSyncAt ? (
                  <AdminText variant="caption" color={t.faint}>
                    Sync {s.lastSyncAt}
                  </AdminText>
                ) : null}
              </View>
              <AdminBadge
                label={s.category ?? '—'}
                tone={s.rows > 0 ? 'success' : 'warn'}
              />
            </View>
          ))
        )}
      </AdminCard>

      <AdminCard>
        <AdminText variant="h2">
          Effectifs (`fff_club_rosters`) · {rosters.length}
        </AdminText>
        {rosters.length === 0 ? (
          <AdminEmptyState title="Cache vide" body="Lancez sync effectifs." />
        ) : (
          rosters.slice(0, 30).map((r) => (
            <View key={r.id} style={[styles.row, { borderColor: t.hairline }]}>
              <View style={{ flex: 1, gap: 2 }}>
                <AdminText variant="h3">{r.club_name || r.id}</AdminText>
                <AdminText variant="caption" color={t.muted}>
                  {r.id} · {r.city ?? '—'} · {r.members} licenciés
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
  content: {
    padding: adminLayout.pageGutter,
    gap: adminLayout.sectionGap,
    paddingBottom: adminLayout.dockClearance,
  },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
