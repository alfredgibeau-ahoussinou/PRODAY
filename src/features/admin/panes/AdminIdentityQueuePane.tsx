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
  const t = ADMIN_TOKENS;
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
          Alert.alert('Erreur', e instanceof Error ? e.message : 'Échec');
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
          Alert.alert('Erreur', e instanceof Error ? e.message : 'Échec');
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
      Alert.alert('Erreur docs', e instanceof Error ? e.message : 'Échec');
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
          Alert.alert('Erreur', e instanceof Error ? e.message : 'Échec');
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
            <AdminEmptyState title="Aucun claim pending" body="File claimed_pending vide." />
          ) : (
            claims.map((c) => (
              <View key={c.fff_affiliation_number} style={[styles.row, { borderColor: t.hairline }]}>
                <View style={{ flex: 1, gap: 2 }}>
                  <AdminText variant="h3">{c.club_name || c.fff_affiliation_number}</AdminText>
                  <AdminText variant="caption" color={t.muted}>
                    FFF {c.fff_affiliation_number} · club {c.proday_club_id ?? '—'}
                  </AdminText>
                  {c.mandate_document_name ? (
                    <AdminText variant="caption" color={t.signal}>
                      Doc · {c.mandate_document_name}
                    </AdminText>
                  ) : null}
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
          <View style={styles.headRow}>
            <AdminText variant="h2">Adhésions membres</AdminText>
            <AdminBadge
              label={String(data.pendingMemberships.length)}
              tone={data.pendingMemberships.length ? 'warn' : 'success'}
            />
          </View>
          {data.pendingMemberships.length === 0 ? (
            <AdminEmptyState title="Aucune adhésion en attente" />
          ) : (
            data.pendingMemberships.map((m) => (
              <View key={m.id} style={[styles.row, { borderColor: t.hairline }]}>
                <View style={{ flex: 1, gap: 2 }}>
                  <AdminText variant="h3">{m.player_name}</AdminText>
                  <AdminText variant="caption" color={t.muted}>
                    Club {m.club_id} · {m.license_number || 'sans licence'}
                  </AdminText>
                </View>
                <View style={styles.actions}>
                  <AdminButton
                    label="OK"
                    disabled={!!busy}
                    onPress={() => resolveMembership(m.id, true)}
                  />
                  <AdminButton
                    label="Refus"
                    variant="danger"
                    disabled={!!busy}
                    onPress={() => resolveMembership(m.id, false)}
                  />
                </View>
              </View>
            ))
          )}
        </AdminCard>

        <AdminCard>
          <View style={styles.headRow}>
            <AdminText variant="h2">Vérifs identité</AdminText>
            <AdminBadge
              label={String(pendingUsers.length)}
              tone={pendingUsers.length ? 'warn' : 'success'}
            />
          </View>
          {pendingUsers.length === 0 ? (
            <AdminEmptyState title="Aucune vérif en attente" />
          ) : (
            pendingUsers.slice(0, 40).map((u, index) => (
              <AdminListRow key={u.uid} index={index} onPress={() => void openDocs(u)}>
                <View style={[styles.row, { borderColor: t.hairline }]}>
                  <View style={{ flex: 1, gap: 2 }}>
                    <AdminText variant="h3">{u.display_name || u.email || u.uid}</AdminText>
                    <AdminText variant="caption" color={t.muted}>
                      {u.role} · {u.verification_status ?? '—'}
                    </AdminText>
                  </View>
                  <AdminBadge label="Docs" tone="info" />
                </View>
              </AdminListRow>
            ))
          )}
        </AdminCard>
      </ScrollView>

      <AdminModalSheet visible={!!docUser} onClose={() => setDocUser(null)} variant="full">
        {docUser ? (
          <ScrollView contentContainerStyle={{ padding: adminSpace.lg, gap: 12 }}>
            <AdminText variant="h1">{docUser.display_name || 'Identité'}</AdminText>
            <AdminText variant="caption" color={t.muted}>
              {docUser.email} · {docUser.uid}
            </AdminText>
            {docs.length === 0 ? (
              <AdminEmptyState title="Aucun document" body="Pas de pièce ID uploadée." />
            ) : (
              docs.map((d) => (
                <AdminCard key={d.id}>
                  <AdminText variant="h3">{d.name}</AdminText>
                  <AdminText variant="caption" color={t.muted}>
                    {d.type ?? '—'} · {d.verification_check ?? '—'}
                  </AdminText>
                  {d.ai_summary ? (
                    <AdminText variant="body" color={t.faint}>
                      IA · {d.ai_summary}
                    </AdminText>
                  ) : null}
                </AdminCard>
              ))
            )}
            <View style={styles.actions}>
              <AdminButton
                label="Approuver"
                disabled={!!busy}
                onPress={() => decideUser(docUser, 'VERIFIED')}
              />
              <AdminButton
                label="Rejeter"
                variant="danger"
                disabled={!!busy}
                onPress={() => decideUser(docUser, 'REJECTED')}
              />
            </View>
          </ScrollView>
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
