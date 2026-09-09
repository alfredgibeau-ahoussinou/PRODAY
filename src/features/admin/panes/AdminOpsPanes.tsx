import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAdminData } from '../data/AdminDataContext';
import {
  AdminAvatarMark,
  AdminBadge,
  AdminButton,
  AdminCard,
  AdminEmptyState,
  AdminEntityRow,
  AdminField,
  AdminLoading,
  AdminMetricTile,
  AdminPaneHeader,
  AdminSearchField,
  AdminText,
} from '../ui/adminUi';
import { ADMIN_TOKENS } from '../theme/adminTokens';
import { adminLayout, adminRadius, adminSpace, adminSurfaceHero } from '../theme/adminDesignSystem';
import { AdminListRow } from '../motion';
import type { AdminNavSectionId } from '../navigation/adminNavConfig';
import { ADMIN_NAV_ITEMS } from '../navigation/adminNavConfig';
import { adminService } from '../../../services/admin.service';
import { adminAuditService, type AdminAuditEntry } from '../../../services/adminAudit.service';
import { membershipsService } from '../../../services/memberships.service';
import { useAuth } from '../../../context/AuthContext';
import { confirmAdminAction } from '../utils/confirmAdminAction';
import { userNeedsAdminVerificationReview } from '../../../utils/adminUserVerification';
import { AdminIdentityQueuePane } from './AdminIdentityQueuePane';
import { AdminUsersPane } from './AdminUsersPane';
import { AdminClubsPane } from './AdminClubsPane';

type NavFn = (section: AdminNavSectionId, focusId?: string) => void;

/** Commande — hub ops raffiné. */
export function AdminOverviewPane({
  onNavigate,
}: {
  onNavigate: NavFn;
  onOpenCommand?: () => void;
}) {
  const data = useAdminData();
  const t = ADMIN_TOKENS;
  const top = data.workQueue.slice(0, 8);

  if (data.loading) return <AdminLoading label="Initialisation Espace Admin…" />;

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.pad}
      testID="admin-overview"
    >
      <LinearGradient
        colors={[t.surfaceRaised, t.surfaceMuted, t.bg]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[adminSurfaceHero(), styles.hero]}
      >
        <AdminText variant="label" color={t.signal}>
          ESPACE ADMIN · OPS DESK
        </AdminText>
        <AdminText variant="display" color={t.foreground}>
          Commande
        </AdminText>
        <AdminText variant="body" color={t.muted}>
          Pilotage unifié — personnes, clubs, FFF, business et contenu. Menu ·{' '}
          {ADMIN_NAV_ITEMS.length} pages.
        </AdminText>
        <View style={styles.heroActions}>
          <AdminButton
            label={
              data.workQueue.length > 0
                ? `File prioritaire (${data.workQueue.length})`
                : 'Ouvrir la file'
            }
            variant="soft"
            onPress={() => onNavigate('queue')}
          />
          <AdminButton label="Utilisateurs" variant="ghost" onPress={() => onNavigate('users')} />
        </View>
      </LinearGradient>

      <View style={styles.metricGrid}>
        {[
          { label: 'Comptes', value: data.users.length, go: 'users' as const },
          { label: 'Clubs', value: data.clubs.length, go: 'clubs' as const },
          { label: 'File', value: data.workQueue.length, go: 'queue' as const, hot: true },
          { label: 'Santé', value: `${data.health.score}%`, go: 'health' as const },
          {
            label: 'À vérifier',
            value: data.users.filter(userNeedsAdminVerificationReview).length,
            go: 'verifications' as const,
          },
          { label: 'Adhésions', value: data.pendingMemberships.length, go: 'memberships' as const },
        ].map((m) => (
          <AdminMetricTile
            key={m.label}
            label={m.label}
            value={m.value}
            hot={m.hot}
            onPress={() => onNavigate(m.go)}
          />
        ))}
      </View>

      <AdminCard>
        <View style={styles.rowBetween}>
          <AdminText variant="h2">File prioritaire</AdminText>
          <AdminButton label="Tout voir" variant="ghost" compact onPress={() => onNavigate('queue')} />
        </View>
        {top.length === 0 ? (
          <AdminEmptyState
            title="File claire"
            body="Rien d’urgent pour l’instant. Les claims, IDs et adhésions apparaîtront ici."
            icon="checkmark-circle"
            actionLabel="Santé plateforme"
            onAction={() => onNavigate('health')}
          />
        ) : (
          top.map((item) => (
            <AdminEntityRow
              key={item.id}
              title={item.title}
              subtitle={item.subtitle}
              badge={item.priority.toUpperCase()}
              badgeTone={item.priority === 'critical' ? 'danger' : 'warn'}
              leading={<AdminAvatarMark label={item.title} tone={item.priority === 'critical' ? 'danger' : 'warn'} />}
              onPress={() => onNavigate(item.targetSection, item.entityId)}
            />
          ))
        )}
      </AdminCard>
    </ScrollView>
  );
}

export function AdminQueuePane({ onNavigate }: { onNavigate: NavFn }) {
  const data = useAdminData();
  const [q, setQ] = useState('');
  if (data.loading) return <AdminLoading />;
  const filtered = data.workQueue.filter((i) => {
    const query = q.trim().toLowerCase();
    if (!query) return true;
    return (
      i.title.toLowerCase().includes(query) ||
      i.subtitle.toLowerCase().includes(query) ||
      i.priority.toLowerCase().includes(query)
    );
  });
  return (
    <View style={styles.root} testID="admin-queue">
      <View style={styles.header}>
        <AdminPaneHeader
          title="File prioritaire"
          subtitle={`${data.workQueue.length} actions · triées par criticité`}
        />
        <AdminSearchField
          value={q}
          onChangeText={setQ}
          placeholder="Filtrer titre, priorité…"
        />
      </View>
      <FlatList
        data={filtered}
        keyExtractor={(i) => i.id}
        contentContainerStyle={styles.pad}
        ListEmptyComponent={
          <AdminEmptyState
            title="File vide"
            body="Aucune action en attente. Les claims FFF, vérifs ID et adhésions s’affichent ici."
            icon="list"
            actionLabel="Voir les claims"
            onAction={() => onNavigate('claims')}
          />
        }
        renderItem={({ item, index }) => (
          <AdminListRow index={index} onPress={() => onNavigate(item.targetSection, item.entityId)}>
            <AdminEntityRow
              title={item.title}
              subtitle={item.subtitle}
              badge={item.priority.toUpperCase()}
              badgeTone={
                item.priority === 'critical' ? 'danger' : item.priority === 'high' ? 'warn' : 'info'
              }
              leading={
                <AdminAvatarMark
                  label={item.title}
                  tone={item.priority === 'critical' ? 'danger' : 'warn'}
                />
              }
              onPress={() => onNavigate(item.targetSection, item.entityId)}
            />
          </AdminListRow>
        )}
      />
    </View>
  );
}

export function AdminHealthPane() {
  const data = useAdminData();
  const t = ADMIN_TOKENS;
  if (data.loading) return <AdminLoading />;
  const s = data.stats;
  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.pad} testID="admin-health">
      <AdminPaneHeader
        title="Santé plateforme"
        subtitle={`${data.health.label} · score ${data.health.score}`}
      />
      <AdminCard hero>
        <AdminText variant="label" color={t.signal}>
          SCORE OPS
        </AdminText>
        <AdminText variant="stat" color={data.health.score >= 80 ? t.success : t.warn}>
          {data.health.score}
        </AdminText>
        <AdminText variant="caption" muted>
          Modération {data.moderationScore} · dernière sync{' '}
          {data.lastRefreshedAt?.toLocaleTimeString('fr-FR') ?? '—'}
        </AdminText>
      </AdminCard>
      <View style={styles.metricGrid}>
        {[
          ['Users', s?.users],
          ['Joueurs', s?.players],
          ['Coachs', s?.coaches],
          ['Clubs', s?.clubs],
          ['Pending ID', s?.pendingVerifications],
          ['Reels', s?.pendingCommunityReels],
          ['Paiements', s?.pendingPayments],
          ['Reports', s?.reelReports],
        ].map(([label, value]) => (
          <AdminMetricTile key={String(label)} label={String(label)} value={value ?? 0} />
        ))}
      </View>
      <AdminCard>
        <AdminText variant="h2">Trafic</AdminText>
        <AdminText variant="body" muted>
          Site {data.trafficTotals.site_visits} · App {data.trafficTotals.app_opens}
        </AdminText>
      </AdminCard>
    </ScrollView>
  );
}

export function AdminAuditPane() {
  const t = ADMIN_TOKENS;
  const [rows, setRows] = useState<AdminAuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const r = await adminAuditService.listRecent(100);
    setRows(r);
  }, []);

  useEffect(() => {
    void load().finally(() => setLoading(false));
  }, [load]);

  if (loading) return <AdminLoading />;
  return (
    <View style={styles.root} testID="admin-audit">
      <View style={styles.header}>
        <AdminPaneHeader title="Journal audit" subtitle={`${rows.length} entrées récentes`} />
      </View>
      <FlatList
        data={rows}
        keyExtractor={(i) => i.id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              try {
                await load();
              } finally {
                setRefreshing(false);
              }
            }}
            tintColor={t.signal}
          />
        }
        contentContainerStyle={styles.pad}
        ListEmptyComponent={
          <AdminEmptyState
            title="Journal vide"
            body="Aucune action admin récente. Les mutations (users, clubs, claims) s’auditeront ici."
            icon="document-text"
          />
        }
        renderItem={({ item }) => (
          <AdminEntityRow
            title={item.summary}
            subtitle={item.action}
            meta={`${item.target_type}/${item.target_id.slice(0, 12)} · ${item.created_at.toLocaleString('fr-FR')}`}
            leading={<AdminAvatarMark label={item.action} tone="info" />}
          />
        )}
      />
    </View>
  );
}

export function AdminUserCreatePane({
  onPreviewPresidentPole,
  onPreviewUserApp,
}: {
  onPreviewPresidentPole?: () => void;
  onPreviewUserApp?: () => void;
}) {
  return (
    <AdminUsersPane
      focusId="create"
      onPreviewPresidentPole={onPreviewPresidentPole}
      onPreviewUserApp={onPreviewUserApp}
    />
  );
}

export function AdminClubCreatePane() {
  return <AdminClubsPane focusId="__create__" />;
}

export function AdminVerificationsPane({ focusId }: { focusId?: string }) {
  return <AdminIdentityQueuePane focusId={focusId} />;
}

export function AdminMembershipsPane({ focusId }: { focusId?: string }) {
  const data = useAdminData();
  const { firebaseUser, profile } = useAuth();
  const [busy, setBusy] = useState<string | null>(null);

  const decide = (id: string, approve: boolean) => {
    confirmAdminAction(
      approve ? 'Approuver l’adhésion ?' : 'Refuser l’adhésion ?',
      id,
      async () => {
        setBusy(id);
        try {
          const uid = firebaseUser?.uid ?? 'admin';
          if (approve) await membershipsService.approve(id, uid);
          else await membershipsService.reject(id, uid);
          await adminAuditService.log({
            action: 'other',
            actor_uid: uid,
            actor_email: profile?.email ?? undefined,
            target_type: 'membership',
            target_id: id,
            summary: approve ? 'Adhésion approuvée' : 'Adhésion refusée',
          });
          await data.refresh();
        } catch (e) {
          Alert.alert('Erreur', e instanceof Error ? e.message : 'Échec');
        } finally {
          setBusy(null);
        }
      },
      !approve,
    );
  };

  const list = useMemo(() => {
    if (!focusId) return data.pendingMemberships;
    return data.pendingMemberships.filter((m) => m.id === focusId);
  }, [data.pendingMemberships, focusId]);

  if (data.loading) return <AdminLoading />;
  return (
    <View style={styles.root} testID="admin-memberships">
      <View style={styles.header}>
        <AdminPaneHeader title="Adhésions" subtitle={`${list.length} en attente`} />
      </View>
      <FlatList
        data={list}
        keyExtractor={(m) => m.id}
        contentContainerStyle={styles.pad}
        ListEmptyComponent={
          <AdminEmptyState
            title="Aucune adhésion en attente"
            body="Les demandes d’adhésion club apparaîtront ici pour validation."
            icon="handshake"
          />
        }
        renderItem={({ item }) => (
          <AdminEntityRow
            title={item.player_name}
            subtitle={`Club ${item.club_id} · ${item.license_number ?? 'sans licence'}`}
            badge="PENDING"
            badgeTone="warn"
            leading={<AdminAvatarMark label={item.player_name} tone="warn" />}
            actions={
              <>
                <AdminButton
                  label={busy === item.id ? '…' : 'Approuver'}
                  compact
                  disabled={!!busy}
                  onPress={() => decide(item.id, true)}
                />
                <AdminButton
                  label="Refuser"
                  variant="danger"
                  compact
                  disabled={!!busy}
                  onPress={() => decide(item.id, false)}
                />
              </>
            }
          />
        )}
      />
    </View>
  );
}

export function AdminBetaPane() {
  const { firebaseUser, profile } = useAuth();
  const [rows, setRows] = useState<Awaited<ReturnType<typeof adminService.listBetaWaitlist>>>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setRows(await adminService.listBetaWaitlist(120));
  }, []);

  useEffect(() => {
    void load().finally(() => setLoading(false));
  }, [load]);

  const act = (id: string, kind: 'approve' | 'reject' | 'resend' | 'delete') => {
    confirmAdminAction(
      kind === 'approve'
        ? 'Approuver ?'
        : kind === 'reject'
          ? 'Refuser ?'
          : kind === 'resend'
            ? 'Renvoyer welcome mail ?'
            : 'Supprimer l’entrée ?',
      id,
      async () => {
        setBusy(id);
        try {
          if (kind === 'approve') await adminService.approveBetaWaitlistEntry(id);
          else if (kind === 'reject') await adminService.rejectBetaWaitlistEntry(id);
          else if (kind === 'resend') await adminService.resendBetaWelcomeEmail(id);
          else await adminService.deleteBetaWaitlistEntry(id);
          await adminAuditService.log({
            action: kind === 'approve' ? 'beta_approved' : kind === 'reject' ? 'beta_rejected' : kind === 'delete' ? 'beta_deleted' : 'other',
            actor_uid: firebaseUser?.uid ?? 'admin',
            actor_email: profile?.email ?? undefined,
            target_type: 'beta_waitlist',
            target_id: id,
            summary: `Beta ${kind}`,
          });
          await load();
        } catch (e) {
          Alert.alert('Erreur', e instanceof Error ? e.message : 'Échec');
        } finally {
          setBusy(null);
        }
      },
      kind === 'delete' || kind === 'reject',
    );
  };

  if (loading) return <AdminLoading />;
  return (
    <View style={styles.root} testID="admin-beta">
      <View style={styles.header}>
        <AdminPaneHeader title="Liste d’attente bêta" subtitle={`${rows.length} entrées`} />
      </View>
      <FlatList
        data={rows}
        keyExtractor={(r) => r.id}
        contentContainerStyle={styles.pad}
        ListEmptyComponent={
          <AdminEmptyState
            title="Liste bêta vide"
            body="Aucune inscription en attente. Les leads site atterrissent ici."
            icon="star"
          />
        }
        renderItem={({ item }) => (
          <AdminEntityRow
            title={item.name || item.email}
            subtitle={`${item.email} · ${item.role_label || item.role || '—'}`}
            badge={String(item.status || 'pending').toUpperCase()}
            badgeTone={item.status === 'approved' ? 'success' : item.status === 'rejected' ? 'danger' : 'warn'}
            leading={<AdminAvatarMark label={item.name || item.email} tone="accent" />}
            actions={
              <>
                <AdminButton label="OK" compact disabled={!!busy} onPress={() => act(item.id, 'approve')} />
                <AdminButton
                  label="Refus"
                  variant="danger"
                  compact
                  disabled={!!busy}
                  onPress={() => act(item.id, 'reject')}
                />
                <AdminButton
                  label="Mail"
                  variant="ghost"
                  compact
                  disabled={!!busy}
                  onPress={() => act(item.id, 'resend')}
                />
                <AdminButton
                  label="Suppr."
                  variant="ghost"
                  compact
                  disabled={!!busy}
                  onPress={() => act(item.id, 'delete')}
                />
              </>
            }
          />
        )}
      />
    </View>
  );
}

export function AdminTeamsPane() {
  const data = useAdminData();
  const [q, setQ] = useState('');
  if (data.loading) return <AdminLoading />;
  const filtered = data.teams.filter((team) => {
    const query = q.trim().toLowerCase();
    if (!query) return true;
    return (
      team.name.toLowerCase().includes(query) ||
      team.club_id.toLowerCase().includes(query) ||
      (team.category?.toLowerCase().includes(query) ?? false)
    );
  });
  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <AdminPaneHeader title="Équipes" subtitle={`${data.teams.length} équipes Firestore`} />
        <AdminSearchField value={q} onChangeText={setQ} placeholder="Nom, club, catégorie…" />
      </View>
      <FlatList
        data={filtered}
        keyExtractor={(team) => team.id}
        contentContainerStyle={styles.pad}
        ListEmptyComponent={
          <AdminEmptyState
            title="Aucune équipe"
            body="Les équipes créées par les clubs apparaîtront ici."
            icon="shirt"
          />
        }
        renderItem={({ item }) => (
          <AdminEntityRow
            title={item.name}
            subtitle={`Club ${item.club_id}`}
            meta={item.category ?? 'Sans catégorie'}
            leading={<AdminAvatarMark label={item.name} tone="info" />}
          />
        )}
      />
    </View>
  );
}

export function AdminCamerasPane() {
  const data = useAdminData();
  const [q, setQ] = useState('');
  if (data.loading) return <AdminLoading />;
  const filtered = data.cameras.filter((c) => {
    const query = q.trim().toLowerCase();
    if (!query) return true;
    const label = (c.display_name || c.brand_label || c.id).toLowerCase();
    return (
      label.includes(query) ||
      c.club_id.toLowerCase().includes(query) ||
      c.vendor.toLowerCase().includes(query) ||
      c.status.toLowerCase().includes(query)
    );
  });
  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <AdminPaneHeader title="Caméras club" subtitle={`${data.cameras.length} caméras`} />
        <AdminSearchField value={q} onChangeText={setQ} placeholder="Nom, club, vendor…" />
      </View>
      <FlatList
        data={filtered}
        keyExtractor={(c) => c.id}
        contentContainerStyle={styles.pad}
        ListEmptyComponent={
          <AdminEmptyState
            title="Aucune caméra"
            body="L’inventaire caméras clubs s’affichera dès qu’un club en ajoute."
            icon="camera"
          />
        }
        renderItem={({ item }) => (
          <AdminEntityRow
            title={item.display_name || item.brand_label || item.id}
            subtitle={`${item.club_id} · ${item.vendor}`}
            badge={String(item.status || '—').toUpperCase()}
            badgeTone={item.status === 'connected' ? 'success' : 'info'}
            leading={<AdminAvatarMark label={item.display_name || item.id} tone="info" />}
          />
        )}
      />
    </View>
  );
}

export function AdminClaimsPane({ focusId }: { focusId?: string }) {
  return <AdminIdentityQueuePane focusId={focusId} />;
}

export function AdminDirectoryPane() {
  const t = ADMIN_TOKENS;
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string>('');

  const run = () => {
    confirmAdminAction('Lancer sync annuaire public FFF ?', 'Callable admin.', async () => {
      setBusy(true);
      try {
        const r = await adminService.triggerPublicClubDirectorySync();
        setResult(JSON.stringify(r ?? { ok: true }, null, 2));
      } catch (e) {
        Alert.alert('Erreur', e instanceof Error ? e.message : 'Échec');
      } finally {
        setBusy(false);
      }
    });
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.pad} testID="admin-directory">
      <AdminPaneHeader title="Annuaire public FFF" subtitle="Sync directory clubs publics" />
      <AdminCard style={{ gap: 12 }}>
        <AdminText variant="body" muted>
          Déclenche la synchronisation de l’annuaire public (callable réelle).
        </AdminText>
        <AdminButton label={busy ? '…' : 'Force sync directory'} disabled={busy} onPress={run} />
        {result ? (
          <AdminText variant="mono" color={t.faint}>
            {result}
          </AdminText>
        ) : (
          <AdminEmptyState
            title="Prêt à synchroniser"
            body="Lancez un sync pour rafraîchir l’annuaire clubs publics FFF."
            icon="globe"
          />
        )}
      </AdminCard>
    </ScrollView>
  );
}

export function AdminSyncJobsPane() {
  const t = ADMIN_TOKENS;
  const [busy, setBusy] = useState<string | null>(null);
  const [log, setLog] = useState<string[]>([]);

  const run = (id: string, fn: () => Promise<unknown>) => {
    confirmAdminAction(`Lancer ${id} ?`, 'Job sync admin (callable).', async () => {
      setBusy(id);
      try {
        const r = await fn();
        setLog((prev) => [`${id}: ${JSON.stringify(r ?? { ok: true })}`, ...prev].slice(0, 12));
      } catch (e) {
        Alert.alert('Erreur', e instanceof Error ? e.message : 'Échec');
      } finally {
        setBusy(null);
      }
    });
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.pad} testID="admin-sync">
      <AdminPaneHeader title="Jobs de sync" subtitle="FFF · FootClubs · directory" />
      <AdminCard style={{ gap: 10 }}>
        <AdminText variant="body" muted>
          Déclencheurs callables — confirmez avant chaque job.
        </AdminText>
        <AdminButton
          label={busy === 'standings' ? '…' : 'Sync classements'}
          disabled={!!busy}
          onPress={() => run('standings', () => adminService.triggerFffStandingsSync())}
        />
        <AdminButton
          label={busy === 'rosters' ? '…' : 'Sync effectifs'}
          disabled={!!busy}
          onPress={() => run('rosters', () => adminService.triggerFffClubRostersSync())}
        />
        <AdminButton
          label={busy === 'directory' ? '…' : 'Sync annuaire public'}
          disabled={!!busy}
          onPress={() => run('directory', () => adminService.triggerPublicClubDirectorySync())}
        />
      </AdminCard>
      <AdminCard>
        <AdminText variant="h2">Journal local</AdminText>
        {log.length === 0 ? (
          <AdminEmptyState
            title="Aucun job cette session"
            body="Les résultats des syncs s’affichent ici après lancement."
            icon="refresh"
          />
        ) : (
          log.map((l, i) => (
            <AdminText key={i} variant="mono" muted>
              {l}
            </AdminText>
          ))
        )}
      </AdminCard>
    </ScrollView>
  );
}

export function AdminPaymentsPane() {
  const data = useAdminData();
  const [busy, setBusy] = useState<string | null>(null);
  const [q, setQ] = useState('');
  if (data.loading) return <AdminLoading />;
  const filtered = data.payments.filter((p) => {
    const query = q.trim().toLowerCase();
    if (!query) return true;
    return (
      p.label.toLowerCase().includes(query) ||
      p.status.toLowerCase().includes(query) ||
      p.club_id.toLowerCase().includes(query)
    );
  });
  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <AdminPaneHeader title="Paiements" subtitle={`${data.payments.length} demandes`} />
        <AdminSearchField value={q} onChangeText={setQ} placeholder="Libellé, statut, club…" />
      </View>
      <FlatList
        data={filtered}
        keyExtractor={(p) => p.id}
        contentContainerStyle={styles.pad}
        ListEmptyComponent={
          <AdminEmptyState
            title="Aucun paiement"
            body="Les demandes de paiement équipe apparaîtront ici."
            icon="bag"
          />
        }
        renderItem={({ item }) => (
          <AdminEntityRow
            title={item.label}
            subtitle={`${item.amount_eur} € · Club ${item.club_id}`}
            badge={item.status.toUpperCase()}
            badgeTone={item.status === 'paid' ? 'success' : item.status === 'pending' ? 'warn' : 'info'}
            leading={<AdminAvatarMark label={item.label} tone="accent" />}
            actions={
              item.status === 'pending' ? (
                <AdminButton
                  label={busy === item.id ? '…' : 'Marquer payé'}
                  compact
                  disabled={!!busy}
                  onPress={() =>
                    confirmAdminAction('Marquer payé ?', item.label, async () => {
                      setBusy(item.id);
                      try {
                        await adminService.updatePaymentStatus(item.id, 'paid');
                        await data.refresh();
                      } catch (e) {
                        Alert.alert('Erreur', e instanceof Error ? e.message : 'Échec');
                      } finally {
                        setBusy(null);
                      }
                    })
                  }
                />
              ) : undefined
            }
          />
        )}
      />
    </View>
  );
}

export function AdminSubscriptionsPane({ onNavigate }: { onNavigate: NavFn }) {
  const data = useAdminData();
  if (data.loading) return <AdminLoading />;
  const upgrades = data.subscriptionUpgradeRequests.filter((r) => r.status === 'pending');
  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.pad}>
      <AdminPaneHeader title="Abonnements" subtitle={`${upgrades.length} demandes upgrade`} />
      <AdminCard style={{ gap: 8 }}>
        <AdminText variant="body" muted>
          Pour offrir ou révoquer un abo, ouvrez la fiche utilisateur → onglet Abo.
        </AdminText>
        <AdminButton label="Ouvrir utilisateurs" variant="soft" onPress={() => onNavigate('users')} />
      </AdminCard>
      {upgrades.length === 0 ? (
        <AdminEmptyState
          title="Aucune demande upgrade"
          body="Les demandes d’abonnement Pro arriveront ici."
          icon="star"
          actionLabel="Voir les comptes"
          onAction={() => onNavigate('users')}
        />
      ) : (
        upgrades.map((r) => (
          <AdminEntityRow
            key={r.id}
            title={r.display_name}
            subtitle={`${r.plan_id} · ${r.billing}`}
            meta={r.email}
            badge="PENDING"
            badgeTone="warn"
            leading={<AdminAvatarMark label={r.display_name} tone="accent" />}
            onPress={() => onNavigate('users', r.user_uid)}
            actions={
              <AdminButton
                label="Ouvrir compte"
                variant="ghost"
                compact
                onPress={() => onNavigate('users', r.user_uid)}
              />
            }
          />
        ))
      )}
    </ScrollView>
  );
}

export function AdminQuotesPane({ onNavigate }: { onNavigate?: NavFn }) {
  const data = useAdminData();
  if (data.loading) return <AdminLoading />;
  const empty = data.clubQuoteRequests.length === 0;
  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.pad}>
      <AdminPaneHeader
        title="Devis clubs"
        subtitle={`${data.clubQuoteRequests.length} demandes club`}
      />
      {onNavigate ? (
        <AdminButton
          label={`Devis sponsors (${data.sponsorQuoteRequests.length})`}
          variant="soft"
          onPress={() => onNavigate('sponsor_quotes')}
        />
      ) : null}
      {empty ? (
        <AdminEmptyState
          title="Aucun devis club"
          body="Les demandes commerciales club s’affichent ici. Les devis partenaires sont dans Devis sponsors."
          icon="document"
        />
      ) : null}
      {data.clubQuoteRequests.map((q) => (
        <AdminEntityRow
          key={q.id}
          title={q.club_name}
          subtitle={`${q.owner_name} · ${q.email}`}
          meta={q.offer_hint}
          badge={q.status}
          badgeTone="warn"
          leading={<AdminAvatarMark label={q.club_name} tone="warn" />}
        />
      ))}
    </ScrollView>
  );
}

export function AdminShopPane() {
  const [rows, setRows] = useState<Awaited<ReturnType<typeof adminService.listShopOrders>>>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');

  useEffect(() => {
    void adminService.listShopOrders(80).then(setRows).finally(() => setLoading(false));
  }, []);

  if (loading) return <AdminLoading />;
  const filtered = rows.filter((o) => {
    const query = q.trim().toLowerCase();
    if (!query) return true;
    return o.id.toLowerCase().includes(query) || String(o.status).toLowerCase().includes(query);
  });
  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <AdminPaneHeader title="Commandes boutique" subtitle={`${rows.length} commandes`} />
        <AdminSearchField value={q} onChangeText={setQ} placeholder="ID, statut…" />
      </View>
      <FlatList
        data={filtered}
        keyExtractor={(o) => o.id}
        contentContainerStyle={styles.pad}
        ListEmptyComponent={
          <AdminEmptyState
            title="Aucune commande"
            body="Les commandes boutique ProDay apparaîtront ici."
            icon="bag"
          />
        }
        renderItem={({ item }) => (
          <AdminEntityRow
            title={item.id}
            subtitle={String(item.status)}
            badge={String(item.status).toUpperCase()}
            badgeTone="info"
            leading={<AdminAvatarMark label={item.id} tone="info" />}
          />
        )}
      />
    </View>
  );
}

export function AdminSponsorsPane({ onNavigate }: { onNavigate?: NavFn }) {
  const data = useAdminData();
  if (data.loading) return <AdminLoading />;
  const empty = data.sponsorOffers.length === 0 && data.fundingGoals.length === 0;
  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.pad}>
      <AdminPaneHeader
        title="Sponsors & funding"
        subtitle={`${data.sponsorOffers.length} offres · ${data.fundingGoals.length} goals`}
      />
      {onNavigate ? (
        <AdminButton
          label={`Ouvrir devis sponsors (${data.sponsorQuoteRequests.length})`}
          variant="soft"
          onPress={() => onNavigate('sponsor_quotes')}
        />
      ) : null}
      {empty ? (
        <AdminEmptyState
          title="Aucun sponsor"
          body="Offres sponsors et objectifs de funding apparaîtront ici."
          icon="briefcase"
        />
      ) : null}
      {data.sponsorOffers.map((o) => (
        <AdminEntityRow
          key={o.id}
          title={o.company_name || o.id}
          subtitle={`${o.offer_type} · ${o.value}`}
          leading={<AdminAvatarMark label={o.company_name || o.id} tone="accent" />}
        />
      ))}
      {data.fundingGoals.map((g) => (
        <AdminEntityRow
          key={g.id}
          title={g.title || g.id}
          subtitle={`Goal · club ${g.club_id}`}
          badge="GOAL"
          badgeTone="info"
          leading={<AdminAvatarMark label={g.title || g.id} tone="info" />}
        />
      ))}
    </ScrollView>
  );
}

export function AdminReelsPane() {
  const data = useAdminData();
  const { firebaseUser, profile } = useAuth();
  const [busy, setBusy] = useState<string | null>(null);
  if (data.loading) return <AdminLoading />;

  const setStatus = (id: string, status: 'approved' | 'rejected') => {
    confirmAdminAction(status === 'approved' ? 'Approuver ?' : 'Rejeter ?', id, async () => {
      setBusy(id);
      try {
        await adminService.updateCommunityReelStatus(id, status);
        await adminAuditService.log({
          action: status === 'approved' ? 'reel_approved' : 'reel_rejected',
          actor_uid: firebaseUser?.uid ?? 'admin',
          actor_email: profile?.email ?? undefined,
          target_type: 'community_reel',
          target_id: id,
          summary: `Reel ${status}`,
        });
        await data.refresh();
      } catch (e) {
        Alert.alert('Erreur', e instanceof Error ? e.message : 'Échec');
      } finally {
        setBusy(null);
      }
    }, status === 'rejected');
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.pad}>
      <AdminPaneHeader
        title="Reels communauté"
        subtitle={`${data.communityReels.length} · ${data.reelReports.length} signalements`}
      />
      {data.communityReels.length === 0 ? (
        <AdminEmptyState
          title="Aucun reel"
          body="Les reels en modération et signalements apparaîtront ici."
          icon="videocam"
        />
      ) : null}
      {data.communityReels.slice(0, 60).map((r) => (
        <AdminEntityRow
          key={r.id}
          title={r.author_name}
          subtitle={r.caption || 'Sans légende'}
          badge={r.status}
          badgeTone={r.status === 'pending' ? 'warn' : 'info'}
          leading={<AdminAvatarMark label={r.author_name} tone="warn" />}
          actions={
            r.status === 'pending' ? (
              <>
                <AdminButton
                  label="OK"
                  compact
                  disabled={!!busy}
                  onPress={() => setStatus(r.id, 'approved')}
                />
                <AdminButton
                  label="Refus"
                  variant="danger"
                  compact
                  disabled={!!busy}
                  onPress={() => setStatus(r.id, 'rejected')}
                />
              </>
            ) : undefined
          }
        />
      ))}
    </ScrollView>
  );
}

export function AdminFeedPane() {
  const { firebaseUser, profile } = useAuth();
  const [rows, setRows] = useState<Awaited<ReturnType<typeof adminService.listPlatformFeedPosts>>>([]);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setRows(await adminService.listPlatformFeedPosts(60));
  }, []);

  useEffect(() => {
    void load().finally(() => setLoading(false));
  }, [load]);

  if (loading) return <AdminLoading />;
  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.pad}>
      <AdminPaneHeader title="Feed plateforme" subtitle="Publier une news admin" />
      <AdminCard style={{ gap: 10 }}>
        <AdminText variant="h2">Nouvelle publication</AdminText>
        <AdminField value={title} onChangeText={setTitle} placeholder="Titre" />
        <AdminField value={body} onChangeText={setBody} placeholder="Corps du message" multiline />
        <AdminButton
          label={busy ? '…' : 'Publier'}
          disabled={busy || !title.trim()}
          onPress={() =>
            confirmAdminAction('Publier la news ?', title, async () => {
              setBusy(true);
              try {
                await adminService.createPlatformFeedNews({
                  author_uid: firebaseUser?.uid ?? 'admin',
                  author_name:
                    profile?.display_name || profile?.email || firebaseUser?.email || 'Admin',
                  title: title.trim(),
                  body: body.trim(),
                });
                setTitle('');
                setBody('');
                await load();
              } catch (e) {
                Alert.alert('Erreur', e instanceof Error ? e.message : 'Échec');
              } finally {
                setBusy(false);
              }
            })
          }
        />
      </AdminCard>
      {rows.length === 0 ? (
        <AdminEmptyState
          title="Feed vide"
          body="Publiez une news pour la diffuser sur la plateforme."
          icon="flash"
        />
      ) : (
        rows.map((p) => (
          <AdminEntityRow
            key={p.id}
            title={p.title}
            subtitle={p.body}
            leading={<AdminAvatarMark label={p.title} tone="accent" />}
          />
        ))
      )}
    </ScrollView>
  );
}

export function AdminMessagesPane() {
  const [rows, setRows] = useState<Awaited<ReturnType<typeof adminService.listAllMessageThreads>>>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');

  useEffect(() => {
    void adminService.listAllMessageThreads(60).then(setRows).finally(() => setLoading(false));
  }, []);

  if (loading) return <AdminLoading />;
  const filtered = rows.filter((r) => {
    const query = q.trim().toLowerCase();
    if (!query) return true;
    return (
      r.label.toLowerCase().includes(query) ||
      (r.last_message?.toLowerCase().includes(query) ?? false)
    );
  });
  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <AdminPaneHeader title="Messages" subtitle={`${rows.length} threads`} />
        <AdminSearchField value={q} onChangeText={setQ} placeholder="Thread, dernier message…" />
      </View>
      <FlatList
        data={filtered}
        keyExtractor={(r) => r.id}
        contentContainerStyle={styles.pad}
        ListEmptyComponent={
          <AdminEmptyState
            title="Aucun thread"
            body="Les conversations plateforme s’affichent ici pour modération."
            icon="chatbubbles"
          />
        }
        renderItem={({ item }) => (
          <AdminEntityRow
            title={item.label}
            subtitle={item.last_message}
            leading={<AdminAvatarMark label={item.label} tone="info" />}
          />
        )}
      />
    </View>
  );
}

export function AdminStagesPane() {
  const data = useAdminData();
  if (data.loading) return <AdminLoading />;
  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.pad}>
      <AdminPaneHeader title="Stages" subtitle={`${data.stageOffers.length} offres`} />
      {data.stageOffers.length === 0 ? (
        <AdminEmptyState
          title="Aucune offre de stage"
          body="Les offres publiées par les clubs apparaîtront ici."
          icon="school"
        />
      ) : (
        data.stageOffers.map((s) => (
          <AdminEntityRow
            key={s.id}
            title={s.title || s.id}
            subtitle={s.status}
            badge={String(s.status || '—').toUpperCase()}
            badgeTone="info"
            leading={<AdminAvatarMark label={s.title || s.id} tone="info" />}
          />
        ))
      )}
    </ScrollView>
  );
}

export function AdminRecruitmentPane() {
  const data = useAdminData();
  if (data.loading) return <AdminLoading />;
  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.pad}>
      <AdminPaneHeader
        title="Recrutement"
        subtitle={`${data.posts.length} annonces · ${data.applications.length} candidatures`}
      />
      {data.posts.length === 0 ? (
        <AdminEmptyState
          title="Aucune annonce"
          body="Les annonces de recrutement et candidatures s’affichent ici."
          icon="search"
        />
      ) : (
        data.posts.slice(0, 40).map((p) => (
          <AdminEntityRow
            key={p.id}
            title={p.title || p.id}
            subtitle={p.status}
            badge={String(p.status || '—').toUpperCase()}
            badgeTone="info"
            leading={<AdminAvatarMark label={p.title || p.id} tone="accent" />}
          />
        ))
      )}
    </ScrollView>
  );
}

export function AdminConfigPane() {
  const { firebaseUser } = useAuth();
  const [maintenance, setMaintenance] = useState(false);
  const [message, setMessage] = useState('');
  const [flags, setFlags] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const reload = useCallback(async () => {
    const c = await adminService.getPlatformConfig();
    setMaintenance(!!c.maintenance_mode);
    setMessage(c.maintenance_message ?? '');
    setFlags({ ...(c.feature_flags as unknown as Record<string, boolean>) });
  }, []);

  useEffect(() => {
    void reload().finally(() => setLoading(false));
  }, [reload]);

  if (loading) return <AdminLoading />;
  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.pad}>
      <AdminPaneHeader title="Config plateforme" subtitle="Maintenance · feature flags" />
      <AdminCard style={{ gap: 10 }}>
        <AdminText variant="h2">Maintenance</AdminText>
        <AdminBadge label={maintenance ? 'ON' : 'OFF'} tone={maintenance ? 'danger' : 'success'} />
        <View style={styles.chipRow}>
          <AdminButton label="Activer" variant="danger" onPress={() => setMaintenance(true)} />
          <AdminButton label="Désactiver" variant="soft" onPress={() => setMaintenance(false)} />
        </View>
        <AdminField
          value={message}
          onChangeText={setMessage}
          placeholder="Message maintenance affiché aux users"
        />
      </AdminCard>
      <AdminCard style={{ gap: 8 }}>
        <AdminText variant="h2">Feature flags</AdminText>
        {Object.keys(flags).length === 0 ? (
          <AdminText variant="caption" muted>
            Aucun flag chargé — enregistrez pour initialiser.
          </AdminText>
        ) : (
          Object.keys(flags).map((key) => (
            <AdminEntityRow
              key={key}
              title={key}
              badge={flags[key] ? 'ON' : 'OFF'}
              badgeTone={flags[key] ? 'success' : 'info'}
              onPress={() => setFlags((prev) => ({ ...prev, [key]: !prev[key] }))}
            />
          ))
        )}
        <AdminButton
          label={busy ? '…' : 'Enregistrer'}
          disabled={busy}
          onPress={() =>
            confirmAdminAction('Sauver la config ?', 'platform_config/main', async () => {
              setBusy(true);
              try {
                await adminService.updatePlatformConfig(
                  {
                    maintenance_mode: maintenance,
                    maintenance_message: message,
                    feature_flags: flags as never,
                  },
                  firebaseUser?.uid ?? 'admin',
                  firebaseUser?.email ?? undefined,
                );
                await reload();
                Alert.alert('OK', 'Config enregistrée');
              } catch (e) {
                Alert.alert('Erreur', e instanceof Error ? e.message : 'Échec');
              } finally {
                setBusy(false);
              }
            })
          }
        />
      </AdminCard>
    </ScrollView>
  );
}

export function AdminTrafficPane() {
  const data = useAdminData();
  if (data.loading) return <AdminLoading />;
  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.pad}>
      <AdminPaneHeader title="Trafic & stats" subtitle="Site · app opens · snapshots" />
      <View style={styles.metricGrid}>
        <AdminMetricTile label="Visites site" value={data.trafficTotals.site_visits} />
        <AdminMetricTile label="Ouvertures app" value={data.trafficTotals.app_opens} />
      </View>
      {data.trafficDaily.length === 0 ? (
        <AdminEmptyState
          title="Pas encore de snapshots"
          body="Les totaux journaliers s’accumuleront ici."
          icon="stats-chart"
        />
      ) : (
        data.trafficDaily.slice(0, 14).map((d) => (
          <AdminEntityRow
            key={d.day_key}
            title={d.day_key}
            subtitle={`Site ${d.site_visits} · App ${d.app_opens}`}
            leading={<AdminAvatarMark label={d.day_key} tone="info" />}
          />
        ))
      )}
    </ScrollView>
  );
}

export function AdminTournamentsPane() {
  const data = useAdminData();
  const [q, setQ] = useState('');
  if (data.loading) return <AdminLoading />;
  const filtered = data.tournaments.filter((tour) => {
    const query = q.trim().toLowerCase();
    if (!query) return true;
    return (
      tour.name.toLowerCase().includes(query) ||
      (tour.city?.toLowerCase().includes(query) ?? false) ||
      (tour.status?.toLowerCase().includes(query) ?? false)
    );
  });
  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <AdminPaneHeader title="Tournois" subtitle={`${data.tournaments.length} tournois`} />
        <AdminSearchField value={q} onChangeText={setQ} placeholder="Nom, ville, statut…" />
      </View>
      <FlatList
        data={filtered}
        keyExtractor={(tour) => tour.id}
        contentContainerStyle={styles.pad}
        ListEmptyComponent={
          <AdminEmptyState
            title="Aucun tournoi"
            body="Les tournois organisés sur ProDay apparaîtront ici."
            icon="trophy"
          />
        }
        renderItem={({ item }) => (
          <AdminEntityRow
            title={item.name}
            subtitle={item.city ?? 'Ville non renseignée'}
            meta={item.status ?? '—'}
            badge={String(item.status || '—').toUpperCase()}
            badgeTone="accent"
            leading={<AdminAvatarMark label={item.name} tone="accent" />}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: ADMIN_TOKENS.bg },
  pad: { padding: adminLayout.pageGutter, gap: adminSpace.md, paddingBottom: 48 },
  header: {
    paddingHorizontal: adminLayout.pageGutter,
    paddingTop: adminSpace.md,
    paddingBottom: adminSpace.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: ADMIN_TOKENS.hairline,
  },
  hero: { padding: adminSpace.xl, gap: 10 },
  heroActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  metricGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  metric: {
    width: '31%',
    minWidth: 96,
    flexGrow: 1,
    padding: adminSpace.md,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    gap: 4,
  },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  queueRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', paddingVertical: 6 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  input: {
    borderWidth: 1,
    borderColor: ADMIN_TOKENS.border,
    backgroundColor: ADMIN_TOKENS.surfaceRaised,
    color: ADMIN_TOKENS.foreground,
    borderRadius: adminRadius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
});
