import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  ScrollView,
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
  AdminPaneHeader,
  AdminSheetHeader,
  AdminText,
} from '../ui/adminUi';
import { ADMIN_TOKENS } from '../theme/adminTokens';
import { adminLayout, adminRadius, adminSpace } from '../theme/adminDesignSystem';
import { AdminListRow, AdminModalSheet } from '../motion';
import { userNeedsAdminVerificationReview } from '../../../utils/adminUserVerification';
import {
  ADMIN_EDITABLE_ROLE_OPTIONS,
  adminRoleOptionFromUser,
  adminRoleOptionLabel,
  adminUserMatchesRoleFilter,
  findClubForAdminUser,
  isAdminPresidentUser,
  persistedUserRoleFromAdminOption,
  type AdminRoleOption,
} from '../../../utils/adminPresidentRole';
import { useAdminSelection } from '../utils/useAdminSelection';
import { shareCsv, toCsv } from '../utils/adminCsv';
import { canAdminUi } from '../utils/adminRbac';
import { confirmAdminAction } from '../utils/confirmAdminAction';
import { adminService } from '../../../services/admin.service';
import { useAuth } from '../../../context/AuthContext';
import { useProductLine } from '../../../context/ProductLineContext';
import { adminAuditService } from '../../../services/adminAudit.service';
import type { User, VerificationStatus } from '../../../models/User';

const ROLE_FILTERS: { id: 'all' | AdminRoleOption; label: string }[] = [
  { id: 'all', label: 'Tous' },
  { id: 'player', label: 'Joueurs' },
  { id: 'coach', label: 'Coachs' },
  { id: 'parent', label: 'Parents' },
  { id: 'club', label: 'Clubs' },
  { id: 'president', label: 'Présidents' },
  { id: 'supporter', label: 'Supporters' },
  { id: 'sponsor', label: 'Sponsors' },
];

export function AdminUsersPane({
  focusId,
  onPreviewPresidentPole,
  onPreviewUserApp,
}: {
  focusId?: string;
  onPreviewPresidentPole?: () => void;
  onPreviewUserApp?: () => void;
}) {
  const data = useAdminData();
  const { firebaseUser, profile } = useAuth();
  const t = ADMIN_TOKENS;
  const [q, setQ] = useState('');
  const [role, setRole] = useState<'all' | AdminRoleOption>('all');
  const [onlyPending, setOnlyPending] = useState(false);
  const [selected, setSelected] = useState<User | null>(null);
  const [busy, setBusy] = useState(false);
  const selection = useAdminSelection<string>();
  const canBulk = canAdminUi(profile?.email, 'bulk');
  const canExport = canAdminUi(profile?.email, 'export');
  const canImpersonate = canAdminUi(profile?.email, 'impersonate');
  const [godModeContext, setGodModeContext] = useState(
    focusId === 'impersonate' ? 'impersonate' : focusId === 'create' ? 'create' : null
  );
  useEffect(() => {
    if (focusId === 'impersonate' || focusId === 'create') setGodModeContext(focusId);
  }, [focusId]);

  useEffect(() => {
    if (!focusId) return;
    const hit = data.users.find((u) => u.uid === focusId);
    if (hit) setSelected(hit);
  }, [focusId, data.users]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return data.users
      .filter((u) => {
        if (!adminUserMatchesRoleFilter(u, data.clubs, role)) return false;
        if (onlyPending && !userNeedsAdminVerificationReview(u)) return false;
        if (!query) return true;
        return (
          u.display_name.toLowerCase().includes(query) ||
          u.email.toLowerCase().includes(query) ||
          (u.city?.toLowerCase().includes(query) ?? false) ||
          u.uid.toLowerCase().includes(query) ||
          (u.admin_tags ?? []).some((tag) => tag.toLowerCase().includes(query))
        );
      })
      .slice(0, 250);
  }, [data.users, data.clubs, q, role, onlyPending]);

  const exportCsv = () => {
    void shareCsv(
      'proday-users.csv',
      toCsv(
        ['uid', 'name', 'email', 'role', 'active', 'tier', 'city', 'tags'],
        filtered.map((u) => [
          u.uid,
          u.display_name,
          u.email,
          u.role,
          u.is_active !== false,
          u.subscription_tier ?? 'free',
          u.city ?? '',
          (u.admin_tags ?? []).join('|'),
        ]),
      ),
    );
  };

  const bulkDeactivate = (active: boolean) => {
    if (!selection.count) return;
    confirmAdminAction(
      active
        ? `Réactiver ${selection.count} comptes ?`
        : `Désactiver ${selection.count} comptes ?`,
      'Action groupée Firestore + audit.',
      async () => {
        setBusy(true);
        try {
          for (const uid of selection.ids) {
            await adminService.updateUser(uid, { is_active: active });
          }
          await adminAuditService.log({
            action: 'user_updated',
            actor_uid: firebaseUser?.uid ?? 'admin',
            actor_email: profile?.email ?? undefined,
            target_type: 'user_bulk',
            target_id: selection.ids.slice(0, 8).join(','),
            summary: `Bulk is_active=${active} n=${selection.count}`,
          });
          selection.clear();
          await data.refresh();
        } catch (e) {
          Alert.alert('Erreur', e instanceof Error ? e.message : 'Échec');
        } finally {
          setBusy(false);
        }
      },
      !active,
    );
  };

  if (data.loading) return <AdminLoading />;

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <AdminPaneHeader
          title="Comptes"
          subtitle={`${data.users.length} comptes · édition · bulk · CSV`}
          right={
            <View style={{ flexDirection: 'row', gap: 6 }}>
              <AdminButton
                label="Créer"
                variant="soft"
                onPress={() => setGodModeContext('create')}
              />
              {canImpersonate ? (
                <AdminButton
                  label="Aperçu"
                  variant="ghost"
                  onPress={() => setGodModeContext('impersonate')}
                />
              ) : null}
            </View>
          }
        />
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder="Nom, e-mail, ville, uid, tag…"
          placeholderTextColor={t.faint}
          style={[
            styles.input,
            { color: t.foreground, borderColor: t.border, backgroundColor: t.surfaceGlass },
          ]}
        />
        <View style={styles.chips}>
          {ROLE_FILTERS.map((f) => (
            <Chip
              key={f.id}
              label={f.label}
              active={role === f.id}
              onPress={() => setRole(f.id)}
            />
          ))}
          <Chip
            label="À vérifier"
            active={onlyPending}
            onPress={() => setOnlyPending((v) => !v)}
          />
        </View>
        <View style={styles.bulkBar}>
          {canBulk ? (
            <>
              <AdminButton
                label="Tout sel."
                variant="ghost"
                onPress={() => selection.selectAll(filtered.map((u) => u.uid))}
              />
              <AdminButton label="Vider" variant="ghost" onPress={selection.clear} />
              <AdminButton
                label={`Off (${selection.count})`}
                variant="danger"
                disabled={!selection.count || busy}
                onPress={() => bulkDeactivate(false)}
              />
              <AdminButton
                label={`On (${selection.count})`}
                variant="soft"
                disabled={!selection.count || busy}
                onPress={() => bulkDeactivate(true)}
              />
            </>
          ) : null}
          {canExport ? <AdminButton label="CSV" variant="ghost" onPress={exportCsv} /> : null}
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.uid}
        contentContainerStyle={{ padding: adminSpace.lg, gap: 8 }}
        ListEmptyComponent={
          <AdminEmptyState title="Aucun utilisateur" body="Ajustez les filtres." />
        }
        renderItem={({ item, index }) => {
          const needs = userNeedsAdminVerificationReview(item);
          return (
            <AdminListRow
              index={index}
              onPress={() => setSelected(item)}
              onLongPress={() => selection.toggle(item.uid)}
            >
              <AdminCard
                style={
                  selection.isSelected(item.uid)
                    ? { borderColor: ADMIN_TOKENS.accent }
                    : undefined
                }
              >
                <View style={styles.row}>
                  {canBulk ? (
                    <Pressable onPress={() => selection.toggle(item.uid)} hitSlop={8}>
                      <AdminBadge
                        label={selection.isSelected(item.uid) ? '✓' : '○'}
                        tone={selection.isSelected(item.uid) ? 'accent' : 'info'}
                      />
                    </Pressable>
                  ) : null}
                  <View style={{ flex: 1, gap: 2 }}>
                    <AdminText variant="h3">{item.display_name}</AdminText>
                    <AdminText variant="caption" color={t.muted}>
                      {adminRoleOptionLabel(adminRoleOptionFromUser(item, data.clubs))} ·{' '}
                      {item.email}
                    </AdminText>
                    <AdminText variant="caption" color={t.faint}>
                      {item.is_active === false ? 'Désactivé' : 'Actif'}
                      {item.city ? ` · ${item.city}` : ''}
                    </AdminText>
                  </View>
                  <View style={{ gap: 4, alignItems: 'flex-end' }}>
                    {needs ? <AdminBadge label="À vérifier" tone="warn" /> : null}
                    <AdminBadge
                      label={
                        item.subscription_tier && item.subscription_tier !== 'free'
                          ? 'Payant'
                          : 'Gratuit'
                      }
                      tone={
                        item.subscription_tier && item.subscription_tier !== 'free'
                          ? 'accent'
                          : 'info'
                      }
                    />
                  </View>
                </View>
              </AdminCard>
            </AdminListRow>
          );
        }}
      />

      <AdminModalSheet visible={!!selected} onClose={() => setSelected(null)} variant="full">
        {selected ? (
          <UserEditor
            user={selected}
            busy={busy}
            onClose={() => setSelected(null)}
            onRefresh={async () => {
              await data.refresh();
              const next = (await adminService.getUser(selected.uid)) ?? selected;
              setSelected(next);
            }}
            setBusy={setBusy}
            actorUid={firebaseUser?.uid ?? 'admin'}
            actorEmail={profile?.email ?? firebaseUser?.email ?? undefined}
            onPreviewPresidentPole={
              canImpersonate ? onPreviewPresidentPole : undefined
            }
          />
        ) : null}
      </AdminModalSheet>

      <AdminModalSheet
        visible={godModeContext === 'create'}
        onClose={() => setGodModeContext(null)}
      >
        <CreateEntitySheet
          busy={busy}
          setBusy={setBusy}
          actorUid={firebaseUser?.uid ?? 'admin'}
          actorEmail={profile?.email ?? firebaseUser?.email ?? undefined}
          onDone={async () => {
            setGodModeContext(null);
            await data.refresh();
          }}
        />
      </AdminModalSheet>

      <AdminModalSheet
        visible={godModeContext === 'impersonate'}
        onClose={() => setGodModeContext(null)}
      >
        <ImpersonateSheet
          users={data.users}
          canImpersonate={canImpersonate}
          actorUid={firebaseUser?.uid ?? 'admin'}
          actorEmail={profile?.email ?? firebaseUser?.email ?? undefined}
          onPreviewUserApp={onPreviewUserApp}
          onClose={() => setGodModeContext(null)}
        />
      </AdminModalSheet>
    </View>
  );
}

function CreateEntitySheet({
  busy,
  setBusy,
  actorUid,
  actorEmail,
  onDone,
}: {
  busy: boolean;
  setBusy: (v: boolean) => void;
  actorUid: string;
  actorEmail?: string;
  onDone: () => Promise<void>;
}) {
  const t = ADMIN_TOKENS;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState<'player' | 'coach' | 'parent' | 'club'>('player');
  const [clubName, setClubName] = useState('');
  const [clubCity, setClubCity] = useState('');

  const createAccount = () => {
    if (!email.trim() || password.length < 6 || !displayName.trim()) {
      Alert.alert('Champs requis', 'Email, nom et mot de passe (≥6) sont obligatoires.');
      return;
    }
    confirmAdminAction(
      'Créer le compte ?',
      `${email.trim()} · ${role}`,
      async () => {
        setBusy(true);
        try {
          const { uid } = await adminService.createUser({
            email: email.trim(),
            password,
            display_name: displayName.trim(),
            role,
          });
          await adminAuditService.log({
            action: 'other',
            actor_uid: actorUid,
            actor_email: actorEmail,
            target_type: 'user',
            target_id: uid,
            summary: `Compte créé · ${role} · ${email.trim()}`,
          });
          Alert.alert('Compte créé', `UID ${uid}`);
          await onDone();
        } catch (e) {
          Alert.alert('Erreur', e instanceof Error ? e.message : 'Échec création');
        } finally {
          setBusy(false);
        }
      },
    );
  };

  const createClub = () => {
    if (!clubName.trim()) {
      Alert.alert('Nom requis', 'Indiquez le nom du club.');
      return;
    }
    confirmAdminAction(
      'Créer le club ?',
      clubName.trim(),
      async () => {
        setBusy(true);
        try {
          const id = await adminService.createClub({
            name: clubName.trim(),
            city: clubCity.trim() || undefined,
            owner_uid: actorUid,
            actor_uid: actorUid,
            verified: false,
          });
          Alert.alert('Club créé', `ID ${id}`);
          await onDone();
        } catch (e) {
          Alert.alert('Erreur', e instanceof Error ? e.message : 'Échec création club');
        } finally {
          setBusy(false);
        }
      },
    );
  };

  return (
    <ScrollView style={{ padding: adminSpace.lg }} contentContainerStyle={{ gap: 16 }}>
      <AdminText variant="h2" style={{ color: ADMIN_TOKENS.accent }}>
        Création forcée
      </AdminText>
      <AdminText variant="body" muted>
        Auth + Firestore via callable adminCreateUser · club via Firestore admin.
      </AdminText>
      <AdminCard>
        <AdminText variant="h3">Nouveau compte</AdminText>
        <View style={{ gap: 8, marginTop: 8 }}>
          <TextInput
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="Nom affiché"
            placeholderTextColor={t.muted}
            style={{
              borderWidth: 1,
              borderColor: t.border,
              padding: 12,
              borderRadius: 8,
              color: t.foreground,
            }}
          />
          <TextInput
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="Email"
            placeholderTextColor={t.muted}
            style={{
              borderWidth: 1,
              borderColor: t.border,
              padding: 12,
              borderRadius: 8,
              color: t.foreground,
            }}
          />
          <TextInput
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="Mot de passe temporaire (≥6)"
            placeholderTextColor={t.muted}
            style={{
              borderWidth: 1,
              borderColor: t.border,
              padding: 12,
              borderRadius: 8,
              color: t.foreground,
            }}
          />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {(['player', 'coach', 'parent', 'club'] as const).map((r) => (
              <Chip key={r} label={r} active={role === r} onPress={() => setRole(r)} />
            ))}
          </View>
          <AdminButton
            label={busy ? '…' : 'Créer le compte'}
            disabled={busy}
            onPress={createAccount}
          />
        </View>
      </AdminCard>
      <AdminCard>
        <AdminText variant="h3">Nouveau club</AdminText>
        <View style={{ gap: 8, marginTop: 8 }}>
          <TextInput
            value={clubName}
            onChangeText={setClubName}
            placeholder="Nom du club"
            placeholderTextColor={t.muted}
            style={{
              borderWidth: 1,
              borderColor: t.border,
              padding: 12,
              borderRadius: 8,
              color: t.foreground,
            }}
          />
          <TextInput
            value={clubCity}
            onChangeText={setClubCity}
            placeholder="Ville"
            placeholderTextColor={t.muted}
            style={{
              borderWidth: 1,
              borderColor: t.border,
              padding: 12,
              borderRadius: 8,
              color: t.foreground,
            }}
          />
          <AdminButton
            label={busy ? '…' : 'Créer le club'}
            disabled={busy}
            onPress={createClub}
          />
        </View>
      </AdminCard>
    </ScrollView>
  );
}

function ImpersonateSheet({
  users,
  canImpersonate,
  actorUid,
  actorEmail,
  onPreviewUserApp,
  onClose,
}: {
  users: User[];
  canImpersonate: boolean;
  actorUid: string;
  actorEmail?: string;
  onPreviewUserApp?: () => void;
  onClose: () => void;
}) {
  const t = ADMIN_TOKENS;
  const [uid, setUid] = useState('');

  const startPreview = (targetUid: string, label: string) => {
    if (!canImpersonate || !onPreviewUserApp) {
      Alert.alert('Refusé', 'Aperçu app non autorisé pour ce compte admin.');
      return;
    }
    confirmAdminAction(
      'Aperçu app utilisateur ?',
      `Cible ${label} (${targetUid.slice(0, 10)}…). Session admin conservée — audit logué.`,
      async () => {
        await adminAuditService.log({
          action: 'other',
          actor_uid: actorUid,
          actor_email: actorEmail,
          target_type: 'user',
          target_id: targetUid,
          summary: `Aperçu app (impersonate UI) · ${label}`,
        });
        onClose();
        onPreviewUserApp();
      },
    );
  };

  return (
    <ScrollView style={{ padding: adminSpace.lg }} contentContainerStyle={{ gap: 16 }}>
      <AdminText variant="h2" style={{ color: ADMIN_TOKENS.accent }}>
        Aperçu app
      </AdminText>
      <AdminText variant="body" muted>
        Pas de takeover Auth (sécurité). Ouvre l’app utilisateur en mode aperçu admin, actions
        journalisées.
      </AdminText>
      <AdminCard>
        <View style={{ gap: 8 }}>
          <TextInput
            value={uid}
            onChangeText={setUid}
            placeholder="UID exact"
            placeholderTextColor={t.muted}
            style={{
              borderWidth: 1,
              borderColor: t.border,
              padding: 12,
              borderRadius: 8,
              color: t.foreground,
              fontSize: 16,
            }}
          />
          <AdminButton
            label="Ouvrir aperçu"
            variant="danger"
            disabled={!uid.trim()}
            onPress={() => startPreview(uid.trim(), uid.trim())}
          />
        </View>
      </AdminCard>
      <AdminText variant="h3">Comptes récents</AdminText>
      {users.slice(0, 5).map((u) => (
        <AdminCard
          key={u.uid}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <View style={{ flex: 1 }}>
            <AdminText variant="body">{u.display_name || 'Sans nom'}</AdminText>
            <AdminText variant="caption" muted>
              {u.uid}
            </AdminText>
          </View>
          <AdminButton
            label="Aperçu"
            variant="soft"
            onPress={() => startPreview(u.uid, u.display_name || u.email)}
          />
        </AdminCard>
      ))}
    </ScrollView>
  );
}

function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  const t = ADMIN_TOKENS;
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: active ? t.signalSoft : t.surfaceRaised,
          borderColor: active ? t.borderStrong : t.border,
        },
      ]}
    >
      <AdminText variant="caption" color={active ? t.accentHot : t.muted}>
        {label}
      </AdminText>
    </Pressable>
  );
}

function UserEditor({
  user,
  busy,
  onClose,
  onRefresh,
  setBusy,
  actorUid,
  actorEmail,
  onPreviewPresidentPole,
}: {
  user: User;
  busy: boolean;
  onClose: () => void;
  onRefresh: () => Promise<void>;
  setBusy: (v: boolean) => void;
  actorUid: string;
  actorEmail?: string;
  onPreviewPresidentPole?: () => void;
}) {
  const t = ADMIN_TOKENS;
  const data = useAdminData();
  const { setClubShellMode } = useProductLine();
  const [name, setName] = useState(user.display_name);
  const [city, setCity] = useState(user.city ?? '');
  const [note, setNote] = useState(user.admin_note ?? '');
  const [tags, setTags] = useState((user.admin_tags ?? []).join(', '));
  const [roleOption, setRoleOption] = useState<AdminRoleOption>(() =>
    adminRoleOptionFromUser(user, data.clubs),
  );

  useEffect(() => {
    setName(user.display_name);
    setCity(user.city ?? '');
    setNote(user.admin_note ?? '');
    setTags((user.admin_tags ?? []).join(', '));
    setRoleOption(adminRoleOptionFromUser(user, data.clubs));
  }, [user, data.clubs]);

  const linkedClub = useMemo(
    () => findClubForAdminUser(user, data.clubs),
    [data.clubs, user],
  );
  const isPresident = isAdminPresidentUser(user, data.clubs);

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    try {
      await fn();
      await onRefresh();
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Échec');
    } finally {
      setBusy(false);
    }
  };

  const parseTags = () =>
    tags
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

  const saveProfile = () => {
    if (roleOption === 'president' && !linkedClub) {
      Alert.alert(
        'Club requis',
        'Rattachez ce compte à un club (pôle Clubs) avant de le désigner Président (owner).',
      );
      return;
    }
    const persistedRole = persistedUserRoleFromAdminOption(roleOption);
    const summary =
      roleOption === 'president'
        ? `Profil / rôle → Président (club + owner ${linkedClub!.id})`
        : `Profil / rôle → ${persistedRole}`;
    confirmAdminAction('Enregistrer le profil ?', 'Modification Firestore + audit.', () =>
      run(async () => {
        await adminService.updateUser(user.uid, {
          display_name: name.trim() || user.display_name,
          city: city.trim(),
          admin_note: note,
          admin_tags: parseTags(),
          role: persistedRole,
          ...(roleOption === 'president'
            ? { product_line: 'pro_club', club_id: linkedClub!.id }
            : {}),
        });
        if (roleOption === 'president' && linkedClub) {
          await adminService.setClubOwner(linkedClub.id, user.uid, actorUid);
        }
        await adminAuditService.log({
          action: 'user_updated',
          actor_uid: actorUid,
          actor_email: actorEmail,
          target_type: 'user',
          target_id: user.uid,
          summary,
        });
      }),
    );
  };

  const openPresidentPole = () => {
    if (!onPreviewPresidentPole) return;
    confirmAdminAction(
      'Ouvrir le pôle Président ?',
      'Aperçu admin du shell Président (ACL owner inchangée pour les adhérents).',
      () => {
        void setClubShellMode('president');
        onPreviewPresidentPole();
      },
    );
  };

  const setActive = (active: boolean) =>
    confirmAdminAction(
      active ? 'Réactiver le compte ?' : 'Désactiver le compte ?',
      active
        ? 'Le compte pourra à nouveau utiliser ProDay.'
        : 'Le compte restera en base mais is_active=false.',
      () =>
        run(async () => {
          await adminService.updateUser(user.uid, { is_active: active });
        }),
      !active,
    );

  const setVerification = (status: VerificationStatus) =>
    confirmAdminAction(
      status === 'VERIFIED' ? 'Valider le profil ?' : 'Refuser / reset vérification ?',
      `Statut → ${status}`,
      () =>
        run(async () => {
          if (status === 'VERIFIED') {
            await adminService.validateProfile(user.uid, 'approve');
          } else if (status === 'REJECTED') {
            await adminService.validateProfile(user.uid, 'reject', 'Refus admin');
          } else {
            await adminService.updateUser(user.uid, {
              verification_status: status,
              is_verified: false,
            });
          }
        }),
      status === 'REJECTED',
    );

  const grantPro = () =>
    confirmAdminAction(
      'Offrir un abonnement Pro ?',
      '1 mois Pro (cadeau admin) — écriture users/* + journal achat.',
      () =>
        run(async () => {
          await adminService.grantProSubscription(
            user.uid,
            user.role === 'coach' ? 'coach_plus' : 'player_plus',
            1,
            'Cadeau admin Bureau Ops',
            false,
          );
          await adminAuditService.log({
            action: 'subscription_granted',
            actor_uid: actorUid,
            actor_email: actorEmail,
            target_type: 'user',
            target_id: user.uid,
            summary: 'Abonnement Pro offert (1 mois)',
          });
        }),
    );

  const revokePro = () =>
    confirmAdminAction(
      'Repasser en gratuit ?',
      'Annule l’abonnement payant sur le compte.',
      () =>
        run(async () => {
          await adminService.revokeToFreeSubscription(user.uid, 'Révocation admin', true);
          await adminAuditService.log({
            action: 'subscription_revoked',
            actor_uid: actorUid,
            actor_email: actorEmail,
            target_type: 'user',
            target_id: user.uid,
            summary: 'Passage gratuit',
          });
        }),
      true,
    );

  return (
    <View style={[styles.editorRoot, { backgroundColor: t.bg }]}>
      <AdminSheetHeader
        title={user.display_name}
        subtitle={`${user.email} · ${user.uid.slice(0, 10)}…`}
        onClose={onClose}
        closeLabel="Fermer"
      />
      <ScrollView contentContainerStyle={styles.editorBody}>
        <AdminCard>
          <AdminText variant="h2">Identité</AdminText>
          <Field label="Nom affiché" value={name} onChange={setName} />
          <Field label="Ville" value={city} onChange={setCity} />
          <Field label="Note admin" value={note} onChange={setNote} multiline />
          <Field label="Tags (virgules)" value={tags} onChange={setTags} />
          <AdminText variant="label" color={t.faint}>
            Rôle
          </AdminText>
          <AdminText variant="caption" color={t.muted}>
            Président = rôle Club + owner du club lié (ACL pôle Président).
          </AdminText>
          <View style={styles.chips}>
            {ADMIN_EDITABLE_ROLE_OPTIONS.map((r) => (
              <Chip
                key={r}
                label={adminRoleOptionLabel(r)}
                active={roleOption === r}
                onPress={() => setRoleOption(r)}
              />
            ))}
          </View>
          <AdminButton label={busy ? '…' : 'Enregistrer'} onPress={saveProfile} disabled={busy} />
        </AdminCard>

        {(roleOption === 'president' || isPresident || user.role === 'club') &&
        onPreviewPresidentPole ? (
          <AdminCard>
            <AdminText variant="h2">Pôle Président</AdminText>
            <AdminText variant="body" color={t.muted}>
              {isPresident
                ? `Owner de ${linkedClub?.name ?? 'club'} — accès réel au pôle pour cet adhérent.`
                : roleOption === 'president'
                  ? 'Enregistrez d’abord pour désigner le président (owner), puis ouvrez l’aperçu.'
                  : 'Staff Club (non owner) : pas d’accès Président tant qu’il n’est pas owner.'}
            </AdminText>
            <View style={styles.actions}>
              <AdminButton
                label="Ouvrir pôle Président"
                variant="soft"
                disabled={busy || (!isPresident && roleOption !== 'president')}
                onPress={openPresidentPole}
              />
            </View>
          </AdminCard>
        ) : null}

        <AdminCard>
          <AdminText variant="h2">Statut compte</AdminText>
          <AdminBadge
            label={user.is_active === false ? 'Désactivé' : 'Actif'}
            tone={user.is_active === false ? 'danger' : 'success'}
          />
          <View style={styles.actions}>
            <AdminButton
              label="Désactiver"
              variant="danger"
              disabled={busy || user.is_active === false}
              onPress={() => setActive(false)}
            />
            <AdminButton
              label="Réactiver"
              variant="soft"
              disabled={busy || user.is_active !== false}
              onPress={() => setActive(true)}
            />
          </View>
        </AdminCard>

        <AdminCard>
          <AdminText variant="h2">Vérification</AdminText>
          <AdminBadge label={user.verification_status ?? '—'} tone="info" />
          <View style={styles.actions}>
            <AdminButton label="Valider" disabled={busy} onPress={() => setVerification('VERIFIED')} />
            <AdminButton
              label="Refuser"
              variant="danger"
              disabled={busy}
              onPress={() => setVerification('REJECTED')}
            />
          </View>
        </AdminCard>

        <AdminCard>
          <AdminText variant="h2">Abonnement</AdminText>
          <AdminText variant="body" color={t.muted}>
            {user.subscription_tier ?? 'free'} · {user.subscription_status ?? '—'} ·{' '}
            {user.subscription_plan_id ?? 'sans formule'}
          </AdminText>
          <View style={styles.actions}>
            <AdminButton label="Offrir Pro 1 mois" disabled={busy} onPress={grantPro} />
            <AdminButton
              label="Passer gratuit"
              variant="ghost"
              disabled={busy}
              onPress={revokePro}
            />
          </View>
        </AdminCard>

        <AdminCard>
          <AdminText variant="h2">Zone danger</AdminText>
          <AdminButton
            label="Supprimer le compte"
            variant="danger"
            disabled={busy}
            onPress={() =>
              confirmAdminAction(
                'Supprimer définitivement ?',
                'Auth + Firestore (callable adminDeleteUser). Irréversible.',
                () =>
                  run(async () => {
                    await adminService.deleteUserFull(user.uid);
                    await adminAuditService.log({
                      action: 'other',
                      actor_uid: actorUid,
                      actor_email: actorEmail,
                      target_type: 'user',
                      target_id: user.uid,
                      summary: 'Compte utilisateur supprimé',
                    });
                    onClose();
                  }),
                true,
              )
            }
          />
        </AdminCard>
      </ScrollView>
    </View>
  );
}

function Field({
  label,
  value,
  onChange,
  multiline,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
}) {
  const t = ADMIN_TOKENS;
  return (
    <View style={{ gap: 4 }}>
      <AdminText variant="label" color={t.faint}>
        {label}
      </AdminText>
      <TextInput
        value={value}
        onChangeText={onChange}
        multiline={multiline}
        placeholderTextColor={t.faint}
        style={[
          styles.input,
          {
            color: t.foreground,
            borderColor: t.border,
            backgroundColor: t.surfaceRaised,
            minHeight: multiline ? 72 : undefined,
          },
        ]}
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
  bulkBar: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  row: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  editorRoot: { flex: 1 },
  editorBody: { padding: adminSpace.lg, gap: adminSpace.md, paddingBottom: 48 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
});
