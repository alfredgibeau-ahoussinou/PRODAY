import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAdminData } from '../data/AdminDataContext';
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

/** Commande — hub dense (remplace Pulse clinique). */
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
        colors={['#1C2330', '#12161F', '#090B10']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[adminSurfaceHero(), styles.hero]}
      >
        <AdminText variant="label" color={t.signal}>
          ESPACE ADMIN · CONTROL ROOM
        </AdminText>
        <AdminText variant="display" color={t.foreground}>
          Commande
        </AdminText>
        <AdminText variant="body" color={t.muted}>
          Pilotage exhaustif — utilisateurs, clubs, FFF, business, contenu. Ouvrez Menu pour les{' '}
          {ADMIN_NAV_ITEMS.length} pages.
        </AdminText>
        {data.workQueue.length > 0 ? (
          <View style={styles.heroActions}>
            <AdminButton
              label={`File prioritaire (${data.workQueue.length})`}
              variant="soft"
              onPress={() => onNavigate('queue')}
            />
          </View>
        ) : null}
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
          <Pressable
            key={m.label}
            onPress={() => onNavigate(m.go)}
            style={[
              styles.metric,
              {
                borderColor: m.hot && Number(m.value) > 0 ? t.warn : t.border,
                backgroundColor: t.surface,
              },
            ]}
          >
            <AdminText variant="label" color={t.faint}>
              {m.label}
            </AdminText>
            <AdminText variant="statSm" color={m.hot && Number(m.value) > 0 ? t.warn : t.foreground}>
              {m.value}
            </AdminText>
          </Pressable>
        ))}
      </View>

      <AdminCard>
        <View style={styles.rowBetween}>
          <AdminText variant="h2">File prioritaire</AdminText>
          <AdminButton label="Tout voir" variant="ghost" onPress={() => onNavigate('queue')} />
        </View>
        {top.length === 0 ? (
          <AdminEmptyState title="File claire" body="Rien d’urgent pour l’instant." />
        ) : (
          top.map((item) => (
            <Pressable
              key={item.id}
              onPress={() => onNavigate(item.targetSection, item.entityId)}
              style={styles.queueRow}
            >
              <AdminBadge
                label={item.priority.toUpperCase()}
                tone={item.priority === 'critical' ? 'danger' : 'warn'}
              />
              <View style={{ flex: 1, gap: 2 }}>
                <AdminText variant="h3">{item.title}</AdminText>
                <AdminText variant="caption" color={t.muted} numberOfLines={1}>
                  {item.subtitle}
                </AdminText>
              </View>
            </Pressable>
          ))
        )}
      </AdminCard>

    </ScrollView>
  );
}

export function AdminQueuePane({ onNavigate }: { onNavigate: NavFn }) {
  const data = useAdminData();
  const t = ADMIN_TOKENS;
  if (data.loading) return <AdminLoading />;
  return (
    <View style={styles.root} testID="admin-queue">
      <View style={styles.header}>
        <AdminPaneHeader
          title="File prioritaire"
          subtitle={`${data.workQueue.length} actions · triées par criticité`}
        />
      </View>
      <FlatList
        data={data.workQueue}
        keyExtractor={(i) => i.id}
        contentContainerStyle={styles.pad}
        ListEmptyComponent={<AdminEmptyState title="File vide" body="Aucune action en attente." />}
        renderItem={({ item, index }) => (
          <AdminListRow index={index} onPress={() => onNavigate(item.targetSection, item.entityId)}>
            <AdminCard>
              <View style={styles.queueRow}>
                <AdminBadge
                  label={item.priority.toUpperCase()}
                  tone={item.priority === 'critical' ? 'danger' : item.priority === 'high' ? 'warn' : 'info'}
                />
                <View style={{ flex: 1 }}>
                  <AdminText variant="h3">{item.title}</AdminText>
                  <AdminText variant="caption" color={t.muted}>
                    {item.subtitle}
                  </AdminText>
                </View>
              </View>
            </AdminCard>
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
      <AdminCard>
        <AdminText variant="stat" color={data.health.score >= 80 ? t.success : t.warn}>
          {data.health.score}
        </AdminText>
        <AdminText variant="caption" color={t.muted}>
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
          <View key={String(label)} style={[styles.metric, { backgroundColor: t.surface, borderColor: t.border }]}>
            <AdminText variant="label" color={t.faint}>
              {label}
            </AdminText>
            <AdminText variant="statSm">{value ?? 0}</AdminText>
          </View>
        ))}
      </View>
      <AdminCard>
        <AdminText variant="h2">Trafic</AdminText>
        <AdminText variant="body" color={t.muted}>
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
        ListEmptyComponent={<AdminEmptyState title="Vide" body="Aucun audit récent." />}
        renderItem={({ item }) => (
          <AdminCard style={{ marginBottom: 8 }}>
            <AdminText variant="caption" color={t.signal}>
              {item.action}
            </AdminText>
            <AdminText variant="h3">{item.summary}</AdminText>
            <AdminText variant="mono" color={t.faint}>
              {item.target_type}/{item.target_id.slice(0, 12)} · {item.created_at.toLocaleString('fr-FR')}
            </AdminText>
          </AdminCard>
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
  const t = ADMIN_TOKENS;
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
        ListEmptyComponent={<AdminEmptyState title="Aucune adhésion" body="File claire." />}
        renderItem={({ item }) => (
          <AdminCard style={{ marginBottom: 8, gap: 8 }}>
            <AdminText variant="h3">{item.player_name}</AdminText>
            <AdminText variant="caption" color={t.muted}>
              Club {item.club_id} · {item.license_number ?? 'sans licence'}
            </AdminText>
            <View style={styles.chipRow}>
              <AdminButton
                label={busy === item.id ? '…' : 'Approuver'}
                disabled={!!busy}
                onPress={() => decide(item.id, true)}
              />
              <AdminButton
                label="Refuser"
                variant="danger"
                disabled={!!busy}
                onPress={() => decide(item.id, false)}
              />
            </View>
          </AdminCard>
        )}
      />
    </View>
  );
}

export function AdminBetaPane() {
  const t = ADMIN_TOKENS;
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
        ListEmptyComponent={<AdminEmptyState title="Vide" body="Aucune inscription bêta." />}
        renderItem={({ item }) => (
          <AdminCard style={{ marginBottom: 8, gap: 6 }}>
            <AdminText variant="h3">{item.name || item.email}</AdminText>
            <AdminText variant="caption" color={t.muted}>
              {item.email} · {item.status} · {item.role_label || item.role || '—'}
            </AdminText>
            <View style={styles.chipRow}>
              <AdminButton label="OK" disabled={!!busy} onPress={() => act(item.id, 'approve')} />
              <AdminButton label="Refus" variant="danger" disabled={!!busy} onPress={() => act(item.id, 'reject')} />
              <AdminButton label="Mail" variant="ghost" disabled={!!busy} onPress={() => act(item.id, 'resend')} />
              <AdminButton label="Suppr." variant="ghost" disabled={!!busy} onPress={() => act(item.id, 'delete')} />
            </View>
          </AdminCard>
        )}
      />
    </View>
  );
}

export function AdminTeamsPane() {
  const data = useAdminData();
  const t = ADMIN_TOKENS;
  if (data.loading) return <AdminLoading />;
  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <AdminPaneHeader title="Équipes" subtitle={`${data.teams.length} équipes`} />
      </View>
      <FlatList
        data={data.teams}
        keyExtractor={(t) => t.id}
        contentContainerStyle={styles.pad}
        ListEmptyComponent={<AdminEmptyState title="Aucune équipe" body="—" />}
        renderItem={({ item }) => (
          <AdminCard style={{ marginBottom: 8 }}>
            <AdminText variant="h3">{item.name}</AdminText>
            <AdminText variant="caption" color={t.muted}>
              Club {item.club_id} · {item.category ?? '—'}
            </AdminText>
          </AdminCard>
        )}
      />
    </View>
  );
}

export function AdminCamerasPane() {
  const data = useAdminData();
  const t = ADMIN_TOKENS;
  if (data.loading) return <AdminLoading />;
  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <AdminPaneHeader title="Caméras club" subtitle={`${data.cameras.length} caméras`} />
      </View>
      <FlatList
        data={data.cameras}
        keyExtractor={(c) => c.id}
        contentContainerStyle={styles.pad}
        ListEmptyComponent={<AdminEmptyState title="Aucune caméra" body="—" />}
        renderItem={({ item }) => (
          <AdminCard style={{ marginBottom: 8 }}>
            <AdminText variant="h3">{item.display_name || item.brand_label || item.id}</AdminText>
            <AdminText variant="caption" color={t.muted}>
              {item.club_id} · {item.vendor} · {item.status}
            </AdminText>
          </AdminCard>
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
        <AdminText variant="body" color={t.muted}>
          Déclenche la synchronisation de l’annuaire public (callable réelle).
        </AdminText>
        <AdminButton label={busy ? '…' : 'Force sync directory'} disabled={busy} onPress={run} />
        {result ? (
          <AdminText variant="mono" color={t.faint}>
            {result}
          </AdminText>
        ) : null}
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
          <AdminText variant="caption" color={t.faint}>
            Aucun job lancé cette session.
          </AdminText>
        ) : (
          log.map((l, i) => (
            <AdminText key={i} variant="mono" color={t.muted}>
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
  const t = ADMIN_TOKENS;
  const [busy, setBusy] = useState<string | null>(null);
  if (data.loading) return <AdminLoading />;
  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <AdminPaneHeader title="Paiements" subtitle={`${data.payments.length} demandes`} />
      </View>
      <FlatList
        data={data.payments}
        keyExtractor={(p) => p.id}
        contentContainerStyle={styles.pad}
        ListEmptyComponent={<AdminEmptyState title="Aucun paiement" body="—" />}
        renderItem={({ item }) => (
          <AdminCard style={{ marginBottom: 8, gap: 8 }}>
            <AdminText variant="h3">{item.label}</AdminText>
            <AdminText variant="caption" color={t.muted}>
              {item.amount_eur} € · {item.status} · {item.club_id}
            </AdminText>
            {item.status === 'pending' ? (
              <AdminButton
                label={busy === item.id ? '…' : 'Marquer payé'}
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
            ) : null}
          </AdminCard>
        )}
      />
    </View>
  );
}

export function AdminSubscriptionsPane({ onNavigate }: { onNavigate: NavFn }) {
  const data = useAdminData();
  const t = ADMIN_TOKENS;
  if (data.loading) return <AdminLoading />;
  const upgrades = data.subscriptionUpgradeRequests.filter((r) => r.status === 'pending');
  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.pad}>
      <AdminPaneHeader title="Abonnements" subtitle={`${upgrades.length} demandes upgrade`} />
      <AdminCard style={{ gap: 8 }}>
        <AdminText variant="body" color={t.muted}>
          Pour offrir / révoquer un abo, ouvrez la fiche utilisateur → onglet Abo.
        </AdminText>
        <AdminButton label="Ouvrir utilisateurs" variant="soft" onPress={() => onNavigate('users')} />
      </AdminCard>
      {upgrades.map((r) => (
        <AdminCard key={r.id} style={{ marginBottom: 8 }}>
          <AdminText variant="h3">{r.display_name}</AdminText>
          <AdminText variant="caption" color={t.muted}>
            {r.plan_id} · {r.billing} · {r.email}
          </AdminText>
          <AdminButton
            label="Ouvrir compte"
            variant="ghost"
            onPress={() => onNavigate('users', r.user_uid)}
          />
        </AdminCard>
      ))}
    </ScrollView>
  );
}

export function AdminQuotesPane() {
  const data = useAdminData();
  const t = ADMIN_TOKENS;
  if (data.loading) return <AdminLoading />;
  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.pad}>
      <AdminPaneHeader
        title="Devis clubs"
        subtitle={`${data.clubQuoteRequests.length} devis · ${data.sponsorQuoteRequests.length} partenaires`}
      />
      {data.clubQuoteRequests.map((q) => (
        <AdminCard key={q.id} style={{ marginBottom: 8 }}>
          <AdminBadge label={q.status} tone="warn" />
          <AdminText variant="h3">{q.club_name}</AdminText>
          <AdminText variant="caption" color={t.muted}>
            {q.owner_name} · {q.email} · {q.offer_hint}
          </AdminText>
        </AdminCard>
      ))}
      {data.sponsorQuoteRequests.map((q) => (
        <AdminCard key={q.id} style={{ marginBottom: 8 }}>
          <AdminBadge label={q.status} tone="info" />
          <AdminText variant="h3">{q.company_name}</AdminText>
          <AdminText variant="caption" color={t.muted}>
            {q.contact_name} · {q.contact_email}
          </AdminText>
        </AdminCard>
      ))}
    </ScrollView>
  );
}

export function AdminShopPane() {
  const t = ADMIN_TOKENS;
  const [rows, setRows] = useState<Awaited<ReturnType<typeof adminService.listShopOrders>>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void adminService.listShopOrders(80).then(setRows).finally(() => setLoading(false));
  }, []);

  if (loading) return <AdminLoading />;
  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <AdminPaneHeader title="Commandes boutique" subtitle={`${rows.length} commandes`} />
      </View>
      <FlatList
        data={rows}
        keyExtractor={(o) => o.id}
        contentContainerStyle={styles.pad}
        ListEmptyComponent={<AdminEmptyState title="Aucune commande" body="—" />}
        renderItem={({ item }) => (
          <AdminCard style={{ marginBottom: 8 }}>
            <AdminText variant="h3">{item.id}</AdminText>
            <AdminText variant="caption" color={t.muted}>
              {item.status}
            </AdminText>
          </AdminCard>
        )}
      />
    </View>
  );
}

export function AdminSponsorsPane() {
  const data = useAdminData();
  const t = ADMIN_TOKENS;
  if (data.loading) return <AdminLoading />;
  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.pad}>
      <AdminPaneHeader
        title="Sponsors & funding"
        subtitle={`${data.sponsorOffers.length} offres · ${data.fundingGoals.length} goals`}
      />
      {data.sponsorOffers.map((o) => (
        <AdminCard key={o.id} style={{ marginBottom: 8 }}>
          <AdminText variant="h3">{o.company_name || o.id}</AdminText>
          <AdminText variant="caption" color={t.muted}>
            {o.offer_type} · {o.value}
          </AdminText>
        </AdminCard>
      ))}
      {data.fundingGoals.map((g) => (
        <AdminCard key={g.id} style={{ marginBottom: 8 }}>
          <AdminText variant="h3">{g.title || g.id}</AdminText>
          <AdminText variant="caption" color={t.muted}>
            Goal · {g.club_id}
          </AdminText>
        </AdminCard>
      ))}
    </ScrollView>
  );
}

export function AdminReelsPane() {
  const data = useAdminData();
  const t = ADMIN_TOKENS;
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
      {data.communityReels.slice(0, 60).map((r) => (
        <AdminCard key={r.id} style={{ marginBottom: 8, gap: 8 }}>
          <AdminBadge label={r.status} tone={r.status === 'pending' ? 'warn' : 'info'} />
          <AdminText variant="h3">{r.author_name}</AdminText>
          <AdminText variant="caption" color={t.muted} numberOfLines={2}>
            {r.caption || 'Sans légende'}
          </AdminText>
          {r.status === 'pending' ? (
            <View style={styles.chipRow}>
              <AdminButton label="OK" disabled={!!busy} onPress={() => setStatus(r.id, 'approved')} />
              <AdminButton label="Refus" variant="danger" disabled={!!busy} onPress={() => setStatus(r.id, 'rejected')} />
            </View>
          ) : null}
        </AdminCard>
      ))}
    </ScrollView>
  );
}

export function AdminFeedPane() {
  const t = ADMIN_TOKENS;
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
      <AdminPaneHeader title="Feed plateforme" subtitle="News admin" />
      <AdminCard style={{ gap: 8 }}>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Titre"
          placeholderTextColor={t.faint}
          style={styles.input}
        />
        <TextInput
          value={body}
          onChangeText={setBody}
          placeholder="Corps"
          placeholderTextColor={t.faint}
          multiline
          style={[styles.input, { minHeight: 72 }]}
        />
        <AdminButton
          label={busy ? '…' : 'Publier'}
          disabled={busy}
          onPress={() =>
            confirmAdminAction('Publier la news ?', title, async () => {
              setBusy(true);
              try {
                await adminService.createPlatformFeedNews({
                  author_uid: firebaseUser?.uid ?? 'admin',
                  author_name: profile?.display_name || profile?.email || firebaseUser?.email || 'Admin',
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
      {rows.map((p) => (
        <AdminCard key={p.id} style={{ marginBottom: 8 }}>
          <AdminText variant="h3">{p.title}</AdminText>
          <AdminText variant="caption" color={t.muted} numberOfLines={2}>
            {p.body}
          </AdminText>
        </AdminCard>
      ))}
    </ScrollView>
  );
}

export function AdminMessagesPane() {
  const t = ADMIN_TOKENS;
  const [rows, setRows] = useState<Awaited<ReturnType<typeof adminService.listAllMessageThreads>>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void adminService.listAllMessageThreads(60).then(setRows).finally(() => setLoading(false));
  }, []);

  if (loading) return <AdminLoading />;
  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <AdminPaneHeader title="Messages" subtitle={`${rows.length} threads`} />
      </View>
      <FlatList
        data={rows}
        keyExtractor={(r) => r.id}
        contentContainerStyle={styles.pad}
        ListEmptyComponent={<AdminEmptyState title="Aucun thread" body="—" />}
        renderItem={({ item }) => (
          <AdminCard style={{ marginBottom: 8 }}>
            <AdminText variant="h3">{item.label}</AdminText>
            <AdminText variant="caption" color={t.muted} numberOfLines={2}>
              {item.last_message}
            </AdminText>
          </AdminCard>
        )}
      />
    </View>
  );
}

export function AdminStagesPane() {
  const data = useAdminData();
  const t = ADMIN_TOKENS;
  if (data.loading) return <AdminLoading />;
  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.pad}>
      <AdminPaneHeader title="Stages" subtitle={`${data.stageOffers.length} offres`} />
      {data.stageOffers.map((s) => (
        <AdminCard key={s.id} style={{ marginBottom: 8 }}>
          <AdminText variant="h3">{s.title || s.id}</AdminText>
          <AdminText variant="caption" color={t.muted}>
            {s.status}
          </AdminText>
        </AdminCard>
      ))}
    </ScrollView>
  );
}

export function AdminRecruitmentPane() {
  const data = useAdminData();
  const t = ADMIN_TOKENS;
  if (data.loading) return <AdminLoading />;
  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.pad}>
      <AdminPaneHeader
        title="Recrutement"
        subtitle={`${data.posts.length} annonces · ${data.applications.length} candidatures`}
      />
      {data.posts.slice(0, 40).map((p) => (
        <AdminCard key={p.id} style={{ marginBottom: 8 }}>
          <AdminText variant="h3">{p.title || p.id}</AdminText>
          <AdminText variant="caption" color={t.muted}>
            {p.status}
          </AdminText>
        </AdminCard>
      ))}
    </ScrollView>
  );
}

export function AdminConfigPane() {
  const t = ADMIN_TOKENS;
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
        <TextInput
          value={message}
          onChangeText={setMessage}
          placeholder="Message maintenance"
          placeholderTextColor={t.faint}
          style={styles.input}
        />
      </AdminCard>
      <AdminCard style={{ gap: 8 }}>
        <AdminText variant="h2">Feature flags</AdminText>
        {Object.keys(flags).map((key) => (
          <Pressable
            key={key}
            onPress={() => setFlags((prev) => ({ ...prev, [key]: !prev[key] }))}
            style={styles.queueRow}
          >
            <AdminBadge label={flags[key] ? 'ON' : 'OFF'} tone={flags[key] ? 'success' : 'info'} />
            <AdminText variant="body">{key}</AdminText>
          </Pressable>
        ))}
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
  const t = ADMIN_TOKENS;
  if (data.loading) return <AdminLoading />;
  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.pad}>
      <AdminPaneHeader title="Trafic & stats" subtitle="Site · app opens · snapshots" />
      <AdminCard>
        <AdminText variant="statSm">{data.trafficTotals.site_visits}</AdminText>
        <AdminText variant="caption" color={t.muted}>
          Visites site
        </AdminText>
        <AdminText variant="statSm" style={{ marginTop: 12 }}>
          {data.trafficTotals.app_opens}
        </AdminText>
        <AdminText variant="caption" color={t.muted}>
          Ouvertures app
        </AdminText>
      </AdminCard>
      {data.trafficDaily.slice(0, 14).map((d) => (
        <AdminCard key={d.day_key} style={{ marginBottom: 6 }}>
          <AdminText variant="h3">{d.day_key}</AdminText>
          <AdminText variant="caption" color={t.muted}>
            Site {d.site_visits} · App {d.app_opens}
          </AdminText>
        </AdminCard>
      ))}
    </ScrollView>
  );
}

export function AdminTournamentsPane() {
  const data = useAdminData();
  const t = ADMIN_TOKENS;
  if (data.loading) return <AdminLoading />;
  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.pad}>
      <AdminPaneHeader title="Tournois" subtitle={`${data.tournaments.length} tournois`} />
      {data.tournaments.map((tour) => (
        <AdminCard key={tour.id} style={{ marginBottom: 8 }}>
          <AdminText variant="h3">{tour.name}</AdminText>
          <AdminText variant="caption" color={t.muted}>
            {tour.city ?? '—'} · {tour.status ?? '—'}
          </AdminText>
        </AdminCard>
      ))}
    </ScrollView>
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
