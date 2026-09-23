import React, { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { prodayAlert } from '../../../utils/prodayAlert';
import {
  AdminAvatarMark,
  AdminBadge,
  AdminButton,
  AdminCard,
  AdminEmptyState,
  AdminEntityRow,
  AdminLoading,
  AdminPaneHeader,
  AdminText,
} from '../ui/adminUi';
import { useAdminTokens, ADMIN_TOKENS } from '../theme/adminTokens';
import { adminLayout, adminSpace } from '../theme/adminDesignSystem';
import { adminService } from '../../../services/admin.service';
import { membershipsService } from '../../../services/memberships.service';
import { useAuth } from '../../../context/AuthContext';
import { useAdminData } from '../data/AdminDataContext';
import { confirmAdminAction } from '../utils/confirmAdminAction';
import { adminAuditService } from '../../../services/adminAudit.service';
import { userNeedsAdminVerificationReview } from '../../../utils/adminUserVerification';
import { AdminModalSheet, AdminListRow } from '../motion';
import type { User } from '../../../models/User';

type PendingClaim = Awaited<ReturnType<typeof adminService.listPendingPublicClubClaims>>[number];

export function AdminIdentityQueuePane({ focusId }: { focusId?: string }) {
  const t = useAdminTokens();
  const data = useAdminData();
  const { firebaseUser, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [claims, setClaims] = useState<PendingClaim[]>([]);
  const [docUser, setDocUser] = useState<User | null>(null);
  const [docs, setDocs] = useState<Awaited<ReturnType<typeof adminService.listUserDocuments>>>([]);

  const load = useCallback(async () => {
    const c = await adminService.listPendingPublicClubClaims(80);
    setClaims(c);
  }, []);

  useEffect(() => {
    void load().finally(() => setLoading(false));
  }, [load]);

  useEffect(() => {
    if (!focusId) return;
    const mem = data.pendingMemberships.find((m) => m.id === focusId);
    if (mem) return;
    const user = data.users.find((u) => u.uid === focusId);
    if (user) void openDocs(user);
  }, [focusId, data.pendingMemberships, data.users]);

  const refresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([load(), data.refresh()]);
    } finally {
      setRefreshing(false);
    }
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
            action === 'reject' ? 'Refus admin' : undefined,
          );
          await adminAuditService.log({
            action: 'other',
            actor_uid: firebaseUser?.uid ?? 'admin',
            actor_email: profile?.email ?? undefined,
            target_type: 'fff_public_club_claim',
            target_id: claim.fff_affiliation_number,
            summary: `Claim ${action}`,
          });
          await load();
        } catch (e) {
          prodayAlert.alert('Erreur', e instanceof Error ? e.message : 'Échec');
        } finally {
          setBusy(null);
        }
      },
      action === 'reject',
    );
  };

  const resolveMembership = (id: string, approve: boolean) => {
    confirmAdminAction(
      approve ? 'Approuver l’adhésion ?' : 'Refuser l’adhésion ?',
      'Override statut membership · DB réelle',
      async () => {
        setBusy(`mem-${id}`);
        try {
          const uid = firebaseUser?.uid ?? 'admin';
          if (approve) await membershipsService.approve(id, uid);
          else await membershipsService.reject(id, uid);
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

  const openDocs = async (user: User) => {
    setDocUser(user);
    try {
      const list = await adminService.listUserDocuments(user.uid);
      setDocs(list);
    } catch (e) {
      prodayAlert.alert('Erreur docs', e instanceof Error ? e.message : 'Échec');
      setDocs([]);
    }
  };

  const decideUser = (user: User, status: 'VERIFIED' | 'REJECTED') => {
    confirmAdminAction(
      status === 'VERIFIED' ? 'Approuver identité ?' : 'Rejeter identité ?',
      user.display_name || user.email || user.uid,
      async () => {
        setBusy(`user-${user.uid}`);
        try {
          await adminService.updateUser(user.uid, {
            verification_status: status,
            is_verified: status === 'VERIFIED',
            rejection_reason: status === 'REJECTED' ? 'Refus admin' : null,
          });
          await data.refresh();
          setDocUser(null);
        } catch (e) {
          prodayAlert.alert('Erreur', e instanceof Error ? e.message : 'Échec');
        } finally {
          setBusy(null);
        }
      },
      status === 'REJECTED',
    );
  };

  if (loading || data.loading) return <AdminLoading label="File identité…" />;

  const pendingUsers = data.users.filter(userNeedsAdminVerificationReview);

  return (
    <>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => void refresh()} tintColor={t.accent} />
        }
      >
        <AdminPaneHeader
          title="File identité"
          subtitle="Claims club · adhésions · documents ID — approve / reject 1-clic"
        />

        <AdminCard>
          <View style={styles.headRow}>
            <AdminText variant="h2">Claims FFF</AdminText>
            <AdminBadge label={String(claims.length)} tone={claims.length ? 'warn' : 'success'} />
          </View>
          {claims.length === 0 ? (
            <AdminEmptyState
              title="Aucun claim pending"
              body="Les revendications clubs publics FFF apparaîtront ici."
              icon="shield"
            />
          ) : (
            claims.map((c) => (
              <AdminEntityRow
                key={c.fff_affiliation_number}
                title={c.club_name || c.fff_affiliation_number}
                subtitle={`FFF ${c.fff_affiliation_number} · club ${c.proday_club_id ?? '—'}`}
                meta={c.mandate_document_name ? `Doc · ${c.mandate_document_name}` : undefined}
                badge="CLAIM"
                badgeTone="warn"
                leading={<AdminAvatarMark label={c.club_name || 'C'} tone="warn" />}
                actions={
                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    <AdminButton
                      label="Valider"
                      compact
                      disabled={!!busy}
                      onPress={() => resolveClaim(c, 'approve')}
                    />
                    <AdminButton
                      label="Refuser"
                      variant="danger"
                      compact
                      disabled={!!busy}
                      onPress={() => resolveClaim(c, 'reject')}
                    />
                  </View>
                }
              />
            ))
          )}
        </AdminCard>

        <AdminCard>
          <View style={styles.headRow}>
            <AdminText variant="h2">Adhésions membres</AdminText>
            <AdminBadge
              label={String(data.pendingMemberships.length)}
              tone={data.pendingMemberships.length ? 'warn' : 'success'}
            />
          </View>
          {data.pendingMemberships.length === 0 ? (
            <AdminEmptyState
              title="Aucune adhésion en attente"
              body="File claire pour les demandes membres."
              icon="handshake"
            />
          ) : (
            data.pendingMemberships.map((m) => (
              <AdminEntityRow
                key={m.id}
                title={m.player_name}
                subtitle={`Club ${m.club_id} · ${m.license_number || 'sans licence'}`}
                badge="PENDING"
                badgeTone="warn"
                leading={<AdminAvatarMark label={m.player_name} tone="warn" />}
                actions={
                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    <AdminButton
                      label="Valider"
                      compact
                      disabled={!!busy}
                      onPress={() => resolveMembership(m.id, true)}
                    />
                    <AdminButton
                      label="Refuser"
                      variant="danger"
                      compact
                      disabled={!!busy}
                      onPress={() => resolveMembership(m.id, false)}
                    />
                  </View>
                }
              />
            ))
          )}
        </AdminCard>

        <AdminCard>
          <View style={styles.headRow}>
            <AdminText variant="h2">Vérifications d'identité</AdminText>
            <AdminBadge
              label={String(pendingUsers.length)}
              tone={pendingUsers.length ? 'warn' : 'success'}
            />
          </View>
          {pendingUsers.length === 0 ? (
            <AdminEmptyState
              title="Aucune vérification en attente"
              body="Tous les profils et pièces d’identité ont été vérifiés."
              icon="checkmark-circle"
            />
          ) : (
            pendingUsers.slice(0, 40).map((u, index) => (
              <AdminListRow key={u.uid} index={index} onPress={() => void openDocs(u)}>
                <AdminEntityRow
                  title={u.display_name || u.email || u.uid}
                  subtitle={`${u.role} · ${u.verification_status ?? '—'}`}
                  badge="DOCS ID"
                  badgeTone="info"
                  leading={<AdminAvatarMark label={u.display_name || u.email || '?'} tone="info" />}
                  onPress={() => void openDocs(u)}
                />
              </AdminListRow>
            ))
          )}
        </AdminCard>
      </ScrollView>

      <AdminModalSheet visible={!!docUser} onClose={() => setDocUser(null)} variant="full">
        {docUser ? (
          <View style={{ flex: 1, backgroundColor: t.bg }}>
            <AdminPaneHeader
              title={docUser.display_name || 'Vérification identité'}
              subtitle={`${docUser.email} · ${docUser.role.toUpperCase()} · ${docUser.uid}`}
              right={
                <AdminButton label="Fermer" variant="ghost" compact onPress={() => setDocUser(null)} />
              }
            />
            <ScrollView contentContainerStyle={{ padding: adminSpace.lg, gap: 14 }}>
              {docs.length === 0 ? (
                <AdminEmptyState title="Aucun document uploadé" body="Aucune pièce d'identité n'a été transmise." />
              ) : (
                docs.map((d) => (
                  <AdminCard key={d.id}>
                    <AdminText variant="h3">{d.name}</AdminText>
                    <AdminText variant="caption" color={t.muted}>
                      Type : {d.type ?? 'Non spécifié'} · Statut : {d.verification_check ?? 'En cours'}
                    </AdminText>
                    {d.ai_summary ? (
                      <AdminText variant="body" color={t.faint}>
                        Analyse IA : {d.ai_summary}
                      </AdminText>
                    ) : null}
                  </AdminCard>
                ))
              )}
              <View style={[styles.actions, { marginTop: 8 }]}>
                <AdminButton
                  label="Approuver le profil"
                  variant="primary"
                  disabled={!!busy}
                  onPress={() => decideUser(docUser, 'VERIFIED')}
                />
                <AdminButton
                  label="Rejeter le document"
                  variant="danger"
                  disabled={!!busy}
                  onPress={() => decideUser(docUser, 'REJECTED')}
                />
              </View>
            </ScrollView>
          </View>
        ) : null}
      </AdminModalSheet>
    </>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: adminLayout.pageGutter,
    gap: adminLayout.sectionGap,
    paddingBottom: adminLayout.dockClearance,
  },
  headRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
