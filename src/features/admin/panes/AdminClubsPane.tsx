import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
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

type Filter = 'all' | 'verified' | 'unverified' | 'suspended' | 'new';

export function AdminClubsPane({ focusId }: { focusId?: string }) {
  const data = useAdminData();
  const { firebaseUser, profile } = useAuth();
  const t = ADMIN_TOKENS;
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [selected, setSelected] = useState<Club | null>(null);
  const [busy, setBusy] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
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
        (c.fff_affiliation_number?.toLowerCase().includes(query) ?? false) ||
        c.owner_uid.toLowerCase().includes(query) ||
        (c.admin_tags ?? []).some((tag) => tag.toLowerCase().includes(query))
      );
    });
  }, [data.clubs, q, filter]);

  const exportCsv = () => {
    void shareCsv(
      'proday-clubs.csv',
      toCsv(
        ['id', 'name', 'city', 'fff', 'verified', 'suspended', 'logo_url', 'owner_uid'],
        filtered.map((c) => [
          c.id,
          c.name,
          c.city,
          c.fff_affiliation_number ?? '',
          c.verified,
          !!c.suspended,
          c.logo_url ?? '',
          c.owner_uid,
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
          title="Annuaire clubs"
          subtitle={`${data.clubs.length} clubs FR · CRUD · logos · données publiques`}
        />
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder="Nom, ville, FFF, owner, tag…"
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
                  backgroundColor: filter === id ? t.signalSoft : t.surfaceRaised,
                  borderColor: filter === id ? t.borderStrong : t.border,
                },
              ]}
            >
              <AdminText variant="caption" color={filter === id ? t.accentHot : t.muted}>
                {label}
              </AdminText>
            </Pressable>
          ))}
        </View>
        <View style={styles.bulkBar}>
          <AdminButton label="Créer" onPress={() => setCreateOpen(true)} />
          {canBulk ? (
            <>
              <AdminButton
                label="Tout sel."
                variant="ghost"
                onPress={() => selection.selectAll(filtered.map((c) => c.id))}
              />
              <AdminButton
                label={`Suspendre (${selection.count})`}
                variant="danger"
                disabled={!selection.count || busy}
                onPress={() => bulkSuspend(true)}
              />
            </>
          ) : null}
          {canExport ? <AdminButton label="CSV" variant="ghost" onPress={exportCsv} /> : null}
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: adminSpace.lg, gap: 8, paddingBottom: adminLayout.dockClearance }}
        ListEmptyComponent={<AdminEmptyState title="Aucun club" />}
        renderItem={({ item, index }) => (
          <AdminListRow
            index={index}
            onPress={() => setSelected(item)}
            onLongPress={() => selection.toggle(item.id)}
          >
            <AdminCard
              style={selection.isSelected(item.id) ? { borderColor: ADMIN_TOKENS.accent } : undefined}
            >
              <View style={styles.row}>
                {item.logo_url ? (
                  <Image source={{ uri: item.logo_url }} style={styles.logo} />
                ) : (
                  <View style={[styles.logo, styles.logoFallback, { backgroundColor: t.surfaceRaised }]}>
                    <AdminText variant="caption" color={t.faint}>
                      —
                    </AdminText>
                  </View>
                )}
                <View style={{ flex: 1, gap: 2 }}>
                  <AdminText variant="h3">{item.name}</AdminText>
                  <AdminText variant="caption" color={t.muted}>
                    {[item.city, item.department, item.fff_affiliation_number]
                      .filter(Boolean)
                      .join(' · ') || '—'}
                  </AdminText>
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
          <ClubVisualEditor
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

      <AdminModalSheet visible={createOpen} onClose={() => setCreateOpen(false)}>
        <CreateClubForm
          actorUid={firebaseUser?.uid ?? 'admin'}
          onDone={async () => {
            setCreateOpen(false);
            await data.refresh();
          }}
        />
      </AdminModalSheet>
    </View>
  );
}

function CreateClubForm({
  actorUid,
  onDone,
}: {
  actorUid: string;
  onDone: () => Promise<void>;
}) {
  const t = ADMIN_TOKENS;
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [owner, setOwner] = useState(actorUid);
  const [busy, setBusy] = useState(false);

  return (
    <View style={{ padding: adminSpace.lg, gap: 10 }}>
      <AdminText variant="h2">Nouveau club</AdminText>
      <Field label="Nom" value={name} onChange={setName} />
      <Field label="Ville" value={city} onChange={setCity} />
      <Field label="Owner UID" value={owner} onChange={setOwner} />
      <AdminButton
        label={busy ? '…' : 'Créer'}
        disabled={busy}
        onPress={() => {
          void (async () => {
            setBusy(true);
            try {
              await adminService.createClub({
                name,
                city,
                owner_uid: owner,
                actor_uid: actorUid,
              });
              await onDone();
            } catch (e) {
              Alert.alert('Erreur', e instanceof Error ? e.message : 'Échec');
            } finally {
              setBusy(false);
            }
          })();
        }}
      />
    </View>
  );
}

function ClubVisualEditor({
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
  const [name, setName] = useState(club.name);
  const [city, setCity] = useState(club.city);
  const [department, setDepartment] = useState(club.department ?? '');
  const [fff, setFff] = useState(club.fff_affiliation_number ?? '');
  const [logoUrl, setLogoUrl] = useState(club.logo_url ?? '');
  const [primary, setPrimary] = useState(club.primary_color ?? '');
  const [secondary, setSecondary] = useState(club.secondary_color ?? '');
  const [note, setNote] = useState(club.admin_note ?? '');
  const [tags, setTags] = useState((club.admin_tags ?? []).join(', '));

  useEffect(() => {
    setName(club.name);
    setCity(club.city);
    setDepartment(club.department ?? '');
    setFff(club.fff_affiliation_number ?? '');
    setLogoUrl(club.logo_url ?? '');
    setPrimary(club.primary_color ?? '');
    setSecondary(club.secondary_color ?? '');
    setNote(club.admin_note ?? '');
    setTags((club.admin_tags ?? []).join(', '));
  }, [club]);

  const relatedUsers = useMemo(
    () => data.users.filter((u) => u.uid === club.owner_uid || u.profile?.club_id === club.id),
    [data.users, club.id, club.owner_uid],
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

  const saveIdentity = () =>
    confirmAdminAction('Enregistrer identité ?', 'Firestore clubs/{id}', () =>
      run(() =>
        adminService.updateClub(
          club.id,
          {
            name,
            city,
            department: department || null,
            fff_affiliation_number: fff || null,
            admin_note: note,
            admin_tags: tags
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean),
          },
          actorUid,
        ),
      ),
    );

  const saveVisual = () =>
    confirmAdminAction('Override logo & couleurs ?', 'Données publiques club', () =>
      run(() =>
        adminService.updateClub(
          club.id,
          {
            logo_url: logoUrl || null,
            primary_color: primary || null,
            secondary_color: secondary || null,
          },
          actorUid,
        ),
      ),
    );

  return (
    <View style={[styles.editorRoot, { backgroundColor: t.bg }]}>
      <AdminSheetHeader
        title={club.name}
        subtitle={`Visual · FFF ${club.fff_affiliation_number ?? '—'} · owner ${club.owner_uid.slice(0, 10)}…`}
        onClose={onClose}
        closeLabel="Fermer"
      />
      <ScrollView contentContainerStyle={styles.editorBody}>
        <AdminCard>
          <AdminText variant="h2">Identité publique</AdminText>
          <Field label="Nom" value={name} onChange={setName} />
          <Field label="Ville" value={city} onChange={setCity} />
          <Field label="Département" value={department} onChange={setDepartment} />
          <Field label="N° affiliation FFF" value={fff} onChange={setFff} />
          <Field label="Note admin" value={note} onChange={setNote} multiline />
          <Field label="Tags" value={tags} onChange={setTags} />
          <AdminButton label={busy ? '…' : 'Sauver identité'} disabled={busy} onPress={saveIdentity} />
        </AdminCard>

        <AdminCard>
          <AdminText variant="h2">Visual override</AdminText>
          {logoUrl ? (
            <Image source={{ uri: logoUrl }} style={styles.logoPreview} resizeMode="contain" />
          ) : null}
          <Field label="Logo URL" value={logoUrl} onChange={setLogoUrl} />
          <Field label="Couleur primaire (#RRGGBB)" value={primary} onChange={setPrimary} />
          <Field label="Couleur secondaire" value={secondary} onChange={setSecondary} />
          <View style={styles.swatches}>
            {primary ? (
              <View style={[styles.swatch, { backgroundColor: primary }]} />
            ) : null}
            {secondary ? (
              <View style={[styles.swatch, { backgroundColor: secondary }]} />
            ) : null}
          </View>
          <AdminButton label={busy ? '…' : 'Sauver visual'} disabled={busy} onPress={saveVisual} />
        </AdminCard>

        <AdminCard>
          <AdminText variant="h2">Statuts</AdminText>
          <View style={styles.actions}>
            <AdminButton
              label="Valider"
              disabled={busy || club.verified}
              onPress={() =>
                confirmAdminAction('Valider ?', '', () =>
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
                  '',
                  () => run(() => adminService.updateClub(club.id, { suspended: true }, actorUid)),
                  true,
                )
              }
            />
            <AdminButton
              label="Réactiver"
              variant="soft"
              disabled={busy || !club.suspended}
              onPress={() =>
                confirmAdminAction('Réactiver ?', '', () =>
                  run(() => adminService.updateClub(club.id, { suspended: false }, actorUid)),
                )
              }
            />
            <AdminButton
              label="Supprimer"
              variant="danger"
              disabled={busy}
              onPress={() =>
                confirmAdminAction(
                  'Supprimer le club ?',
                  'Irréversible.',
                  () =>
                    run(async () => {
                      await adminService.deleteClub(club.id);
                      onClose();
                    }),
                  true,
                )
              }
            />
          </View>
        </AdminCard>

        <AdminCard>
          <AdminText variant="h2">Comptes liés · {relatedUsers.length}</AdminText>
          {relatedUsers.slice(0, 20).map((u) => (
            <AdminText key={u.uid} variant="caption" color={t.muted}>
              {getRoleLabel(u.role)} · {u.display_name} · {u.email}
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
        autoCapitalize="none"
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
    borderRadius: adminRadius.md,
    borderWidth: 1,
  },
  bulkBar: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  row: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  logo: { width: 40, height: 40, borderRadius: 8 },
  logoFallback: { alignItems: 'center', justifyContent: 'center' },
  logoPreview: { width: 72, height: 72, alignSelf: 'flex-start', marginBottom: 8 },
  swatches: { flexDirection: 'row', gap: 8 },
  swatch: { width: 28, height: 28, borderRadius: 6 },
  editorRoot: { flex: 1 },
  editorBody: { padding: adminSpace.lg, gap: adminSpace.md, paddingBottom: 48 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
});
