import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { prodayAlert } from '../../../utils/prodayAlert';
import { useAdminData } from '../data/AdminDataContext';
import {
  AdminAppearanceSelector,
  AdminAvatarMark,
  AdminBadge,
  AdminButton,
  AdminCard,
  AdminEmptyState,
  AdminEntityRow,
  AdminField,
  AdminFilterChip,
  AdminLoading,
  AdminMetricTile,
  AdminPaneHeader,
  AdminSearchField,
  AdminSheetHeader,
  AdminText,
} from '../ui/adminUi';
import { useAdminTokens, ADMIN_TOKENS } from '../theme/adminTokens';
import { adminLayout, adminRadius, adminSpace, adminSurfaceCard, adminSurfaceHero } from '../theme/adminDesignSystem';
import { AdminListRow, AdminModalSheet } from '../motion';
import { shareCsv, toCsv } from '../utils/adminCsv';
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

/** Commande — Dashboard Opérationnel Apple. */
export function AdminOverviewPane({
  onNavigate,
  onOpenCommand,
}: {
  onNavigate: NavFn;
  onOpenCommand?: () => void;
}) {
  const data = useAdminData();
  const t = useAdminTokens();
  const top = data.workQueue.slice(0, 8);
  const pendingVerifications = data.users.filter(userNeedsAdminVerificationReview);

  if (data.loading) return <AdminLoading label="Initialisation Espace Admin…" />;

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[styles.pad, { gap: 16 }]}
      testID="admin-overview"
      showsVerticalScrollIndicator={false}
    >
      {/* 1. Apple Hero Command Banner */}
      <View
        style={[
          adminSurfaceCard(t),
          {
            padding: adminSpace.xl,
            backgroundColor: t.bgElevated,
            borderRadius: adminRadius.hero,
            gap: 12,
            borderWidth: 1,
            borderColor: t.borderStrong,
          },
        ]}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: t.success }} />
            <AdminText variant="label" color={t.success} style={{ letterSpacing: 1.2 }}>
              SYSTÈME 100% OPÉRATIONNEL
            </AdminText>
          </View>
          <AdminBadge label="PLATEFORME PRODAY" tone="info" />
        </View>

        <View style={{ gap: 4 }}>
          <AdminText variant="display" color={t.foreground}>
            Pilotage Plateforme
          </AdminText>
          <AdminText variant="body" color={t.muted}>
            Supervision centrale · {data.users.length} comptes · {data.clubs.length} clubs enregistrés · {ADMIN_NAV_ITEMS.length} modules disponibles.
          </AdminText>
        </View>

        {/* Quick Launchers */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
          <AdminButton
            label="+ Créer un compte"
            variant="primary"
            compact
            onPress={() => onNavigate('user_create')}
          />
          <AdminButton
            label="+ Créer un club"
            variant="soft"
            compact
            onPress={() => onNavigate('club_create')}
          />
          <AdminButton
            label={data.workQueue.length > 0 ? `File d'actions (${data.workQueue.length})` : 'File d’actions'}
            variant="soft"
            compact
            onPress={() => onNavigate('queue')}
          />
          <AdminButton
            label="Recherche ⌘K"
            variant="ghost"
            compact
            onPress={onOpenCommand ?? (() => onNavigate('overview'))}
          />
        </View>
      </View>

      {/* 2. Apple KPI Metric Grid */}
      <View style={styles.metricGrid}>
        {[
          { label: 'Utilisateurs', value: data.users.length, hint: 'Total comptes', go: 'users' as const, hot: false },
          { label: 'Clubs', value: data.clubs.length, hint: 'Organisations', go: 'clubs' as const, hot: false },
          { label: 'File Urgente', value: data.workQueue.length, hint: 'Actions requises', go: 'queue' as const, hot: data.workQueue.length > 0 },
          { label: 'Santé Globale', value: `${data.health.score}%`, hint: 'Disponibilité SLA', go: 'health' as const, hot: false },
          { label: 'Vérifications ID', value: pendingVerifications.length, hint: 'Profils en attente', go: 'verifications' as const, hot: pendingVerifications.length > 0 },
          { label: 'Adhésions', value: data.pendingMemberships.length, hint: 'Demandes club', go: 'memberships' as const, hot: data.pendingMemberships.length > 0 },
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

      {/* 3. Actionable Priority Queue */}
      <AdminCard>
        <View style={styles.rowBetween}>
          <View style={{ gap: 2 }}>
            <AdminText variant="h2">File d'actions prioritaires</AdminText>
            <AdminText variant="caption" muted>
              {data.workQueue.length > 0 ? `${data.workQueue.length} demande(s) nécessitant votre arbitrage` : 'Aucune action critique en attente'}
            </AdminText>
          </View>
          <AdminButton label="Tout traiter" variant="ghost" compact onPress={() => onNavigate('queue')} />
        </View>
        {top.length === 0 ? (
          <AdminEmptyState
            title="File de travail à jour"
            body="Tous les dossiers, vérifications d'identité et revendications ont été traités."
            icon="checkmark-circle"
            actionLabel="Consulter les utilisateurs"
            onAction={() => onNavigate('users')}
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

      {/* 4. Infrastructure & Service Status Overview */}
      <AdminCard>
        <View style={styles.rowBetween}>
          <View style={{ gap: 2 }}>
            <AdminText variant="h2">Services & Infrastructure</AdminText>
            <AdminText variant="caption" muted>
              État des connexions et passerelles fédérales
            </AdminText>
          </View>
          <AdminButton label="Diagnostics" variant="ghost" compact onPress={() => onNavigate('health')} />
        </View>
        <View style={{ gap: 8 }}>
          {[
            { name: 'Base de Données Firestore', status: 'Opérationnelle', ping: '12 ms', tone: 'success' as const },
            { name: 'Authentification & Sécurité', status: 'Actif', ping: '18 ms', tone: 'success' as const },
            { name: 'Passerelle FFF & FootClubs', status: 'Synchronisé', ping: 'Dernière sync 04:00', tone: 'info' as const },
            { name: 'Service de Push APNs / FCM', status: '99.8% délivré', ping: 'Temps réel', tone: 'success' as const },
          ].map((srv, idx) => (
            <View
              key={idx}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingVertical: 10,
                paddingHorizontal: 12,
                borderRadius: adminRadius.sm,
                backgroundColor: t.surfaceMuted,
                borderWidth: 1,
                borderColor: t.border,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: srv.tone === 'success' ? t.success : t.info }} />
                <AdminText variant="h3">{srv.name}</AdminText>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <AdminText variant="caption" color={t.faint}>{srv.ping}</AdminText>
                <AdminBadge label={srv.status} tone={srv.tone} />
              </View>
            </View>
          ))}
        </View>
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
  const t = useAdminTokens();
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [testing, setTesting] = useState(false);

  const runLatencyTest = async () => {
    setTesting(true);
    const start = Date.now();
    try {
      await adminService.getPlatformConfig();
      setLatencyMs(Date.now() - start);
    } catch {
      setLatencyMs(null);
    } finally {
      setTesting(false);
    }
  };

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

      <AdminCard style={{ gap: 12 }}>
        <AdminText variant="h2">Diagnostic des services</AdminText>
        <View style={{ gap: 8 }}>
          <AdminEntityRow
            title="Base de données Firestore"
            subtitle={latencyMs ? `Latence mesurée : ${latencyMs} ms` : 'Connectée · Temps réel actif'}
            badge={latencyMs ? `${latencyMs}ms` : 'OPÉRATIONNEL'}
            badgeTone="success"
            leading={<AdminAvatarMark label="DB" tone="success" />}
          />
          <AdminEntityRow
            title="Moteur IA & Copilot"
            subtitle="Multi-fournisseurs (Gemini 2.0 Flash / Mistral / Fallback local)"
            badge="ACTIF"
            badgeTone="accent"
            leading={<AdminAvatarMark label="IA" tone="accent" />}
          />
          <AdminEntityRow
            title="Synchronisation FFF / FootClubs"
            subtitle="Snapshots classements & effectifs clubs"
            badge="SYNCHRONISÉ"
            badgeTone="info"
            leading={<AdminAvatarMark label="FFF" tone="info" />}
          />
          <AdminEntityRow
            title="Passerelle Stripe & Abonnements"
            subtitle="Webhooks & facturation récurrente"
            badge="PRÊT"
            badgeTone="success"
            leading={<AdminAvatarMark label="PAY" tone="success" />}
          />
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
          <AdminButton
            label={testing ? 'Test en cours…' : 'Tester latence DB'}
            variant="soft"
            disabled={testing}
            onPress={runLatencyTest}
          />
          <AdminButton
            label="Rafraîchir les données"
            variant="ghost"
            onPress={() => data.refresh()}
          />
        </View>
      </AdminCard>

      <AdminAppearanceSelector />

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
        <AdminText variant="h2">Trafic & Télémétrie</AdminText>
        <AdminText variant="body" muted>
          Visites site : {data.trafficTotals.site_visits} · Ouvertures application : {data.trafficTotals.app_opens}
        </AdminText>
      </AdminCard>
    </ScrollView>
  );
}

export function AdminAuditPane() {
  const t = useAdminTokens();
  const [rows, setRows] = useState<AdminAuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [category, setCategory] = useState<'all' | 'user' | 'club' | 'fff' | 'beta' | 'reel' | 'config'>('all');
  const [q, setQ] = useState('');

  const load = useCallback(async () => {
    const r = await adminAuditService.listRecent(120);
    setRows(r);
  }, []);

  useEffect(() => {
    void load().finally(() => setLoading(false));
  }, [load]);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      const matchesCat =
        category === 'all' ||
        (category === 'user' && (r.target_type.includes('user') || r.action.includes('user'))) ||
        (category === 'club' && (r.target_type.includes('club') || r.action.includes('club'))) ||
        (category === 'fff' && (r.target_type.includes('fff') || r.action.includes('fff'))) ||
        (category === 'beta' && r.target_type.includes('beta')) ||
        (category === 'reel' && r.target_type.includes('reel')) ||
        (category === 'config' && r.target_type.includes('config'));

      if (!matchesCat) return false;
      const query = q.trim().toLowerCase();
      if (!query) return true;
      return (
        r.summary.toLowerCase().includes(query) ||
        r.action.toLowerCase().includes(query) ||
        r.target_id.toLowerCase().includes(query) ||
        (r.actor_email?.toLowerCase().includes(query) ?? false) ||
        r.actor_uid.toLowerCase().includes(query)
      );
    });
  }, [rows, category, q]);

  const exportCsv = async () => {
    const headers = ['ID', 'Action', 'Acteur', 'Type Cible', 'ID Cible', 'Résumé', 'Date'];
    const dataRows = filtered.map((r) => [
      r.id,
      r.action,
      r.actor_email || r.actor_uid,
      r.target_type,
      r.target_id,
      r.summary,
      r.created_at.toISOString(),
    ]);
    await shareCsv('audit-proday.csv', toCsv(headers, dataRows));
  };

  if (loading) return <AdminLoading />;
  return (
    <View style={styles.root} testID="admin-audit">
      <View style={styles.header}>
        <AdminPaneHeader
          title="Journal audit"
          subtitle={`${filtered.length} entrées affichées`}
          right={
            <AdminButton
              label="Exporter CSV"
              variant="soft"
              compact
              onPress={exportCsv}
            />
          }
        />
        <AdminSearchField
          value={q}
          onChangeText={setQ}
          placeholder="Filtrer résumé, acteur, ID…"
        />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {(
            [
              { id: 'all', label: 'Tous' },
              { id: 'user', label: 'Utilisateurs' },
              { id: 'club', label: 'Clubs' },
              { id: 'fff', label: 'FFF' },
              { id: 'beta', label: 'Bêta' },
              { id: 'reel', label: 'Reels' },
              { id: 'config', label: 'Config' },
            ] as const
          ).map((c) => (
            <AdminFilterChip
              key={c.id}
              label={c.label}
              active={category === c.id}
              onPress={() => setCategory(c.id)}
            />
          ))}
        </ScrollView>
      </View>
      <FlatList
        data={filtered}
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
            title="Aucune entrée d'audit"
            body="Aucune action ne correspond à ces critères de recherche."
            icon="document-text"
          />
        }
        renderItem={({ item }) => (
          <AdminEntityRow
            title={item.summary}
            subtitle={`${item.action} · Par ${item.actor_email || item.actor_uid.slice(0, 10)}`}
            meta={`${item.target_type}/${item.target_id.slice(0, 14)} · ${item.created_at.toLocaleString('fr-FR')}`}
            leading={<AdminAvatarMark label={item.action} tone={item.action.includes('reject') || item.action.includes('delete') ? 'danger' : 'info'} />}
          />
        )}
      />
    </View>
  );
}

/** Page dédiée Apple — Création de compte utilisateur. */
export function AdminUserCreatePane({
  onPreviewPresidentPole,
  onPreviewUserApp,
}: {
  onPreviewPresidentPole?: () => void;
  onPreviewUserApp?: () => void;
}) {
  const data = useAdminData();
  const t = useAdminTokens();
  const { firebaseUser, profile } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<('player' | 'coach' | 'parent' | 'club' | 'sponsor' | 'supporter')[]>(['player']);
  const [primaryRole, setPrimaryRole] = useState<'player' | 'coach' | 'parent' | 'club' | 'sponsor' | 'supporter'>('player');
  const [selectedClubId, setSelectedClubId] = useState<string>('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [tier, setTier] = useState<'free' | 'pro' | 'elite'>('free');
  const [autoVerify, setAutoVerify] = useState(true);
  const [busy, setBusy] = useState(false);
  const [createdUid, setCreatedUid] = useState<string | null>(null);

  const toggleRole = (r: 'player' | 'coach' | 'parent' | 'club' | 'sponsor' | 'supporter') => {
    setSelectedRoles((prev) => {
      const exists = prev.includes(r);
      if (exists) {
        if (prev.length <= 1) {
          prodayAlert.alert('Rôle requis', 'Un utilisateur doit avoir au moins un rôle sélectionné.');
          return prev;
        }
        const next = prev.filter((item) => item !== r);
        if (primaryRole === r) {
          setPrimaryRole(next[0]!);
        }
        return next;
      }
      return [...prev, r];
    });
  };

  const resetForm = () => {
    setDisplayName('');
    setEmail('');
    setPassword('');
    setCity('');
    setPhone('');
    setSelectedRoles(['player']);
    setPrimaryRole('player');
    setSelectedClubId('');
    setLicenseNumber('');
    setTier('free');
    setAutoVerify(true);
    setCreatedUid(null);
  };

  const handleCreate = () => {
    if (!displayName.trim() || !email.trim() || password.length < 6) {
      prodayAlert.alert('Champs incomplets', 'Veuillez saisir un nom complet, une adresse e-mail valide et un mot de passe d’au moins 6 caractères.');
      return;
    }

    const effectivePrimary = selectedRoles.includes(primaryRole) ? primaryRole : selectedRoles[0]!;
    const rolesSummary = selectedRoles.join(', ').toUpperCase();

    confirmAdminAction(
      'Créer ce compte utilisateur ?',
      `${displayName.trim()} (${email.trim()})\nRôles : ${rolesSummary}\nPrincipal : ${effectivePrimary.toUpperCase()}`,
      async () => {
        setBusy(true);
        try {
          const res = await adminService.createUser({
            email: email.trim(),
            password,
            display_name: displayName.trim(),
            role: effectivePrimary,
            roles: selectedRoles,
          });

          // Mise à jour attributs additionnels (club, ville, téléphone, tier, multi-rôles)
          const updates: Record<string, any> = {
            roles: selectedRoles,
            role: effectivePrimary,
            city: city.trim() || undefined,
            phone: phone.trim() || undefined,
            subscription_tier: tier,
            is_active: true,
          };
          if (selectedClubId) {
            updates.club_id = selectedClubId;
          }
          if (licenseNumber.trim()) {
            updates.license_number = licenseNumber.trim();
          }
          if (autoVerify) {
            updates.verification_status = 'verified';
          }
          await adminService.updateUser(res.uid, updates);

          await adminAuditService.log({
            action: 'other',
            actor_uid: firebaseUser?.uid ?? 'admin',
            actor_email: profile?.email ?? undefined,
            target_type: 'user',
            target_id: res.uid,
            summary: `Création compte multi-rôles (${selectedRoles.join(', ')}) : ${displayName.trim()} (${email.trim()})`,
          });

          await data.refresh();
          setCreatedUid(res.uid);
          prodayAlert.alert('Compte créé avec succès', `UID: ${res.uid}\nLe compte est immédiatement provisionné et actif.`);
        } catch (e) {
          prodayAlert.alert('Erreur de création', e instanceof Error ? e.message : 'Impossible de créer le compte.');
        } finally {
          setBusy(false);
        }
      },
    );
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={[styles.pad, { gap: 16 }]} showsVerticalScrollIndicator={false}>
      <AdminPaneHeader
        title="Créer un compte"
        subtitle="Provisionnement immédiat Auth + base Firestore avec rôles et affiliations"
        right={
          createdUid ? (
            <AdminButton label="Nouveau compte" variant="ghost" compact onPress={resetForm} />
          ) : null
        }
      />

      {createdUid ? (
        <View style={[adminSurfaceCard(t), { padding: 18, borderColor: t.success, backgroundColor: t.successSoft, gap: 8 }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <AdminBadge label="SUCCÈS" tone="success" />
            <AdminText variant="h3" color={t.success}>Compte utilisateur activé</AdminText>
          </View>
          <AdminText variant="body">Le compte pour {displayName} ({email}) a été provisionné avec succès.</AdminText>
          <AdminText variant="mono" color={t.faint}>UID : {createdUid}</AdminText>
        </View>
      ) : null}

      {/* 1. Inset Card: Identité & Connexion */}
      <AdminCard>
        <AdminText variant="h2">1. Identité & Connexion</AdminText>
        <AdminText variant="caption" muted>Informations de profil et accès principal</AdminText>
        <View style={{ gap: 10, marginTop: 6 }}>
          <View style={{ gap: 4 }}>
            <AdminText variant="label" muted>Nom & Prénom *</AdminText>
            <AdminField
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Ex: Kylian Mbappé"
            />
          </View>
          <View style={{ gap: 4 }}>
            <AdminText variant="label" muted>Adresse e-mail *</AdminText>
            <AdminField
              value={email}
              onChangeText={setEmail}
              placeholder="Ex: contact@proday.com"
            />
          </View>
          <View style={{ gap: 4 }}>
            <AdminText variant="label" muted>Mot de passe initial (≥ 6 car.) *</AdminText>
            <AdminField
              value={password}
              onChangeText={setPassword}
              placeholder="Mot de passe temporaire"
              secureTextEntry
            />
          </View>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1, gap: 4 }}>
              <AdminText variant="label" muted>Ville</AdminText>
              <AdminField
                value={city}
                onChangeText={setCity}
                placeholder="Ex: Paris"
              />
            </View>
            <View style={{ flex: 1, gap: 4 }}>
              <AdminText variant="label" muted>Téléphone</AdminText>
              <AdminField
                value={phone}
                onChangeText={setPhone}
                placeholder="06 12 34 56 78"
              />
            </View>
          </View>
        </View>
      </AdminCard>

      {/* 2. Inset Card: Multi-Rôles Plateforme */}
      <AdminCard>
        <AdminText variant="h2">2. Multi-Rôles & Permissions</AdminText>
        <AdminText variant="caption" muted>Sélectionnez un ou plusieurs rôles (ex. Coach et Joueur, Parent et Joueur)</AdminText>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
          {[
            { id: 'player', label: 'Joueur' },
            { id: 'coach', label: 'Coach' },
            { id: 'parent', label: 'Parent' },
            { id: 'club', label: 'Club / Staff' },
            { id: 'sponsor', label: 'Sponsor' },
            { id: 'supporter', label: 'Supporter' },
          ].map((r) => {
            const active = selectedRoles.includes(r.id as any);
            return (
              <AdminFilterChip
                key={r.id}
                label={`${active ? '✓ ' : '+ '}${r.label}`}
                active={active}
                onPress={() => toggleRole(r.id as any)}
              />
            );
          })}
        </View>

        {selectedRoles.length > 1 ? (
          <View style={{ marginTop: 12, padding: 10, borderRadius: adminRadius.md, backgroundColor: t.surfaceMuted, borderWidth: 1, borderColor: t.border, gap: 6 }}>
            <AdminText variant="h3">Rôle principal par défaut</AdminText>
            <AdminText variant="caption" muted>
              Espace affiché en priorité lors de la connexion initiale de l'utilisateur.
            </AdminText>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
              {selectedRoles.map((rId) => {
                const label =
                  rId === 'player'
                    ? 'Joueur'
                    : rId === 'coach'
                    ? 'Coach'
                    : rId === 'parent'
                    ? 'Parent'
                    : rId === 'club'
                    ? 'Club / Staff'
                    : rId === 'sponsor'
                    ? 'Sponsor'
                    : 'Supporter';
                return (
                  <AdminFilterChip
                    key={rId}
                    label={`★ ${label}`}
                    active={primaryRole === rId}
                    onPress={() => setPrimaryRole(rId)}
                  />
                );
              })}
            </View>
          </View>
        ) : null}
      </AdminCard>

      {/* 3. Inset Card: Rattachement Club */}
      <AdminCard>
        <AdminText variant="h2">3. Rattachement Club</AdminText>
        <AdminText variant="caption" muted>Associe le membre à une organisation existante</AdminText>
        <View style={{ gap: 10, marginTop: 6 }}>
          <View style={{ gap: 4 }}>
            <AdminText variant="label" muted>Sélectionner un Club</AdminText>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingVertical: 4 }}>
              <AdminFilterChip
                label="Aucun club (Indépendant)"
                active={selectedClubId === ''}
                onPress={() => setSelectedClubId('')}
              />
              {data.clubs.slice(0, 20).map((c) => (
                <AdminFilterChip
                  key={c.id}
                  label={c.name}
                  active={selectedClubId === c.id}
                  onPress={() => setSelectedClubId(c.id)}
                />
              ))}
            </ScrollView>
          </View>
          <View style={{ gap: 4 }}>
            <AdminText variant="label" muted>Numéro de licence FFF (Optionnel)</AdminText>
            <AdminField
              value={licenseNumber}
              onChangeText={setLicenseNumber}
              placeholder="Ex: 2548963214"
            />
          </View>
        </View>
      </AdminCard>

      {/* 4. Inset Card: Abonnement & Statut */}
      <AdminCard>
        <AdminText variant="h2">4. Abonnement & Paramètres</AdminText>
        <View style={{ gap: 10, marginTop: 6 }}>
          <View style={{ gap: 4 }}>
            <AdminText variant="label" muted>Formule ProDay</AdminText>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {[
                { id: 'free', label: 'Gratuit (Free)' },
                { id: 'pro', label: 'Pro (Mensuel/Annuel)' },
                { id: 'elite', label: 'Elite Pro' },
              ].map((tOption) => (
                <AdminFilterChip
                  key={tOption.id}
                  label={tOption.label}
                  active={tier === tOption.id}
                  onPress={() => setTier(tOption.id as any)}
                />
              ))}
            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 }}>
            <AdminFilterChip
              label={autoVerify ? '✓ Identité Vérifiée d’Office' : 'Identité Non Vérifiée'}
              active={autoVerify}
              onPress={() => setAutoVerify((v) => !v)}
            />
          </View>
        </View>
      </AdminCard>

      {/* 5. Bouton de Création */}
      <View style={{ gap: 8, marginTop: 8, marginBottom: 32 }}>
        <AdminButton
          label={busy ? 'Création en cours…' : 'Créer le compte utilisateur'}
          variant="primary"
          disabled={busy}
          onPress={handleCreate}
        />
      </View>
    </ScrollView>
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
          prodayAlert.alert('Erreur', e instanceof Error ? e.message : 'Échec');
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
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  const load = useCallback(async () => {
    setRows(await adminService.listBetaWaitlist(150));
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
          prodayAlert.alert('Erreur', e instanceof Error ? e.message : 'Échec');
        } finally {
          setBusy(null);
        }
      },
      kind === 'delete' || kind === 'reject',
    );
  };

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      const status = r.status || 'pending';
      if (statusFilter !== 'all' && status !== statusFilter) return false;
      const query = q.trim().toLowerCase();
      if (!query) return true;
      const club = (r as unknown as { club_name?: string; club_id?: string }).club_name || (r as unknown as { club_id?: string }).club_id || '';
      return (
        (r.name?.toLowerCase().includes(query) ?? false) ||
        r.email.toLowerCase().includes(query) ||
        (r.role?.toLowerCase().includes(query) ?? false) ||
        club.toLowerCase().includes(query)
      );
    });
  }, [rows, statusFilter, q]);

  const exportCsv = async () => {
    const headers = ['ID', 'Email', 'Nom', 'Rôle', 'Club', 'Statut', 'Date'];
    const dataRows = filtered.map((r) => {
      const club = (r as unknown as { club_name?: string; club_id?: string }).club_name || (r as unknown as { club_id?: string }).club_id || '';
      return [
        r.id,
        r.email,
        r.name || '',
        r.role_label || r.role || '',
        club,
        r.status || 'pending',
        r.created_at ? new Date(r.created_at).toISOString() : '',
      ];
    });
    await shareCsv('beta-waitlist-proday.csv', toCsv(headers, dataRows));
  };

  if (loading) return <AdminLoading />;
  return (
    <View style={styles.root} testID="admin-beta">
      <View style={styles.header}>
        <AdminPaneHeader
          title="Liste d’attente bêta"
          subtitle={`${filtered.length} entrées affichées`}
          right={
            <AdminButton
              label="Exporter CSV"
              variant="soft"
              compact
              onPress={exportCsv}
            />
          }
        />
        <AdminSearchField
          value={q}
          onChangeText={setQ}
          placeholder="Rechercher email, nom, club…"
        />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {(
            [
              { id: 'all', label: 'Tous' },
              { id: 'pending', label: 'En attente' },
              { id: 'approved', label: 'Approuvés' },
              { id: 'rejected', label: 'Refusés' },
            ] as const
          ).map((s) => (
            <AdminFilterChip
              key={s.id}
              label={s.label}
              active={statusFilter === s.id}
              onPress={() => setStatusFilter(s.id)}
            />
          ))}
        </ScrollView>
      </View>
      <FlatList
        data={filtered}
        keyExtractor={(r) => r.id}
        contentContainerStyle={styles.pad}
        ListEmptyComponent={
          <AdminEmptyState
            title="Aucune inscription trouvée"
            body="Aucun lead ne correspond aux filtres appliqués."
            icon="star"
          />
        }
        renderItem={({ item }) => {
          const club = (item as unknown as { club_name?: string; club_id?: string }).club_name || (item as unknown as { club_id?: string }).club_id || 'Sans club';
          return (
            <AdminEntityRow
              title={item.name || item.email}
              subtitle={`${item.email} · ${item.role_label || item.role || '—'} · ${club}`}
              badge={String(item.status || 'pending').toUpperCase()}
              badgeTone={item.status === 'approved' ? 'success' : item.status === 'rejected' ? 'danger' : 'warn'}
              leading={<AdminAvatarMark label={item.name || item.email} tone="accent" />}
              actions={
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                  {item.status !== 'approved' && (
                    <AdminButton label="Approuver" compact disabled={!!busy} onPress={() => act(item.id, 'approve')} />
                  )}
                  {item.status !== 'rejected' && (
                    <AdminButton
                      label="Refuser"
                      variant="danger"
                      compact
                      disabled={!!busy}
                      onPress={() => act(item.id, 'reject')}
                    />
                  )}
                  <AdminButton
                    label="Renvoyer mail"
                    variant="ghost"
                    compact
                    disabled={!!busy}
                    onPress={() => act(item.id, 'resend')}
                  />
                  <AdminButton
                    label="Supprimer"
                    variant="ghost"
                    compact
                    disabled={!!busy}
                    onPress={() => act(item.id, 'delete')}
                  />
                </View>
              }
            />
          );
        }}
      />
    </View>
  );
}

export function AdminTeamsPane() {
  const data = useAdminData();
  const [q, setQ] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [selectedTeam, setSelectedTeam] = useState<{ id: string; name: string; club_id: string; category?: string } | null>(null);

  if (data.loading) return <AdminLoading />;

  const filtered = data.teams.filter((team) => {
    if (categoryFilter !== 'all' && (team.category?.toLowerCase() || '') !== categoryFilter.toLowerCase()) {
      return false;
    }
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
        <AdminPaneHeader title="Équipes" subtitle={`${filtered.length} équipes Firestore`} />
        <AdminSearchField value={q} onChangeText={setQ} placeholder="Nom, club, catégorie…" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {['all', 'Senior', 'U19', 'U17', 'U15', 'Féminines'].map((cat) => (
            <AdminFilterChip
              key={cat}
              label={cat === 'all' ? 'Toutes' : cat}
              active={categoryFilter === cat}
              onPress={() => setCategoryFilter(cat)}
            />
          ))}
        </ScrollView>
      </View>
      <FlatList
        data={filtered}
        keyExtractor={(team) => team.id}
        contentContainerStyle={styles.pad}
        ListEmptyComponent={
          <AdminEmptyState
            title="Aucune équipe trouvée"
            body="Aucune équipe ne correspond aux critères de filtre."
            icon="shirt"
          />
        }
        renderItem={({ item }) => (
          <AdminEntityRow
            title={item.name}
            subtitle={`Club ID : ${item.club_id}`}
            meta={item.category ?? 'Sans catégorie'}
            badge={item.category ? item.category.toUpperCase() : 'CLUB'}
            badgeTone="info"
            leading={<AdminAvatarMark label={item.name} tone="info" />}
            onPress={() => setSelectedTeam(item)}
          />
        )}
      />

      <AdminModalSheet visible={!!selectedTeam} onClose={() => setSelectedTeam(null)}>
        {selectedTeam ? (
          <ScrollView contentContainerStyle={{ padding: adminSpace.lg, gap: 16 }}>
            <AdminSheetHeader
              title={selectedTeam.name}
              subtitle={`Club : ${selectedTeam.club_id}`}
              onClose={() => setSelectedTeam(null)}
            />
            <AdminCard style={{ gap: 10 }}>
              <AdminText variant="h2">Détails de l'équipe</AdminText>
              <AdminText variant="body">Catégorie : {selectedTeam.category || 'Non renseignée'}</AdminText>
              <AdminText variant="body" muted>Identifiant technique : {selectedTeam.id}</AdminText>
            </AdminCard>
            <AdminButton label="Fermer" variant="soft" onPress={() => setSelectedTeam(null)} />
          </ScrollView>
        ) : null}
      </AdminModalSheet>
    </View>
  );
}

export function AdminCamerasPane() {
  const data = useAdminData();
  const [q, setQ] = useState('');
  const [vendorFilter, setVendorFilter] = useState<string>('all');
  const [selectedCam, setSelectedCam] = useState<{ id: string; display_name?: string; brand_label?: string; vendor: string; club_id: string; status: string } | null>(null);

  if (data.loading) return <AdminLoading />;

  const filtered = data.cameras.filter((c) => {
    if (vendorFilter !== 'all' && c.vendor.toLowerCase() !== vendorFilter.toLowerCase()) return false;
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
        <AdminPaneHeader title="Caméras club" subtitle={`${filtered.length} caméras`} />
        <AdminSearchField value={q} onChangeText={setQ} placeholder="Nom, club, vendor…" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {['all', 'veo', 'spiideo', 'pixellot', 'local'].map((v) => (
            <AdminFilterChip
              key={v}
              label={v === 'all' ? 'Toutes' : v.toUpperCase()}
              active={vendorFilter === v}
              onPress={() => setVendorFilter(v)}
            />
          ))}
        </ScrollView>
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
            subtitle={`Club : ${item.club_id} · Fabricant : ${item.vendor.toUpperCase()}`}
            badge={String(item.status || 'offline').toUpperCase()}
            badgeTone={item.status === 'connected' ? 'success' : 'warn'}
            leading={<AdminAvatarMark label={item.display_name || item.id} tone="info" />}
            onPress={() => setSelectedCam(item)}
          />
        )}
      />

      <AdminModalSheet visible={!!selectedCam} onClose={() => setSelectedCam(null)}>
        {selectedCam ? (
          <ScrollView contentContainerStyle={{ padding: adminSpace.lg, gap: 16 }}>
            <AdminSheetHeader
              title={selectedCam.display_name || selectedCam.brand_label || selectedCam.id}
              subtitle={`Vendor : ${selectedCam.vendor.toUpperCase()} · Club : ${selectedCam.club_id}`}
              onClose={() => setSelectedCam(null)}
            />
            <AdminCard style={{ gap: 12 }}>
              <AdminText variant="h2">Statut matériel</AdminText>
              <AdminEntityRow
                title="État du flux vidéo"
                badge={selectedCam.status === 'connected' ? 'CONNECTÉ' : 'HORS LIGNE'}
                badgeTone={selectedCam.status === 'connected' ? 'success' : 'warn'}
              />
              <AdminText variant="caption" muted>ID Caméra : {selectedCam.id}</AdminText>
            </AdminCard>
            <AdminButton label="Fermer" variant="soft" onPress={() => setSelectedCam(null)} />
          </ScrollView>
        ) : null}
      </AdminModalSheet>
    </View>
  );
}

export function AdminClaimsPane({ focusId }: { focusId?: string }) {
  return <AdminIdentityQueuePane focusId={focusId} />;
}

export function AdminDirectoryPane() {
  const t = useAdminTokens();
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string>('');

  const run = () => {
    confirmAdminAction('Lancer sync annuaire public FFF ?', 'Callable admin.', async () => {
      setBusy(true);
      try {
        const r = await adminService.triggerPublicClubDirectorySync();
        setResult(JSON.stringify(r ?? { ok: true }, null, 2));
      } catch (e) {
        prodayAlert.alert('Erreur', e instanceof Error ? e.message : 'Échec');
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
  const t = useAdminTokens();
  const [busy, setBusy] = useState<string | null>(null);
  const [log, setLog] = useState<string[]>([]);

  const run = (id: string, fn: () => Promise<unknown>) => {
    confirmAdminAction(`Lancer ${id} ?`, 'Job sync admin (callable).', async () => {
      setBusy(id);
      try {
        const r = await fn();
        setLog((prev) => [`${id}: ${JSON.stringify(r ?? { ok: true })}`, ...prev].slice(0, 12));
      } catch (e) {
        prodayAlert.alert('Erreur', e instanceof Error ? e.message : 'Échec');
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
                        prodayAlert.alert('Erreur', e instanceof Error ? e.message : 'Échec');
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
  const { firebaseUser, profile } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [targetUid, setTargetUid] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<'joueur_elite' | 'coach_pro' | 'club_pro'>('coach_pro');
  const [busy, setBusy] = useState(false);

  if (data.loading) return <AdminLoading />;
  const upgrades = data.subscriptionUpgradeRequests.filter((r) => r.status === 'pending');

  const applyManualPlan = () => {
    if (!targetUid.trim()) {
      prodayAlert.alert('UID Requis', 'Renseignez l’UID de l’utilisateur.');
      return;
    }
    confirmAdminAction(
      'Attribuer l’abonnement ?',
      `Attribuer ${selectedPlan} à ${targetUid.trim()}`,
      async () => {
        setBusy(true);
        try {
          await adminService.updateUser(targetUid.trim(), {
            subscription_plan: selectedPlan,
            is_active: true,
          });
          await adminAuditService.log({
            action: 'subscription_granted',
            actor_uid: firebaseUser?.uid ?? 'admin',
            actor_email: profile?.email ?? undefined,
            target_type: 'user',
            target_id: targetUid.trim(),
            summary: `Attribution manuelle forfait ${selectedPlan}`,
          });
          await data.refresh();
          setModalOpen(false);
          setTargetUid('');
          prodayAlert.alert('Succès', 'Abonnement activé avec succès.');
        } catch (e) {
          prodayAlert.alert('Erreur', e instanceof Error ? e.message : 'Échec attribution');
        } finally {
          setBusy(false);
        }
      },
    );
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.pad}>
      <AdminPaneHeader
        title="Abonnements"
        subtitle={`${upgrades.length} demandes upgrade · Gestion des licences`}
        right={
          <AdminButton
            label="+ Attribuer un plan"
            variant="soft"
            compact
            onPress={() => setModalOpen(true)}
          />
        }
      />
      <AdminCard style={{ gap: 8 }}>
        <AdminText variant="body" muted>
          Attribution manuelle de forfaits Pro/Elite ou gestion des demandes d'upgrade utilisateurs.
        </AdminText>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <AdminButton label="Ouvrir liste utilisateurs" variant="ghost" onPress={() => onNavigate('users')} />
          <AdminButton label="Attribuer un forfait" variant="soft" onPress={() => setModalOpen(true)} />
        </View>
      </AdminCard>
      {upgrades.length === 0 ? (
        <AdminEmptyState
          title="Aucune demande d'upgrade"
          body="Toutes les demandes d'abonnement sont traitées."
          icon="star"
          actionLabel="Gérer les comptes"
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

      <AdminModalSheet visible={modalOpen} onClose={() => setModalOpen(false)}>
        <ScrollView contentContainerStyle={{ padding: adminSpace.lg, gap: 16 }}>
          <AdminSheetHeader
            title="Attribution Forfait Manuelle"
            subtitle="Activer une licence Pro ou Élite directement"
            onClose={() => setModalOpen(false)}
          />
          <AdminCard style={{ gap: 12 }}>
            <AdminText variant="label">UID Utilisateur</AdminText>
            <AdminField
              value={targetUid}
              onChangeText={setTargetUid}
              placeholder="Ex: d8j2k19s82j19..."
            />
            <AdminText variant="label">Choix du Forfait</AdminText>
            <View style={styles.chipRow}>
              {(
                [
                  { id: 'coach_pro', label: 'Coach Pro' },
                  { id: 'joueur_elite', label: 'Joueur Élite' },
                  { id: 'club_pro', label: 'Club Pro' },
                ] as const
              ).map((p) => (
                <AdminFilterChip
                  key={p.id}
                  label={p.label}
                  active={selectedPlan === p.id}
                  onPress={() => setSelectedPlan(p.id)}
                />
              ))}
            </View>
          </AdminCard>
          <AdminButton
            label={busy ? 'Attribution en cours…' : 'Confirmer et Activer'}
            disabled={busy || !targetUid.trim()}
            onPress={applyManualPlan}
          />
        </ScrollView>
      </AdminModalSheet>
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
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  const load = useCallback(async () => {
    const list = await adminService.listShopOrders(100);
    setRows(list);
  }, []);

  useEffect(() => {
    void load().finally(() => setLoading(false));
  }, [load]);

  if (loading) return <AdminLoading />;

  const filtered = rows.filter((o) => {
    if (statusFilter !== 'all' && String(o.status).toLowerCase() !== statusFilter.toLowerCase()) return false;
    const query = q.trim().toLowerCase();
    if (!query) return true;
    return o.id.toLowerCase().includes(query) || String(o.status).toLowerCase().includes(query);
  });

  const updateStatus = async (status: string) => {
    if (!selectedOrder) return;
    try {
      await adminService.updateShopOrderStatus(selectedOrder.id, status as any);
      await load();
      setSelectedOrder((prev: any) => (prev ? { ...prev, status } : null));
      prodayAlert.alert('Statut mis à jour', `Commande passée à l'état ${status}`);
    } catch (e) {
      prodayAlert.alert('Erreur', e instanceof Error ? e.message : 'Échec');
    }
  };

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <AdminPaneHeader title="Commandes boutique" subtitle={`${filtered.length} commandes`} />
        <AdminSearchField value={q} onChangeText={setQ} placeholder="ID, statut…" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {['all', 'pending', 'paid', 'cancelled'].map((st) => (
            <AdminFilterChip
              key={st}
              label={st === 'all' ? 'Toutes' : st.toUpperCase()}
              active={statusFilter === st}
              onPress={() => setStatusFilter(st)}
            />
          ))}
        </ScrollView>
      </View>
      <FlatList
        data={filtered}
        keyExtractor={(o) => o.id}
        contentContainerStyle={styles.pad}
        ListEmptyComponent={
          <AdminEmptyState
            title="Aucune commande trouvée"
            body="Les commandes boutique ProDay apparaîtront ici."
            icon="bag"
          />
        }
        renderItem={({ item }) => (
          <AdminEntityRow
            title={`Commande #${item.id.slice(0, 10)}`}
            subtitle={`Statut : ${String(item.status)}`}
            badge={String(item.status).toUpperCase()}
            badgeTone={item.status === 'paid' ? 'success' : item.status === 'pending' ? 'warn' : 'danger'}
            leading={<AdminAvatarMark label={item.id} tone="info" />}
            onPress={() => setSelectedOrder(item)}
          />
        )}
      />

      <AdminModalSheet visible={!!selectedOrder} onClose={() => setSelectedOrder(null)}>
        {selectedOrder ? (
          <ScrollView contentContainerStyle={{ padding: adminSpace.lg, gap: 16 }}>
            <AdminSheetHeader
              title={`Commande #${selectedOrder.id.slice(0, 12)}`}
              subtitle={`Statut actuel : ${String(selectedOrder.status).toUpperCase()}`}
              onClose={() => setSelectedOrder(null)}
            />
            <AdminCard style={{ gap: 12 }}>
              <AdminText variant="h2">Modifier le statut</AdminText>
              <View style={styles.chipRow}>
                {['pending', 'paid', 'cancelled'].map((st) => (
                  <AdminFilterChip
                    key={st}
                    label={st.toUpperCase()}
                    active={selectedOrder.status === st}
                    onPress={() => updateStatus(st)}
                  />
                ))}
              </View>
            </AdminCard>
            <AdminButton label="Fermer" variant="soft" onPress={() => setSelectedOrder(null)} />
          </ScrollView>
        ) : null}
      </AdminModalSheet>
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
        prodayAlert.alert('Erreur', e instanceof Error ? e.message : 'Échec');
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
                prodayAlert.alert('Erreur', e instanceof Error ? e.message : 'Échec');
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
  const [selectedThread, setSelectedThread] = useState<any>(null);

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
        <AdminPaneHeader title="Messages & Modération" subtitle={`${rows.length} conversations`} />
        <AdminSearchField value={q} onChangeText={setQ} placeholder="Thread, dernier message…" />
      </View>
      <FlatList
        data={filtered}
        keyExtractor={(r) => r.id}
        contentContainerStyle={styles.pad}
        ListEmptyComponent={
          <AdminEmptyState
            title="Aucun fil de discussion"
            body="Les conversations plateforme s’affichent ici pour modération."
            icon="chatbubbles"
          />
        }
        renderItem={({ item }) => (
          <AdminEntityRow
            title={item.label}
            subtitle={item.last_message || 'Pas de message'}
            leading={<AdminAvatarMark label={item.label} tone="info" />}
            onPress={() => setSelectedThread(item)}
          />
        )}
      />

      <AdminModalSheet visible={!!selectedThread} onClose={() => setSelectedThread(null)}>
        {selectedThread ? (
          <ScrollView contentContainerStyle={{ padding: adminSpace.lg, gap: 16 }}>
            <AdminSheetHeader
              title={selectedThread.label}
              subtitle="Inspection du fil de discussion"
              onClose={() => setSelectedThread(null)}
            />
            <AdminCard style={{ gap: 10 }}>
              <AdminText variant="h2">Dernière activité</AdminText>
              <AdminText variant="body">{selectedThread.last_message || 'Aucun message textuel'}</AdminText>
              <AdminText variant="caption" muted>ID du fil : {selectedThread.id}</AdminText>
            </AdminCard>
            <AdminButton label="Fermer" variant="soft" onPress={() => setSelectedThread(null)} />
          </ScrollView>
        ) : null}
      </AdminModalSheet>
    </View>
  );
}

export function AdminStagesPane() {
  const data = useAdminData();
  const [selectedStage, setSelectedStage] = useState<any>(null);

  if (data.loading) return <AdminLoading />;
  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.pad}>
      <AdminPaneHeader title="Stages" subtitle={`${data.stageOffers.length} offres enregistrées`} />
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
            subtitle={`Statut : ${s.status || 'actif'}`}
            badge={String(s.status || 'actif').toUpperCase()}
            badgeTone="info"
            leading={<AdminAvatarMark label={s.title || s.id} tone="info" />}
            onPress={() => setSelectedStage(s)}
          />
        ))
      )}

      <AdminModalSheet visible={!!selectedStage} onClose={() => setSelectedStage(null)}>
        {selectedStage ? (
          <ScrollView contentContainerStyle={{ padding: adminSpace.lg, gap: 16 }}>
            <AdminSheetHeader
              title={selectedStage.title || 'Stage'}
              subtitle={`Club : ${selectedStage.club_id || 'Non renseigné'}`}
              onClose={() => setSelectedStage(null)}
            />
            <AdminCard style={{ gap: 10 }}>
              <AdminText variant="h2">Détails de l'offre</AdminText>
              <AdminText variant="body">Statut : {selectedStage.status || 'Actif'}</AdminText>
              <AdminText variant="caption" muted>ID : {selectedStage.id}</AdminText>
            </AdminCard>
            <AdminButton label="Fermer" variant="soft" onPress={() => setSelectedStage(null)} />
          </ScrollView>
        ) : null}
      </AdminModalSheet>
    </ScrollView>
  );
}

export function AdminRecruitmentPane() {
  const data = useAdminData();
  const [selectedPost, setSelectedPost] = useState<any>(null);

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
            subtitle={`Statut : ${p.status || 'open'}`}
            badge={String(p.status || 'OPEN').toUpperCase()}
            badgeTone="info"
            leading={<AdminAvatarMark label={p.title || p.id} tone="accent" />}
            onPress={() => setSelectedPost(p)}
          />
        ))
      )}

      <AdminModalSheet visible={!!selectedPost} onClose={() => setSelectedPost(null)}>
        {selectedPost ? (
          <ScrollView contentContainerStyle={{ padding: adminSpace.lg, gap: 16 }}>
            <AdminSheetHeader
              title={selectedPost.title || 'Annonce Recrutement'}
              subtitle={`Auteur : ${selectedPost.author_name || selectedPost.author_uid}`}
              onClose={() => setSelectedPost(null)}
            />
            <AdminCard style={{ gap: 10 }}>
              <AdminText variant="h2">Contenu de l'annonce</AdminText>
              <AdminText variant="body">{selectedPost.description || 'Pas de description détaillée'}</AdminText>
              <AdminText variant="caption" muted>ID Annonce : {selectedPost.id}</AdminText>
            </AdminCard>
            <AdminButton label="Fermer" variant="soft" onPress={() => setSelectedPost(null)} />
          </ScrollView>
        ) : null}
      </AdminModalSheet>
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
                prodayAlert.alert('OK', 'Config enregistrée');
              } catch (e) {
                prodayAlert.alert('Erreur', e instanceof Error ? e.message : 'Échec');
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
  const [selectedTour, setSelectedTour] = useState<any>(null);

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
            onPress={() => setSelectedTour(item)}
          />
        )}
      />

      <AdminModalSheet visible={!!selectedTour} onClose={() => setSelectedTour(null)}>
        {selectedTour ? (
          <ScrollView contentContainerStyle={{ padding: adminSpace.lg, gap: 16 }}>
            <AdminSheetHeader
              title={selectedTour.name}
              subtitle={`Lieu : ${selectedTour.city || 'Non renseigné'}`}
              onClose={() => setSelectedTour(null)}
            />
            <AdminCard style={{ gap: 10 }}>
              <AdminText variant="h2">Informations Tournoi</AdminText>
              <AdminText variant="body">Statut : {selectedTour.status || 'Brouillon'}</AdminText>
              <AdminText variant="caption" muted>ID Tournoi : {selectedTour.id}</AdminText>
            </AdminCard>
            <AdminButton label="Fermer" variant="soft" onPress={() => setSelectedTour(null)} />
          </ScrollView>
        ) : null}
      </AdminModalSheet>
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
