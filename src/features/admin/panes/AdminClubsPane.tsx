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
import { adminService } from '../../../services/admin.service';
import { useAuth } from '../../../context/AuthContext';
import type { Club } from '../../../models/Club';
import { confirmAdminAction } from '../utils/confirmAdminAction';

type Filter = 'all' | 'verified' | 'unverified' | 'suspended' | 'new';

export function AdminClubsPane({ focusId }: { focusId?: string }) {
  const data = useAdminData();
  const { firebaseUser } = useAuth();
  const t = ADMIN_TOKENS;
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [selected, setSelected] = useState<Club | null>(null);
  const [busy, setBusy] = useState(false);

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
        c.owner_uid.toLowerCase().includes(query)
      );
    });
  }, [data.clubs, q, filter]);

  if (data.loading) return <AdminLoading />;

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <AdminText variant="h1">Clubs</AdminText>
        <AdminText variant="caption" color={t.muted}>
          {data.clubs.length} clubs · valider / suspendre / notes / archiver
        </AdminText>
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder="Nom, ville, owner…"
          placeholderTextColor={t.faint}
          style={[styles.input, { color: t.foreground, borderColor: t.border, backgroundColor: t.surface }]}
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
                  borderColor: filter === id ? t.accent : t.border,
                },
              ]}
            >
              <AdminText variant="caption" color={filter === id ? t.accentHot : t.muted}>
                {label}
              </AdminText>
            </Pressable>
          ))}
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: adminSpace.lg, gap: 8 }}
        ListEmptyComponent={<AdminEmptyState title="Aucun club" />}
        renderItem={({ item }) => (
          <Pressable onPress={() => setSelected(item)}>
            <AdminCard>
              <View style={styles.row}>
                <View style={{ flex: 1, gap: 2 }}>
                  <AdminText variant="h3">{item.name}</AdminText>
                  <AdminText variant="caption" color={t.muted}>
                    {[item.city, item.department].filter(Boolean).join(' · ') || '—'}
                  </AdminText>
                  <AdminText variant="caption" color={t.faint}>
                    Owner {item.owner_uid.slice(0, 10)}…
                  </AdminText>
                </View>
                <View style={{ gap: 4, alignItems: 'flex-end' }}>
                  {item.suspended ? <AdminBadge label="Suspendu" tone="danger" /> : null}
                  {item.archived ? <AdminBadge label="Archivé" tone="info" /> : null}
                  <AdminBadge
                    label={item.verified ? 'Validé' : 'En attente'}
                    tone={item.verified ? 'success' : 'warn'}
                  />
                </View>
              </View>
            </AdminCard>
          </Pressable>
        )}
      />

      <Modal visible={!!selected} animationType="slide" onRequestClose={() => setSelected(null)}>
        {selected ? (
          <ClubEditor
            club={selected}
            busy={busy}
            setBusy={setBusy}
            actorUid={firebaseUser?.uid ?? 'admin'}
            onClose={() => setSelected(null)}
            onRefresh={async () => {
              await data.refresh();
              const next = data.clubs.find((c) => c.id === selected.id);
              // refresh is async; re-read after
              const list = await adminService.listAllClubs(200);
              const fresh = list.find((c) => c.id === selected.id) ?? next ?? selected;
              setSelected(fresh);
            }}
          />
        ) : null}
      </Modal>
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
  const [name, setName] = useState(club.name);
  const [city, setCity] = useState(club.city);
  const [department, setDepartment] = useState(club.department ?? '');
  const [note, setNote] = useState(club.admin_note ?? '');

  useEffect(() => {
    setName(club.name);
    setCity(club.city);
    setDepartment(club.department ?? '');
    setNote(club.admin_note ?? '');
  }, [club]);

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

  const save = () =>
    confirmAdminAction('Enregistrer le club ?', 'Identité + note admin.', () =>
      run(() =>
        adminService.updateClub(
          club.id,
          {
            name,
            city,
            department: department || null,
            admin_note: note,
          },
          actorUid,
        ),
      ),
    );

  const setVerified = (verified: boolean) =>
    confirmAdminAction(
      verified ? 'Valider le club ?' : 'Retirer la validation ?',
      'Action auditée.',
      () => run(() => adminService.updateClub(club.id, { verified }, actorUid)),
      !verified,
    );

  const setSuspended = (suspended: boolean) =>
    confirmAdminAction(
      suspended ? 'Suspendre le club ?' : 'Lever la suspension ?',
      suspended
        ? 'Le club reste en base, marqué suspended=true.'
        : 'Le club redevient opérationnel.',
      () => run(() => adminService.updateClub(club.id, { suspended }, actorUid)),
      suspended,
    );

  const setArchived = (archived: boolean) =>
    confirmAdminAction(
      archived ? 'Archiver le club ?' : 'Désarchiver ?',
      'Archivage soft — pas de suppression définitive.',
      () => run(() => adminService.updateClub(club.id, { archived }, actorUid)),
      archived,
    );

  const owner = club.owner_uid;

  return (
    <View style={[styles.editorRoot, { backgroundColor: t.bg }]}>
      <View style={styles.editorHeader}>
        <AdminButton label="Fermer" variant="ghost" onPress={onClose} />
        <AdminText variant="h1">{club.name}</AdminText>
        <AdminText variant="caption" color={t.muted}>
          Owner {owner}
        </AdminText>
      </View>
      <ScrollView contentContainerStyle={styles.editorBody}>
        <AdminCard>
          <AdminText variant="h2">Identité</AdminText>
          <Field label="Nom" value={name} onChange={setName} />
          <Field label="Ville" value={city} onChange={setCity} />
          <Field label="Département" value={department} onChange={setDepartment} />
          <Field label="Note admin" value={note} onChange={setNote} multiline />
          <AdminButton label={busy ? '…' : 'Enregistrer'} disabled={busy} onPress={save} />
        </AdminCard>

        <AdminCard>
          <AdminText variant="h2">Statuts</AdminText>
          <View style={styles.badges}>
            <AdminBadge label={club.verified ? 'Validé' : 'Non validé'} tone={club.verified ? 'success' : 'warn'} />
            <AdminBadge label={club.suspended ? 'Suspendu' : 'Actif'} tone={club.suspended ? 'danger' : 'success'} />
            <AdminBadge label={club.archived ? 'Archivé' : 'Courant'} tone={club.archived ? 'info' : 'accent'} />
          </View>
          <View style={styles.actions}>
            <AdminButton label="Valider" disabled={busy || club.verified} onPress={() => setVerified(true)} />
            <AdminButton
              label="Retirer validation"
              variant="ghost"
              disabled={busy || !club.verified}
              onPress={() => setVerified(false)}
            />
            <AdminButton
              label="Suspendre"
              variant="danger"
              disabled={busy || !!club.suspended}
              onPress={() => setSuspended(true)}
            />
            <AdminButton
              label="Lever suspension"
              variant="soft"
              disabled={busy || !club.suspended}
              onPress={() => setSuspended(false)}
            />
            <AdminButton
              label="Archiver"
              variant="ghost"
              disabled={busy || !!club.archived}
              onPress={() => setArchived(true)}
            />
            <AdminButton
              label="Désarchiver"
              variant="ghost"
              disabled={busy || !club.archived}
              onPress={() => setArchived(false)}
            />
          </View>
        </AdminCard>

        <AdminCard>
          <AdminText variant="h2">Contacts</AdminText>
          <AdminText variant="body" color={t.muted}>
            Owner UID : {owner}
          </AdminText>
          <AdminText variant="caption" color={t.faint}>
            Les contacts président/coach dérivent des users liés (voir Utilisateurs / rôle club).
          </AdminText>
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
  row: { flexDirection: 'row', gap: 12 },
  editorRoot: { flex: 1, paddingTop: 48 },
  editorHeader: { paddingHorizontal: adminSpace.lg, gap: 6 },
  editorBody: { padding: adminSpace.lg, gap: adminSpace.md, paddingBottom: 48 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
});
