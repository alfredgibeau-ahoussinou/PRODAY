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
import { adminService } from '../../../services/admin.service';
import { useAuth } from '../../../context/AuthContext';
import type { Club } from '../../../models/Club';
import { confirmAdminAction } from '../utils/confirmAdminAction';
import { useAdminSelection } from '../utils/useAdminSelection';
import { shareCsv, toCsv } from '../utils/adminCsv';
import { canAdminUi } from '../utils/adminRbac';
import { getRoleLabel } from '../../../screens/signup/signupFlowConfig';
import { adminAuditService } from '../../../services/adminAudit.service';
import { AdminClubCommercialBillingCard } from '../ui/AdminClubCommercialBillingCard';

type Filter = 'all' | 'verified' | 'unverified' | 'suspended' | 'new';

export function AdminClubsPane({ focusId }: { focusId?: string }) {
  const data = useAdminData();
  const { firebaseUser, profile } = useAuth();
  const t = ADMIN_TOKENS;
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [selected, setSelected] = useState<Club | null>(null);
  const [busy, setBusy] = useState(false);
  const selection = useAdminSelection<string>();
  const canBulk = canAdminUi(profile?.email, 'bulk');
  const canExport = canAdminUi(profile?.email, 'export');

  useEffect(() => {
    if (!focusId) return;
    const hit = data.clubs.find((c) => c.id === focusId);
    if (hit) setSelected(hit);
  }, [focusId, data.clubs]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    const weekAgo = Date.now() - 7 * 24 * 3600 * 1000;
    return data.clubs.filter((c) => {
      if (filter === 'verified' && !c.verified) return false;
      if (filter === 'unverified' && c.verified) return false;
      if (filter === 'suspended' && !c.suspended) return false;
      if (filter === 'new' && (c.created_at?.getTime() ?? 0) < weekAgo) return false;
      if (!query) return true;
      return (
        c.name.toLowerCase().includes(query) ||
        (c.city?.toLowerCase().includes(query) ?? false) ||
        c.owner_uid.toLowerCase().includes(query) ||
        (c.admin_tags ?? []).some((tag) => tag.toLowerCase().includes(query))
      );
    });
  }, [data.clubs, q, filter]);

  const exportCsv = () => {
    void shareCsv(
      'proday-clubs.csv',
      toCsv(
        ['id', 'name', 'city', 'verified', 'suspended', 'archived', 'owner_uid', 'tags'],
        filtered.map((c) => [
          c.id,
          c.name,
          c.city,
          c.verified,
          !!c.suspended,
          !!c.archived,
          c.owner_uid,
          (c.admin_tags ?? []).join('|'),
        ]),
      ),
    );
  };

  const bulkSuspend = (suspended: boolean) => {
    if (!selection.count) return;
    confirmAdminAction(
      suspended ? `Suspendre ${selection.count} clubs ?` : `Réactiver ${selection.count} clubs ?`,
      'Action groupée auditée.',
      async () => {
        setBusy(true);
        try {
          for (const id of selection.ids) {
            await adminService.updateClub(id, { suspended }, firebaseUser?.uid);
          }
          await adminAuditService.log({
            action: 'other',
            actor_uid: firebaseUser?.uid ?? 'admin',
            actor_email: profile?.email ?? undefined,
            target_type: 'club_bulk',
            target_id: selection.ids.slice(0, 8).join(','),
            summary: `Bulk suspended=${suspended} n=${selection.count}`,
          });
          selection.clear();
          await data.refresh();
        } catch (e) {
          Alert.alert('Erreur', e instanceof Error ? e.message : 'Échec');
        } finally {
          setBusy(false);
        }
      },
      suspended,
    );
  };

  if (data.loading) return <AdminLoading />;

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <AdminPaneHeader
          title="Clubs"
          subtitle={`${data.clubs.length} clubs · dossier · bulk · CSV`}
        />
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder="Nom, ville, owner, tag…"
          placeholderTextColor={t.faint}
          style={[
            styles.input,
            { color: t.foreground, borderColor: t.border, backgroundColor: t.surfaceGlass },
          ]}
        />
        <View style={styles.chips}>
          {(
            [
              ['all', 'Tous'],
              ['verified', 'Validés'],
              ['unverified', 'À valider'],
              ['suspended', 'Suspendus'],
              ['new', 'Nouveaux'],
            ] as const
          ).map(([id, label]) => (
            <Pressable
              key={id}
              onPress={() => setFilter(id)}
              style={[
                styles.chip,
                {
                  backgroundColor: filter === id ? t.accentSoft : t.surfaceRaised,
                  borderColor: filter === id ? t.borderStrong : t.border,
                },
              ]}
            >
              <AdminText
                variant="caption"
                color={filter === id ? t.champagneBright : t.muted}
              >
                {label}
              </AdminText>
            </Pressable>
          ))}
        </View>
        <View style={styles.bulkBar}>
          {canBulk ? (
            <>
              <AdminButton
                label="Tout sel."
                variant="ghost"
                onPress={() => selection.selectAll(filtered.map((c) => c.id))}
              />
              <AdminButton label="Vider" variant="ghost" onPress={selection.clear} />
              <AdminButton
                label={`Suspendre (${selection.count})`}
                variant="danger"
                disabled={!selection.count || busy}
                onPress={() => bulkSuspend(true)}
              />
              <AdminButton
                label={`Réactiver (${selection.count})`}
                variant="soft"
                disabled={!selection.count || busy}
                onPress={() => bulkSuspend(false)}
              />
            </>
          ) : null}
          {canExport ? <AdminButton label="CSV" variant="ghost" onPress={exportCsv} /> : null}
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: adminSpace.lg, gap: 8 }}
        ListEmptyComponent={<AdminEmptyState title="Aucun club" />}
        renderItem={({ item, index }) => (
          <AdminListRow
            index={index}
            onPress={() => setSelected(item)}
            onLongPress={() => selection.toggle(item.id)}
          >
            <AdminCard
              style={
                selection.isSelected(item.id) ? { borderColor: ADMIN_TOKENS.accent } : undefined
              }
            >
              <View style={styles.row}>
                {canBulk ? (
                  <Pressable onPress={() => selection.toggle(item.id)} hitSlop={8}>
                    <AdminBadge
                      label={selection.isSelected(item.id) ? '✓' : '○'}
                      tone={selection.isSelected(item.id) ? 'accent' : 'info'}
                    />
                  </Pressable>
                ) : null}
                <View style={{ flex: 1, gap: 2 }}>
                  <AdminText variant="h3">{item.name}</AdminText>
                  <AdminText variant="caption" color={t.muted}>
                    {[item.city, item.department].filter(Boolean).join(' · ') || '—'}
                  </AdminText>
                  {(item.admin_tags ?? []).length ? (
                    <AdminText variant="caption" color={t.faint}>
                      {(item.admin_tags ?? []).join(', ')}
                    </AdminText>
                  ) : null}
                </View>
                <View style={{ gap: 4, alignItems: 'flex-end' }}>
                  {item.suspended ? <AdminBadge label="Suspendu" tone="danger" /> : null}
                  <AdminBadge
                    label={item.verified ? 'Validé' : 'Attente'}
                    tone={item.verified ? 'success' : 'warn'}
                  />
                </View>
              </View>
            </AdminCard>
          </AdminListRow>
        )}
      />

      <AdminModalSheet visible={!!selected} onClose={() => setSelected(null)} variant="full">
        {selected ? (
          <ClubEditor
            club={selected}
            busy={busy}
            setBusy={setBusy}
            actorUid={firebaseUser?.uid ?? 'admin'}
            onClose={() => setSelected(null)}
            onRefresh={async () => {
              await data.refresh();
              const list = await adminService.listAllClubs(200);
              setSelected(list.find((c) => c.id === selected.id) ?? selected);
            }}
          />
        ) : null}
      </AdminModalSheet>
    </View>
  );
}

function ClubEditor({
  club,
  busy,
  setBusy,
  actorUid,
  onClose,
  onRefresh,
}: {
  club: Club;
  busy: boolean;
  setBusy: (v: boolean) => void;
  actorUid: string;
  onClose: () => void;
  onRefresh: () => Promise<void>;
}) {
  const t = ADMIN_TOKENS;
  const data = useAdminData();
  const { profile } = useAuth();
  const [name, setName] = useState(club.name);
  const [city, setCity] = useState(club.city);
  const [department, setDepartment] = useState(club.department ?? '');
  const [note, setNote] = useState(club.admin_note ?? '');
  const [tags, setTags] = useState((club.admin_tags ?? []).join(', '));

  useEffect(() => {
    setName(club.name);
    setCity(club.city);
    setDepartment(club.department ?? '');
    setNote(club.admin_note ?? '');
    setTags((club.admin_tags ?? []).join(', '));
  }, [club]);

  const relatedUsers = useMemo(
    () =>
      data.users.filter(
        (u) => u.uid === club.owner_uid || u.profile?.club_id === club.id,
      ),
    [data.users, club.id, club.owner_uid],
  );
  const coaches = relatedUsers.filter((u) => u.role === 'coach');
  const players = relatedUsers.filter((u) => u.role === 'player');
  const clubTeams = useMemo(
    () => data.teams.filter((tm) => tm.club_id === club.id),
    [data.teams, club.id],
  );
  const clubQuotes = useMemo(
    () =>
      data.clubQuoteRequests.filter(
        (q) =>
          q.requester_uid === club.owner_uid ||
          q.club_name.toLowerCase() === club.name.toLowerCase(),
      ),
    [data.clubQuoteRequests, club.owner_uid, club.name],
  );
  const clubPayments = useMemo(
    () => data.payments.filter((p) => p.club_id === club.id),
    [data.payments, club.id],
  );
  const suggestedQuote = clubQuotes.find(
    (q) => q.quoted_total_eur != null && (q.status === 'quoted' || q.status === 'accepted'),
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

  const save = () =>
    confirmAdminAction('Enregistrer le club ?', 'Identité + note + tags.', () =>
      run(() =>
        adminService.updateClub(
          club.id,
          {
            name,
            city,
            department: department || null,
            admin_note: note,
            admin_tags: parseTags(),
          },
          actorUid,
        ),
      ),
    );

  return (
    <View style={[styles.editorRoot, { backgroundColor: t.bg }]}>
      <AdminSheetHeader
        title={club.name}
        subtitle={`Dossier complet · owner ${club.owner_uid.slice(0, 12)}…`}
        onClose={onClose}
        closeLabel="Fermer"
      />
      <ScrollView contentContainerStyle={styles.editorBody}>
        <AdminCard>
          <AdminText variant="h2">Identité</AdminText>
          <Field label="Nom" value={name} onChange={setName} />
          <Field label="Ville" value={city} onChange={setCity} />
          <Field label="Département" value={department} onChange={setDepartment} />
          <Field label="Note admin" value={note} onChange={setNote} multiline />
          <Field label="Tags (virgules)" value={tags} onChange={setTags} />
          <AdminButton label={busy ? '…' : 'Enregistrer'} disabled={busy} onPress={save} />
        </AdminCard>

        <AdminClubCommercialBillingCard
          club={club}
          busy={busy}
          setBusy={setBusy}
          actorUid={actorUid}
          actorEmail={profile?.email ?? undefined}
          onRefresh={onRefresh}
          suggestedAmountEur={suggestedQuote?.quoted_total_eur}
          suggestedOfferId={
            suggestedQuote?.offer_hint === 'club_video_pro'
              ? 'club_video_pro'
              : suggestedQuote
                ? 'club_premium'
                : null
          }
        />

        <AdminCard>
          <AdminText variant="h2">Statuts</AdminText>
          <View style={styles.badges}>
            <AdminBadge
              label={club.verified ? 'Validé' : 'Non validé'}
              tone={club.verified ? 'success' : 'warn'}
            />
            <AdminBadge
              label={club.suspended ? 'Suspendu' : 'Actif'}
              tone={club.suspended ? 'danger' : 'success'}
            />
            <AdminBadge
              label={club.archived ? 'Archivé' : 'Courant'}
              tone={club.archived ? 'info' : 'accent'}
            />
          </View>
          <View style={styles.actions}>
            <AdminButton
              label="Valider"
              disabled={busy || club.verified}
              onPress={() =>
                confirmAdminAction('Valider ?', 'Action auditée.', () =>
                  run(() => adminService.updateClub(club.id, { verified: true }, actorUid)),
                )
              }
            />
            <AdminButton
              label="Suspendre"
              variant="danger"
              disabled={busy || !!club.suspended}
              onPress={() =>
                confirmAdminAction(
                  'Suspendre ?',
                  'suspended=true',
                  () =>
                    run(() => adminService.updateClub(club.id, { suspended: true }, actorUid)),
                  true,
                )
              }
            />
            <AdminButton
              label="Lever suspension"
              variant="soft"
              disabled={busy || !club.suspended}
              onPress={() =>
                confirmAdminAction('Réactiver ?', '', () =>
                  run(() => adminService.updateClub(club.id, { suspended: false }, actorUid)),
                )
              }
            />
            <AdminButton
              label="Archiver"
              variant="ghost"
              disabled={busy || !!club.archived}
              onPress={() =>
                confirmAdminAction(
                  'Archiver ?',
                  'Soft archive',
                  () =>
                    run(() => adminService.updateClub(club.id, { archived: true }, actorUid)),
                  true,
                )
              }
            />
          </View>
        </AdminCard>

        <AdminCard>
          <AdminText variant="h2">Équipes ({clubTeams.length})</AdminText>
          {clubTeams.length === 0 ? (
            <AdminText variant="caption" color={t.muted}>
              Aucune équipe liée.
            </AdminText>
          ) : (
            clubTeams.slice(0, 20).map((tm) => (
              <AdminText key={tm.id} variant="body" color={t.muted}>
                {tm.name}
                {tm.category ? ` · ${tm.category}` : ''}
              </AdminText>
            ))
          )}
        </AdminCard>

        <AdminCard>
          <AdminText variant="h2">
            Effectif · {coaches.length} coachs · {players.length} joueurs
          </AdminText>
          {[...coaches, ...players].slice(0, 24).map((u) => (
            <AdminText key={u.uid} variant="caption" color={t.muted}>
              {getRoleLabel(u.role)} · {u.display_name} · {u.email}
            </AdminText>
          ))}
        </AdminCard>

        <AdminCard>
          <AdminText variant="h2">Devis liés ({clubQuotes.length})</AdminText>
          {clubQuotes.slice(0, 10).map((q) => (
            <View key={q.id} style={styles.miniRow}>
              <AdminText variant="caption" color={t.muted} style={{ flex: 1 }}>
                {q.status}
                {q.quoted_total_eur != null ? ` · ${q.quoted_total_eur} €` : ''}
              </AdminText>
              <AdminBadge label={q.offer_hint ?? 'quote'} tone="info" />
            </View>
          ))}
        </AdminCard>

        <AdminCard>
          <AdminText variant="h2">Paiements équipe ({clubPayments.length})</AdminText>
          {clubPayments.slice(0, 10).map((p) => (
            <AdminText key={p.id} variant="caption" color={t.muted}>
              {p.label} · {p.amount_eur} € · {p.status}
            </AdminText>
          ))}
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
  bulkBar: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  row: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  editorRoot: { flex: 1 },
  editorBody: { padding: adminSpace.lg, gap: adminSpace.md, paddingBottom: 48 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  miniRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
});
