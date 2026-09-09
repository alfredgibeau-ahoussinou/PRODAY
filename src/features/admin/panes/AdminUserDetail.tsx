import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
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
  AdminSheetHeader,
  AdminText,
} from '../ui/adminUi';
import { ADMIN_TOKENS } from '../theme/adminTokens';
import { adminRadius, adminSpace } from '../theme/adminDesignSystem';
import {
  ADMIN_EDITABLE_ROLE_OPTIONS,
  adminRoleOptionFromUser,
  adminRoleOptionLabel,
  findClubForAdminUser,
  isAdminPresidentUser,
  persistedUserRoleFromAdminOption,
  type AdminRoleOption,
} from '../../../utils/adminPresidentRole';
import { confirmAdminAction } from '../utils/confirmAdminAction';
import { adminService } from '../../../services/admin.service';
import { adminAuditService } from '../../../services/adminAudit.service';
import { useProductLine } from '../../../context/ProductLineContext';
import type { User, VerificationStatus } from '../../../models/User';
import type { AdminAuditEntry } from '../../../services/adminAudit.service';
import {
  ADMIN_USER_SUBPAGE_LABELS,
  type AdminUserSubPage,
} from './adminUserSubPages';

export type { AdminUserSubPage } from './adminUserSubPages';
export { ADMIN_USER_SUBPAGES } from './adminUserSubPages';

type Props = {
  user: User;
  busy: boolean;
  onClose: () => void;
  onRefresh: () => Promise<void>;
  setBusy: (v: boolean) => void;
  actorUid: string;
  actorEmail?: string;
  onPreviewPresidentPole?: () => void;
  initialSubPage?: AdminUserSubPage;
};

export function AdminUserDetail({
  user,
  busy,
  onClose,
  onRefresh,
  setBusy,
  actorUid,
  actorEmail,
  onPreviewPresidentPole,
  initialSubPage = 'profil',
}: Props) {
  const t = ADMIN_TOKENS;
  const data = useAdminData();
  const { setClubShellMode } = useProductLine();
  const [page, setPage] = useState<AdminUserSubPage>(initialSubPage);
  const [name, setName] = useState(user.display_name);
  const [city, setCity] = useState(user.city ?? '');
  const [note, setNote] = useState(user.admin_note ?? '');
  const [tags, setTags] = useState((user.admin_tags ?? []).join(', '));
  const [roleOption, setRoleOption] = useState<AdminRoleOption>(() =>
    adminRoleOptionFromUser(user, data.clubs),
  );
  const [docs, setDocs] = useState<Awaited<ReturnType<typeof adminService.listUserDocuments>>>([]);
  const [audit, setAudit] = useState<AdminAuditEntry[]>([]);
  const [docsLoading, setDocsLoading] = useState(false);

  useEffect(() => {
    setName(user.display_name);
    setCity(user.city ?? '');
    setNote(user.admin_note ?? '');
    setTags((user.admin_tags ?? []).join(', '));
    setRoleOption(adminRoleOptionFromUser(user, data.clubs));
  }, [user, data.clubs]);

  useEffect(() => {
    if (page !== 'verification' && page !== 'activite') return;
    let cancelled = false;
    void (async () => {
      setDocsLoading(true);
      try {
        if (page === 'verification') {
          const d = await adminService.listUserDocuments(user.uid);
          if (!cancelled) setDocs(d);
        } else {
          const all = await adminAuditService.listRecent(120);
          if (!cancelled) {
            setAudit(
              all.filter(
                (e) => e.target_id === user.uid || e.target_id.startsWith(user.uid.slice(0, 8)),
              ),
            );
          }
        }
      } finally {
        if (!cancelled) setDocsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [page, user.uid]);

  const linkedClub = useMemo(
    () => findClubForAdminUser(user, data.clubs),
    [data.clubs, user],
  );
  const isPresident = isAdminPresidentUser(user, data.clubs);
  const memberships = useMemo(
    () => data.pendingMemberships.filter((m) => m.player_uid === user.uid),
    [data.pendingMemberships, user.uid],
  );

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
    confirmAdminAction('Enregistrer le profil ?', 'Modification Firestore + audit.', () =>
      run(async () => {
        await adminService.updateUser(user.uid, {
          display_name: name.trim() || user.display_name,
          city: city.trim(),
          admin_note: note,
          admin_tags: parseTags(),
        });
        await adminAuditService.log({
          action: 'user_updated',
          actor_uid: actorUid,
          actor_email: actorEmail,
          target_type: 'user',
          target_id: user.uid,
          summary: 'Profil / identité mis à jour',
        });
      }),
    );
  };

  const saveRole = () => {
    if (roleOption === 'president' && !linkedClub) {
      Alert.alert(
        'Club requis',
        'Rattachez ce compte à un club avant de le désigner Président (owner).',
      );
      return;
    }
    const persistedRole = persistedUserRoleFromAdminOption(roleOption);
    confirmAdminAction('Enregistrer le rôle ?', adminRoleOptionLabel(roleOption), () =>
      run(async () => {
        await adminService.updateUser(user.uid, {
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
          summary:
            roleOption === 'president'
              ? `Rôle → Président (owner ${linkedClub!.id})`
              : `Rôle → ${persistedRole}`,
        });
      }),
    );
  };

  const setActive = (active: boolean) =>
    confirmAdminAction(
      active ? 'Réactiver le compte ?' : 'Suspendre le compte ?',
      active
        ? 'Le compte pourra à nouveau utiliser ProDay.'
        : 'is_active=false — accès bloqué, données conservées.',
      () =>
        run(async () => {
          await adminService.updateUser(user.uid, { is_active: active });
          await adminAuditService.log({
            action: 'user_updated',
            actor_uid: actorUid,
            actor_email: actorEmail,
            target_type: 'user',
            target_id: user.uid,
            summary: active ? 'Compte réactivé' : 'Compte suspendu',
          });
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
      '1 mois Pro (cadeau admin).',
      () =>
        run(async () => {
          await adminService.grantProSubscription(
            user.uid,
            user.role === 'coach' ? 'coach_plus' : 'player_plus',
            1,
            'Cadeau admin Espace Admin',
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
      'Annule l’abonnement payant.',
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
    <View style={[styles.root, { backgroundColor: t.bg }]} testID="admin-user-detail">
      <AdminSheetHeader
        title={user.display_name}
        subtitle={`${user.email} · ${user.uid.slice(0, 12)}…`}
        onClose={onClose}
        closeLabel="Fermer"
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabsScroll}
        contentContainerStyle={styles.tabs}
      >
        {ADMIN_USER_SUBPAGE_LABELS.map((p) => {
          const active = page === p.id;
          return (
            <Pressable
              key={p.id}
              onPress={() => setPage(p.id)}
              testID={`admin-user-tab-${p.id}`}
              style={[
                styles.tab,
                {
                  backgroundColor: active ? t.accentSoft : t.surfaceMuted,
                  borderColor: active ? t.signal : t.border,
                },
              ]}
            >
              <AdminText variant="caption" color={active ? t.signal : t.muted}>
                {p.label}
              </AdminText>
            </Pressable>
          );
        })}
      </ScrollView>

      <ScrollView contentContainerStyle={styles.body}>
        {page === 'profil' ? (
          <AdminCard>
            <AdminText variant="h2">Identité</AdminText>
            <AdminText variant="caption" color={t.muted}>
              {user.is_active === false ? 'Suspendu' : 'Actif'} · {user.role}
              {user.city ? ` · ${user.city}` : ''}
            </AdminText>
            <Field label="Nom affiché" value={name} onChange={setName} />
            <Field label="Ville" value={city} onChange={setCity} />
            <Field label="Note admin" value={note} onChange={setNote} multiline />
            <Field label="Tags (virgules)" value={tags} onChange={setTags} />
            <AdminButton label={busy ? '…' : 'Enregistrer profil'} onPress={saveProfile} disabled={busy} />
          </AdminCard>
        ) : null}

        {page === 'roles' ? (
          <AdminCard>
            <AdminText variant="h2">Rôles & permissions</AdminText>
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
            <AdminButton label={busy ? '…' : 'Enregistrer le rôle'} onPress={saveRole} disabled={busy} />
            {(roleOption === 'president' || isPresident || user.role === 'club') &&
            onPreviewPresidentPole ? (
              <View style={{ gap: 8, marginTop: 8 }}>
                <AdminText variant="body" color={t.muted}>
                  {isPresident
                    ? `Owner de ${linkedClub?.name ?? 'club'}.`
                    : 'Enregistrez d’abord le rôle Président, puis ouvrez l’aperçu.'}
                </AdminText>
                <AdminButton
                  label="Ouvrir pôle Président"
                  variant="soft"
                  disabled={busy || (!isPresident && roleOption !== 'president')}
                  onPress={() => {
                    confirmAdminAction('Ouvrir le pôle Président ?', 'Aperçu admin.', () => {
                      void setClubShellMode('president');
                      onPreviewPresidentPole();
                    });
                  }}
                />
              </View>
            ) : null}
          </AdminCard>
        ) : null}

        {page === 'clubs' ? (
          <View style={{ gap: adminSpace.md }}>
            <AdminCard>
              <AdminText variant="h2">Club lié</AdminText>
              {linkedClub ? (
                <>
                  <AdminText variant="h3">{linkedClub.name}</AdminText>
                  <AdminText variant="caption" color={t.muted}>
                    {linkedClub.city ?? '—'} · {linkedClub.id}
                  </AdminText>
                  <AdminBadge
                    label={isPresident ? 'Owner / Président' : 'Staff club'}
                    tone={isPresident ? 'accent' : 'info'}
                  />
                </>
              ) : (
                <AdminText variant="body" color={t.muted}>
                  Aucun club rattaché. Liez via la page Clubs ou désignez un owner.
                </AdminText>
              )}
            </AdminCard>
            <AdminCard>
              <AdminText variant="h2">Adhésions en file</AdminText>
              {memberships.length === 0 ? (
                <AdminText variant="caption" color={t.faint}>
                  Aucune adhésion pending pour cet utilisateur.
                </AdminText>
              ) : (
                memberships.map((m) => (
                  <View key={m.id} style={styles.rowItem}>
                    <AdminText variant="body">{m.player_name}</AdminText>
                    <AdminText variant="caption" color={t.muted}>
                      {m.club_id} · {m.license_number ?? 'sans licence'}
                    </AdminText>
                  </View>
                ))
              )}
            </AdminCard>
          </View>
        ) : null}

        {page === 'verification' ? (
          <View style={{ gap: adminSpace.md }}>
            <AdminCard>
              <AdminText variant="h2">Vérification</AdminText>
              <AdminBadge label={user.verification_status ?? '—'} tone="info" />
              <View style={styles.actions}>
                <AdminButton
                  label="Valider"
                  disabled={busy}
                  onPress={() => setVerification('VERIFIED')}
                />
                <AdminButton
                  label="Refuser"
                  variant="danger"
                  disabled={busy}
                  onPress={() => setVerification('REJECTED')}
                />
              </View>
            </AdminCard>
            <AdminCard>
              <AdminText variant="h2">Documents</AdminText>
              {docsLoading ? (
                <AdminText variant="caption" color={t.faint}>
                  Chargement…
                </AdminText>
              ) : docs.length === 0 ? (
                <AdminText variant="caption" color={t.faint}>
                  Aucun document uploadé.
                </AdminText>
              ) : (
                docs.map((d) => (
                  <View key={d.id} style={styles.rowItem}>
                    <AdminText variant="body">{d.name || d.type || d.id}</AdminText>
                    <AdminText variant="caption" color={t.muted} numberOfLines={1}>
                      {d.url ?? d.ai_summary ?? '—'}
                    </AdminText>
                  </View>
                ))
              )}
            </AdminCard>
          </View>
        ) : null}

        {page === 'abonnement' ? (
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
        ) : null}

        {page === 'activite' ? (
          <AdminCard>
            <AdminText variant="h2">Activité / audit</AdminText>
            {docsLoading ? (
              <AdminText variant="caption" color={t.faint}>
                Chargement…
              </AdminText>
            ) : audit.length === 0 ? (
              <AdminText variant="caption" color={t.faint}>
                Aucune entrée audit récente pour ce compte.
              </AdminText>
            ) : (
              audit.map((e) => (
                <View key={e.id} style={styles.rowItem}>
                  <AdminText variant="caption" color={t.signal}>
                    {e.action}
                  </AdminText>
                  <AdminText variant="body">{e.summary}</AdminText>
                  <AdminText variant="mono" color={t.faint}>
                    {e.created_at.toLocaleString('fr-FR')}
                  </AdminText>
                </View>
              ))
            )}
          </AdminCard>
        ) : null}

        {page === 'danger' ? (
          <View style={{ gap: adminSpace.md }}>
            <AdminCard>
              <AdminText variant="h2">Statut compte</AdminText>
              <AdminBadge
                label={user.is_active === false ? 'Suspendu' : 'Actif'}
                tone={user.is_active === false ? 'danger' : 'success'}
              />
              <View style={styles.actions}>
                <AdminButton
                  label="Suspendre"
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
              <AdminText variant="h2">Zone danger</AdminText>
              <AdminText variant="caption" color={t.muted}>
                Suppression Auth + Firestore via callable adminDeleteUser. Irréversible.
              </AdminText>
              <AdminButton
                label="Supprimer le compte"
                variant="danger"
                disabled={busy}
                onPress={() =>
                  confirmAdminAction(
                    'Supprimer définitivement ?',
                    'Auth + Firestore. Irréversible.',
                    () =>
                      run(async () => {
                        await adminService.deleteUserFull(user.uid);
                        await adminAuditService.log({
                          action: 'user_deleted',
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
          </View>
        ) : null}
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
  const t = ADMIN_TOKENS;
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: active ? t.signalSoft : t.surfaceRaised,
          borderColor: active ? t.borderLuxury : t.border,
        },
      ]}
    >
      <AdminText variant="caption" color={active ? t.signal : t.muted}>
        {label}
      </AdminText>
    </Pressable>
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
  tabsScroll: { flexGrow: 0, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: ADMIN_TOKENS.hairline },
  tabs: {
    paddingHorizontal: adminSpace.md,
    paddingVertical: adminSpace.sm,
    gap: 6,
  },
  tab: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: adminRadius.sm,
    borderWidth: 1,
  },
  body: { padding: adminSpace.lg, gap: adminSpace.md, paddingBottom: 56 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: adminRadius.sm,
    borderWidth: 1,
  },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  input: {
    borderWidth: 1,
    borderRadius: adminRadius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  rowItem: {
    gap: 2,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: ADMIN_TOKENS.hairline,
  },
});
