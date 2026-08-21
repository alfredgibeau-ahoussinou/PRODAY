import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
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
  AdminText,
} from '../ui/adminUi';
import { ADMIN_TOKENS } from '../theme/adminTokens';
import { adminSpace } from '../theme/adminDesignSystem';
import { getRoleLabel } from '../../../screens/signup/signupFlowConfig';
import { userNeedsAdminVerificationReview } from '../../../utils/adminUserVerification';
import type { User, UserRole, VerificationStatus } from '../../../models/User';
import { adminService } from '../../../services/admin.service';
import { useAuth } from '../../../context/AuthContext';
import { confirmAdminAction } from '../utils/confirmAdminAction';
import { adminAuditService } from '../../../services/adminAudit.service';

const ROLE_FILTERS: { id: 'all' | UserRole; label: string }[] = [
  { id: 'all', label: 'Tous' },
  { id: 'player', label: 'Joueurs' },
  { id: 'coach', label: 'Coachs' },
  { id: 'parent', label: 'Parents' },
  { id: 'club', label: 'Clubs' },
  { id: 'supporter', label: 'Supporters' },
  { id: 'sponsor', label: 'Sponsors' },
];

const EDITABLE_ROLES: UserRole[] = [
  'player',
  'coach',
  'parent',
  'club',
  'supporter',
  'sponsor',
  'agent',
  'recruiter',
  'organizer',
];

export function AdminUsersPane({ focusId }: { focusId?: string }) {
  const data = useAdminData();
  const { firebaseUser, profile } = useAuth();
  const t = ADMIN_TOKENS;
  const [q, setQ] = useState('');
  const [role, setRole] = useState<'all' | UserRole>('all');
  const [onlyPending, setOnlyPending] = useState(false);
  const [selected, setSelected] = useState<User | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!focusId) return;
    const hit = data.users.find((u) => u.uid === focusId);
    if (hit) setSelected(hit);
  }, [focusId, data.users]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return data.users
      .filter((u) => {
        if (role !== 'all' && u.role !== role) return false;
        if (onlyPending && !userNeedsAdminVerificationReview(u)) return false;
        if (!query) return true;
        return (
          u.display_name.toLowerCase().includes(query) ||
          u.email.toLowerCase().includes(query) ||
          (u.city?.toLowerCase().includes(query) ?? false) ||
          u.uid.toLowerCase().includes(query)
        );
      })
      .slice(0, 250);
  }, [data.users, q, role, onlyPending]);

  if (data.loading) return <AdminLoading />;

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <AdminText variant="h1">Utilisateurs</AdminText>
        <AdminText variant="caption" color={t.muted}>
          {data.users.length} comptes · édition réelle Firestore
        </AdminText>
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder="Nom, e-mail, ville, uid…"
          placeholderTextColor={t.faint}
          style={[styles.input, { color: t.foreground, borderColor: t.border, backgroundColor: t.surface }]}
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
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.uid}
        contentContainerStyle={{ padding: adminSpace.lg, gap: 8 }}
        ListEmptyComponent={
          <AdminEmptyState title="Aucun utilisateur" body="Ajustez les filtres." />
        }
        renderItem={({ item }) => {
          const needs = userNeedsAdminVerificationReview(item);
          return (
            <Pressable onPress={() => setSelected(item)}>
              <AdminCard>
                <View style={styles.row}>
                  <View style={{ flex: 1, gap: 2 }}>
                    <AdminText variant="h3">{item.display_name}</AdminText>
                    <AdminText variant="caption" color={t.muted}>
                      {getRoleLabel(item.role)} · {item.email}
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
            </Pressable>
          );
        }}
      />

      <Modal visible={!!selected} animationType="slide" onRequestClose={() => setSelected(null)}>
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
          />
        ) : null}
      </Modal>
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
  const t = ADMIN_TOKENS;
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: active ? t.accentSoft : t.surfaceRaised,
          borderColor: active ? t.accent : t.border,
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
}: {
  user: User;
  busy: boolean;
  onClose: () => void;
  onRefresh: () => Promise<void>;
  setBusy: (v: boolean) => void;
  actorUid: string;
  actorEmail?: string;
}) {
  const t = ADMIN_TOKENS;
  const [name, setName] = useState(user.display_name);
  const [city, setCity] = useState(user.city ?? '');
  const [note, setNote] = useState(user.admin_note ?? '');
  const [role, setRole] = useState<UserRole>(user.role);

  useEffect(() => {
    setName(user.display_name);
    setCity(user.city ?? '');
    setNote(user.admin_note ?? '');
    setRole(user.role);
  }, [user]);

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

  const saveProfile = () =>
    confirmAdminAction('Enregistrer le profil ?', 'Modification Firestore + audit.', () =>
      run(async () => {
        await adminService.updateUser(user.uid, {
          display_name: name.trim() || user.display_name,
          city: city.trim(),
          admin_note: note,
          role,
        });
        await adminAuditService.log({
          action: 'user_updated',
          actor_uid: actorUid,
          actor_email: actorEmail,
          target_type: 'user',
          target_id: user.uid,
          summary: `Profil / rôle → ${role}`,
        });
      }),
    );

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
            'Cadeau admin Control Center',
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
      <View style={styles.editorHeader}>
        <AdminButton label="Fermer" variant="ghost" onPress={onClose} />
        <AdminText variant="h1" numberOfLines={1}>
          {user.display_name}
        </AdminText>
        <AdminText variant="caption" color={t.muted}>
          {user.email} · {user.uid.slice(0, 10)}…
        </AdminText>
      </View>
      <ScrollView contentContainerStyle={styles.editorBody}>
        <AdminCard>
          <AdminText variant="h2">Identité</AdminText>
          <Field label="Nom affiché" value={name} onChange={setName} />
          <Field label="Ville" value={city} onChange={setCity} />
          <Field label="Note admin" value={note} onChange={setNote} multiline />
          <AdminText variant="label" color={t.faint}>
            Rôle
          </AdminText>
          <View style={styles.chips}>
            {EDITABLE_ROLES.map((r) => (
              <Chip key={r} label={getRoleLabel(r)} active={role === r} onPress={() => setRole(r)} />
            ))}
          </View>
          <AdminButton label={busy ? '…' : 'Enregistrer'} onPress={saveProfile} disabled={busy} />
        </AdminCard>

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
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  row: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  editorRoot: { flex: 1, paddingTop: 48 },
  editorHeader: { paddingHorizontal: adminSpace.lg, gap: 6, paddingBottom: 8 },
  editorBody: { padding: adminSpace.lg, gap: adminSpace.md, paddingBottom: 48 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
});
