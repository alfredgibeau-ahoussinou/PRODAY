import React, { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { prodayAlert } from '../../../utils/prodayAlert';
import { useAdminData } from '../data/AdminDataContext';
import {
  AdminAvatarMark,
  AdminBadge,
  AdminButton,
  AdminCard,
  AdminEmptyState,
  AdminEntityRow,
  AdminField,
  AdminFilterChip,
  AdminLoading,
  AdminPaneHeader,
  AdminSearchField,
  AdminSheetHeader,
  AdminText,
} from '../ui/adminUi';
import { useAdminTokens, ADMIN_TOKENS } from '../theme/adminTokens';
import { adminSpace } from '../theme/adminDesignSystem';
import { AdminListRow, AdminModalSheet } from '../motion';
import { userNeedsAdminVerificationReview } from '../../../utils/adminUserVerification';
import {
  adminRoleOptionFromUser,
  adminRoleOptionsFromUser,
  adminRoleOptionLabel,
  adminUserMatchesRoleFilter,
  type AdminRoleOption,
} from '../../../utils/adminPresidentRole';
import { useAdminSelection } from '../utils/useAdminSelection';
import { shareCsv, toCsv } from '../utils/adminCsv';
import { canAdminUi } from '../utils/adminRbac';
import { confirmAdminAction } from '../utils/confirmAdminAction';
import { adminService } from '../../../services/admin.service';
import { useAuth } from '../../../context/AuthContext';
import { adminAuditService } from '../../../services/adminAudit.service';
import type { User } from '../../../models/User';
import { AdminUserDetail } from './AdminUserDetail';

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
  const t = useAdminTokens();
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
          prodayAlert.alert('Erreur', e instanceof Error ? e.message : 'Échec');
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
          title="Utilisateurs"
          subtitle={`${data.users.length} comptes · détail multi-pages · bulk · CSV`}
          right={
            <View style={{ flexDirection: 'row', gap: 6 }}>
              <AdminButton
                label="+ Créer un compte"
                variant="primary"
                compact
                onPress={() => setGodModeContext('create')}
              />
              {canImpersonate ? (
                <AdminButton
                  label="Aperçu"
                  variant="ghost"
                  compact
                  onPress={() => setGodModeContext('impersonate')}
                />
              ) : null}
            </View>
          }
        />
        <AdminSearchField
          value={q}
          onChangeText={setQ}
          placeholder="Nom, e-mail, ville, uid, tag…"
        />
        <View style={styles.chips}>
          {ROLE_FILTERS.map((f) => (
            <AdminFilterChip
              key={f.id}
              label={f.label}
              active={role === f.id}
              onPress={() => setRole(f.id)}
            />
          ))}
          <AdminFilterChip
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
          <AdminEmptyState
            title="Aucun utilisateur"
            body="Ajustez la recherche ou les filtres rôle / vérification."
            icon="person"
            actionLabel="Créer un compte"
            onAction={() => setGodModeContext('create')}
          />
        }
        renderItem={({ item, index }) => {
          const needs = userNeedsAdminVerificationReview(item);
          const paid = !!(item.subscription_tier && item.subscription_tier !== 'free');
          const userRoles = adminRoleOptionsFromUser(item, data.clubs);
          const rolesLabel = userRoles.map(adminRoleOptionLabel).join(' + ');
          return (
            <AdminListRow
              index={index}
              onPress={() => setSelected(item)}
              onLongPress={() => selection.toggle(item.uid)}
            >
              <AdminEntityRow
                title={item.display_name}
                subtitle={`${rolesLabel} · ${item.email}`}
                meta={`${item.is_active === false ? 'Désactivé' : 'Actif'}${userRoles.length > 1 ? ` · Multi-rôles (${userRoles.length})` : ''}${item.city ? ` · ${item.city}` : ''}`}
                badge={needs ? 'À vérifier' : paid ? 'Payant' : 'Gratuit'}
                badgeTone={needs ? 'warn' : paid ? 'accent' : 'info'}
                selected={selection.isSelected(item.uid)}
                leading={
                  canBulk ? (
                    <Pressable onPress={() => selection.toggle(item.uid)} hitSlop={8}>
                      <AdminAvatarMark
                        label={selection.isSelected(item.uid) ? '✓' : item.display_name}
                        tone={selection.isSelected(item.uid) ? 'accent' : 'info'}
                      />
                    </Pressable>
                  ) : (
                    <AdminAvatarMark label={item.display_name} tone={needs ? 'warn' : 'info'} />
                  )
                }
                onPress={() => setSelected(item)}
              />
            </AdminListRow>
          );
        }}
      />

      <AdminModalSheet visible={!!selected} onClose={() => setSelected(null)} variant="full">
        {selected ? (
          <AdminUserDetail
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
          onClose={() => setGodModeContext(null)}
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
  onClose,
  onDone,
}: {
  busy: boolean;
  setBusy: (v: boolean) => void;
  actorUid: string;
  actorEmail?: string;
  onClose: () => void;
  onDone: () => Promise<void>;
}) {
  const t = useAdminTokens();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState<'player' | 'coach' | 'parent' | 'club'>('player');
  const [clubName, setClubName] = useState('');
  const [clubCity, setClubCity] = useState('');

  const createAccount = () => {
    if (!email.trim() || password.length < 6 || !displayName.trim()) {
      prodayAlert.alert('Champs requis', 'Email, nom et mot de passe (≥6) sont obligatoires.');
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
          prodayAlert.alert('Compte créé', `UID ${uid}`);
          await onDone();
        } catch (e) {
          prodayAlert.alert('Erreur', e instanceof Error ? e.message : 'Échec création');
        } finally {
          setBusy(false);
        }
      },
    );
  };

  const createClub = () => {
    if (!clubName.trim()) {
      prodayAlert.alert('Nom requis', 'Indiquez le nom du club.');
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
          prodayAlert.alert('Club créé', `ID ${id}`);
          await onDone();
        } catch (e) {
          prodayAlert.alert('Erreur', e instanceof Error ? e.message : 'Échec création club');
        } finally {
          setBusy(false);
        }
      },
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <AdminSheetHeader
        title="Créer un compte ou club"
        subtitle="Provisionnement direct Auth + Firestore via callable admin"
        onClose={onClose}
      />
      <ScrollView style={{ padding: adminSpace.lg }} contentContainerStyle={{ gap: 16 }} showsVerticalScrollIndicator={false}>
        <AdminCard>
          <AdminText variant="h2">Nouveau compte utilisateur</AdminText>
          <AdminText variant="caption" muted>Crée un utilisateur avec mot de passe initial</AdminText>
          <View style={{ gap: 10, marginTop: 8 }}>
            <View style={{ gap: 4 }}>
              <AdminText variant="label" muted>Nom affiché *</AdminText>
              <AdminField
                value={displayName}
                onChangeText={setDisplayName}
                placeholder="Ex: Paul Pogba"
              />
            </View>
            <View style={{ gap: 4 }}>
              <AdminText variant="label" muted>Adresse email *</AdminText>
              <AdminField
                value={email}
                onChangeText={setEmail}
                placeholder="Ex: paul.pogba@proday.com"
              />
            </View>
            <View style={{ gap: 4 }}>
              <AdminText variant="label" muted>Mot de passe temporaire (≥ 6 car.) *</AdminText>
              <AdminField
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                placeholder="Mot de passe"
              />
            </View>
            <View style={{ gap: 4 }}>
              <AdminText variant="label" muted>Rôle du compte</AdminText>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                {(['player', 'coach', 'parent', 'club'] as const).map((r) => (
                  <AdminFilterChip
                    key={r}
                    label={r === 'player' ? 'Joueur' : r === 'coach' ? 'Coach' : r === 'parent' ? 'Parent' : 'Club'}
                    active={role === r}
                    onPress={() => setRole(r)}
                  />
                ))}
              </View>
            </View>
            <View style={{ marginTop: 6 }}>
              <AdminButton
                label={busy ? 'Création en cours…' : 'Créer le compte utilisateur'}
                variant="primary"
                disabled={busy}
                onPress={createAccount}
              />
            </View>
          </View>
        </AdminCard>

        <AdminCard>
          <AdminText variant="h2">Nouveau club</AdminText>
          <AdminText variant="caption" muted>Enregistre une nouvelle entité club</AdminText>
          <View style={{ gap: 10, marginTop: 8 }}>
            <View style={{ gap: 4 }}>
              <AdminText variant="label" muted>Nom du club *</AdminText>
              <AdminField
                value={clubName}
                onChangeText={setClubName}
                placeholder="Ex: FC Montrouge 92"
              />
            </View>
            <View style={{ gap: 4 }}>
              <AdminText variant="label" muted>Ville</AdminText>
              <AdminField
                value={clubCity}
                onChangeText={setClubCity}
                placeholder="Ex: Montrouge"
              />
            </View>
            <View style={{ marginTop: 6 }}>
              <AdminButton
                label={busy ? 'Création en cours…' : 'Créer le club'}
                variant="soft"
                disabled={busy}
                onPress={createClub}
              />
            </View>
          </View>
        </AdminCard>
      </ScrollView>
    </View>
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
  const t = useAdminTokens();
  const [uid, setUid] = useState('');

  const startPreview = (targetUid: string, label: string) => {
    if (!canImpersonate || !onPreviewUserApp) {
      prodayAlert.alert('Refusé', 'Aperçu app non autorisé pour ce compte admin.');
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
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <AdminSheetHeader
        title="Aperçu App (Impersonate)"
        subtitle="Ouvre l’app utilisateur en mode aperçu · actions auditées"
        onClose={onClose}
      />
      <ScrollView style={{ padding: adminSpace.lg }} contentContainerStyle={{ gap: 16 }}>
      <AdminText variant="h2" style={{ color: t.accentHot }}>
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
    </View>
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
  const t = useAdminTokens();
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
});
