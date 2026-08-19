import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  Alert,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { useAdminData } from '../../../context/AdminDataContext';
import { adminService } from '../../../services/admin.service';
import type { AdminTeam } from '../../../services/admin.service';
import { ADMIN_FOC_TABS } from '../../../navigation/adminFocConfig';
import { AdminFocTabs, AdminFocPageHeader } from '../../../components/admin/foc/AdminFocTabs';
import { AdminButton } from '../../../components/admin/AdminButton';
import { Icon } from '../../../components/ui/Icon';
import { getRoleLabel } from '../../signup/signupFlowConfig';
import { adminChrome } from '../../../theme/adminTheme';
import { spacing, radius } from '../../../theme/designTokens';
import type { Club } from '../../../models/Club';
import type { User } from '../../../models/User';

const TABS = ADMIN_FOC_TABS.clubs;
type TabId = (typeof TABS)[number]['id'];

function resolveClubTab(initial?: string): TabId {
  if (initial === 'clubs') return 'all';
  if (initial && TABS.some((t) => t.id === initial)) return initial as TabId;
  return 'all';
}

function userClubId(user: User): string | undefined {
  return user.profile?.club_id;
}

/* ─── Club Row ──────────────────────────────────────────────────────── */

function ClubRow({
  club,
  memberCount,
  onOpen,
}: {
  club: Club;
  memberCount: number;
  onOpen: (club: Club) => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [s.row, pressed && s.rowPressed]}
      onPress={() => onOpen(club)}
      accessibilityRole="button"
      accessibilityLabel={`Ouvrir ${club.name}`}
    >
      <View style={s.rowMain}>
        <Text style={s.rowTitle} numberOfLines={1}>{club.name}</Text>
        <Text style={s.rowSub} numberOfLines={1}>
          {[club.city, club.department].filter(Boolean).join(' · ') || '—'}
          {` · ${memberCount} personne${memberCount !== 1 ? 's' : ''}`}
        </Text>
      </View>
      <View style={[s.badge, club.verified ? s.badgePaid : s.badgePending]}>
        <Text style={[s.badgeText, club.verified ? s.badgePaidText : s.badgePendingText]}>
          {club.verified ? 'Vérifié' : 'À valider'}
        </Text>
      </View>
      <Icon name="chevron-forward" size={14} color={adminChrome.textMuted} />
    </Pressable>
  );
}

/* ─── Team Row ──────────────────────────────────────────────────────── */

function TeamRow({
  team,
  clubName,
  onDelete,
}: {
  team: AdminTeam;
  clubName: string;
  onDelete: (id: string, name: string) => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [s.row, pressed && s.rowPressed]}
      onPress={() => {
        Alert.alert(
          team.name,
          [clubName, team.category].filter(Boolean).join(' · ') || '—',
          [
            {
              text: 'Supprimer l\'équipe',
              style: 'destructive',
              onPress: () => onDelete(team.id, team.name),
            },
            { text: 'Fermer', style: 'cancel' },
          ],
          { cancelable: true },
        );
      }}
    >
      <View style={s.rowMain}>
        <Text style={s.rowTitle} numberOfLines={1}>{team.name}</Text>
        <Text style={s.rowSub} numberOfLines={1}>
          {[clubName, team.category].filter(Boolean).join(' · ') || '—'}
        </Text>
      </View>
      <Icon name="chevron-forward" size={14} color={adminChrome.textMuted} />
    </Pressable>
  );
}

/* ─── Club detail ───────────────────────────────────────────────────── */

function ClubDetail({
  club,
  members,
  events,
  busy,
  onBack,
  onVerify,
  onDelete,
}: {
  club: Club;
  members: User[];
  events: { id: string; title: string }[];
  busy: boolean;
  onBack: () => void;
  onVerify: (next: boolean) => void;
  onDelete: () => void;
}) {
  const dirigeants = members.filter((u) => u.role === 'club');
  const coachs = members.filter((u) => u.role === 'coach');
  const joueurs = members.filter((u) => u.role === 'player');
  const others = members.filter((u) => !['club', 'coach', 'player'].includes(u.role));

  return (
    <View style={s.root}>
      <AdminFocPageHeader
        title={club.name}
        subtitle={[club.city, club.department].filter(Boolean).join(' · ') || 'Club'}
      />
      <ScrollView contentContainerStyle={s.detail} showsVerticalScrollIndicator={false}>
        <AdminButton
          label="Retour à la liste"
          variant="ghost"
          size="sm"
          icon="arrow-back"
          onPress={onBack}
        />
        <View style={[s.badge, club.verified ? s.badgePaid : s.badgePending, s.badgeSelf]}>
          <Text style={[s.badgeText, club.verified ? s.badgePaidText : s.badgePendingText]}>
            {club.verified ? 'Club vérifié' : 'Club non vérifié'}
          </Text>
        </View>
        <AdminButton
          label={club.verified ? 'Retirer la validation' : 'Valider le club'}
          variant={club.verified ? 'secondary' : 'primary'}
          loading={busy}
          disabled={busy}
          onPress={() => onVerify(!club.verified)}
        />
        <AdminButton
          label="Supprimer le club"
          variant="danger"
          loading={busy}
          disabled={busy}
          onPress={onDelete}
        />

        <Text style={s.section}>Personnes liées ({members.length})</Text>
        {members.length === 0 ? (
          <Text style={s.emptySub}>Aucun profil avec ce club_id.</Text>
        ) : (
          <>
            {dirigeants.length > 0 ? (
              <Text style={s.groupLabel}>Dirigeants · {dirigeants.length}</Text>
            ) : null}
            {dirigeants.map((u) => (
              <Text key={u.uid} style={s.memberLine}>
                {u.display_name} · {u.email}
              </Text>
            ))}
            {coachs.length > 0 ? <Text style={s.groupLabel}>Coachs · {coachs.length}</Text> : null}
            {coachs.map((u) => (
              <Text key={u.uid} style={s.memberLine}>
                {u.display_name} · {getRoleLabel(u.role)}
              </Text>
            ))}
            {joueurs.length > 0 ? <Text style={s.groupLabel}>Joueurs · {joueurs.length}</Text> : null}
            {joueurs.map((u) => (
              <Text key={u.uid} style={s.memberLine}>
                {u.display_name} · {u.email}
              </Text>
            ))}
            {others.map((u) => (
              <Text key={u.uid} style={s.memberLine}>
                {u.display_name} · {getRoleLabel(u.role)}
              </Text>
            ))}
          </>
        )}

        <Text style={s.section}>Événements liés ({events.length})</Text>
        {events.length === 0 ? (
          <Text style={s.emptySub}>Aucun événement rattaché à ce club.</Text>
        ) : (
          events.slice(0, 12).map((e) => (
            <Text key={e.id} style={s.memberLine}>{e.title}</Text>
          ))
        )}
      </ScrollView>
    </View>
  );
}

/* ─── Screen ────────────────────────────────────────────────────────── */

export function AdminFocClubsScreen({ initialTab }: { initialTab?: string } = {}) {
  const { clubs, users, events, refresh, refreshing } = useAdminData();
  const [tab, setTab] = useState<TabId>(resolveClubTab(initialTab));

  useEffect(() => {
    setTab(resolveClubTab(initialTab));
  }, [initialTab]);
  const [teams, setTeams] = useState<AdminTeam[]>([]);
  const [loadingTeams, setLoadingTeams] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const membersByClub = useMemo(() => {
    const map: Record<string, User[]> = {};
    for (const u of users) {
      const id = userClubId(u);
      if (!id) continue;
      if (!map[id]) map[id] = [];
      map[id].push(u);
    }
    for (const club of clubs) {
      if (!club.owner_uid) continue;
      const owner = users.find((u) => u.uid === club.owner_uid);
      if (!owner) continue;
      if (!map[club.id]) map[club.id] = [];
      if (!map[club.id].some((u) => u.uid === owner.uid)) {
        map[club.id].unshift(owner);
      }
    }
    return map;
  }, [users, clubs]);

  const selected = clubs.find((c) => c.id === selectedId) ?? null;

  const loadTeams = useCallback(async () => {
    setLoadingTeams(true);
    try {
      const list = await adminService.listAllTeams(200);
      setTeams(list);
    } finally {
      setLoadingTeams(false);
    }
  }, []);

  useEffect(() => {
    if (tab === 'teams') void loadTeams();
  }, [tab, loadTeams]);

  const handleRefresh = useCallback(async () => {
    await refresh();
    if (tab === 'teams') await loadTeams();
  }, [refresh, tab, loadTeams]);

  const handleVerify = useCallback(
    async (club: Club, next: boolean) => {
      setBusy(true);
      try {
        await adminService.updateClubVerified(club.id, next);
        await refresh();
        Alert.alert(
          next ? 'Club validé' : 'Validation retirée',
          next
            ? `${club.name} est maintenant vérifié.`
            : `${club.name} n’est plus marqué comme vérifié.`,
        );
      } catch {
        Alert.alert('Erreur', 'Impossible de mettre à jour ce club.');
      } finally {
        setBusy(false);
      }
    },
    [refresh],
  );

  const handleDeleteClub = useCallback(
    (id: string, name: string) => {
      Alert.alert(
        'Supprimer ce club ?',
        `${name} — cette action est irréversible.`,
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Supprimer',
            style: 'destructive',
            onPress: async () => {
              setBusy(true);
              try {
                await adminService.deleteClub(id);
                setSelectedId(null);
                await refresh();
                Alert.alert('Club supprimé', `${name} a été retiré.`);
              } catch {
                Alert.alert('Erreur', 'Impossible de supprimer ce club.');
              } finally {
                setBusy(false);
              }
            },
          },
        ],
      );
    },
    [refresh],
  );

  const handleDeleteTeam = useCallback(
    (id: string, name: string) => {
      Alert.alert(
        'Supprimer cette équipe ?',
        `${name} — cette action est irréversible.`,
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Supprimer',
            style: 'destructive',
            onPress: async () => {
              try {
                await adminService.deleteTeam(id);
                await loadTeams();
                Alert.alert('Équipe supprimée', `${name} a été retirée.`);
              } catch {
                Alert.alert('Erreur', 'Impossible de supprimer cette équipe.');
              }
            },
          },
        ],
      );
    },
    [loadTeams],
  );

  const lastEventByClub = useMemo(() => {
    const map = new Map<string, Date>();
    for (const e of events) {
      if (!e.club_id) continue;
      const prev = map.get(e.club_id);
      if (!prev || e.starts_at > prev) map.set(e.club_id, e.starts_at);
    }
    return map;
  }, [events]);

  const visibleClubs = useMemo(() => {
    if (tab === 'validation') return clubs.filter((c) => !c.verified);
    return clubs;
  }, [clubs, tab]);

  const coaches = useMemo(
    () => users.filter((u) => u.role === 'coach'),
    [users],
  );

  const headerCopy = useMemo(() => {
    switch (tab) {
      case 'validation':
        return { title: 'Validation', sub: `${visibleClubs.length} club${visibleClubs.length === 1 ? '' : 's'} non vérifié${visibleClubs.length === 1 ? '' : 's'}` };
      case 'activity':
        return { title: 'Activité', sub: `${clubs.length} club${clubs.length === 1 ? '' : 's'} · dernier événement connu` };
      case 'teams':
        return { title: 'Équipes', sub: `${teams.length} équipe${teams.length === 1 ? '' : 's'}` };
      case 'coaches':
        return { title: 'Coachs', sub: `${coaches.length} coach${coaches.length === 1 ? '' : 's'}` };
      default:
        return { title: 'Clubs', sub: `${clubs.length} club${clubs.length === 1 ? '' : 's'}` };
    }
  }, [tab, visibleClubs.length, clubs.length, teams.length, coaches.length]);

  if (selected) {
    const clubEvents = events
      .filter((e) => e.club_id === selected.id)
      .map((e) => ({ id: e.id, title: e.title }));
    return (
      <ClubDetail
        club={selected}
        members={membersByClub[selected.id] ?? []}
        events={clubEvents}
        busy={busy}
        onBack={() => setSelectedId(null)}
        onVerify={(next) => void handleVerify(selected, next)}
        onDelete={() => handleDeleteClub(selected.id, selected.name)}
      />
    );
  }

  const isRefreshing = refreshing || loadingTeams;

  return (
    <View style={s.root}>
      <AdminFocPageHeader title={headerCopy.title} subtitle={headerCopy.sub} />
      <AdminFocTabs tabs={TABS} value={tab} onChange={(id) => setTab(id as TabId)} />

      {tab === 'teams' ? (
        <FlatList
          data={teams}
          keyExtractor={(t) => t.id}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={adminChrome.accent} />
          }
          renderItem={({ item }) => (
            <TeamRow
              team={item}
              clubName={clubs.find((c) => c.id === item.club_id)?.name ?? item.club_id}
              onDelete={handleDeleteTeam}
            />
          )}
          ItemSeparatorComponent={() => <View style={s.sep} />}
          ListEmptyComponent={
            <View style={s.empty}>
              <Icon name="people" size={32} color={adminChrome.textMuted} />
              <Text style={s.emptyTitle}>Aucune équipe</Text>
              <Text style={s.emptySub}>Aucune équipe enregistrée sur la plateforme.</Text>
            </View>
          }
          contentContainerStyle={teams.length === 0 ? s.emptyContainer : s.list}
          showsVerticalScrollIndicator={false}
        />
      ) : tab === 'coaches' ? (
        <FlatList
          data={coaches}
          keyExtractor={(u) => u.uid}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={adminChrome.accent} />
          }
          renderItem={({ item }) => (
            <View style={s.row}>
              <View style={s.rowMain}>
                <Text style={s.rowTitle} numberOfLines={1}>{item.display_name}</Text>
                <Text style={s.rowSub} numberOfLines={1}>
                  {item.email}
                  {item.profile?.club_id
                    ? ` · ${clubs.find((c) => c.id === item.profile?.club_id)?.name ?? item.profile.club_id}`
                    : ''}
                </Text>
              </View>
            </View>
          )}
          ItemSeparatorComponent={() => <View style={s.sep} />}
          ListEmptyComponent={
            <View style={s.empty}>
              <Icon name="person" size={32} color={adminChrome.textMuted} />
              <Text style={s.emptyTitle}>Aucun coach</Text>
              <Text style={s.emptySub}>Aucun compte rôle coach.</Text>
            </View>
          }
          contentContainerStyle={coaches.length === 0 ? s.emptyContainer : s.list}
        />
      ) : (
        <FlatList
          data={visibleClubs}
          keyExtractor={(c) => c.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={adminChrome.accent} />
          }
          renderItem={({ item }) => (
            <View>
              <ClubRow
                club={item}
                memberCount={(membersByClub[item.id] ?? []).length}
                onOpen={(c) => setSelectedId(c.id)}
              />
              {tab === 'activity' ? (
                <Text style={s.activityHint}>
                  {lastEventByClub.get(item.id)
                    ? `Dernier événement : ${lastEventByClub.get(item.id)!.toLocaleDateString('fr-FR')}`
                    : 'Aucun événement daté pour ce club.'}
                </Text>
              ) : null}
            </View>
          )}
          ItemSeparatorComponent={() => <View style={s.sep} />}
          ListEmptyComponent={
            <View style={s.empty}>
              <Icon name="business" size={32} color={adminChrome.textMuted} />
              <Text style={s.emptyTitle}>{tab === 'validation' ? 'Rien à valider' : 'Aucun club'}</Text>
              <Text style={s.emptySub}>
                {tab === 'validation'
                  ? 'Tous les clubs chargés sont déjà vérifiés.'
                  : 'Aucun club enregistré sur la plateforme.'}
              </Text>
            </View>
          }
          contentContainerStyle={visibleClubs.length === 0 ? s.emptyContainer : s.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: adminChrome.band },
  list: { paddingBottom: 80 },
  detail: { padding: spacing.md, gap: spacing.sm, paddingBottom: 80 },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  empty: { alignItems: 'center', gap: spacing.md, paddingTop: spacing.xl * 2 },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: adminChrome.text },
  emptySub: { fontSize: 13, color: adminChrome.textMuted, textAlign: 'center', lineHeight: 20 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    backgroundColor: adminChrome.shell,
  },
  rowPressed: { backgroundColor: adminChrome.rowHover },
  rowMain: { flex: 1, minWidth: 0, gap: 2 },
  rowTitle: { fontSize: 14, fontWeight: '700', color: adminChrome.text },
  rowSub: { fontSize: 12, color: adminChrome.textMuted },
  sep: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: adminChrome.shellBorder,
    marginLeft: spacing.md,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
  },
  badgeSelf: { alignSelf: 'flex-start' },
  badgePaid: {
    backgroundColor: 'rgba(22,101,52,0.12)',
    borderColor: 'rgba(22,101,52,0.35)',
  },
  badgePending: {
    backgroundColor: adminChrome.shellMid,
    borderColor: adminChrome.shellBorder,
  },
  badgeText: { fontSize: 11, fontWeight: '700' },
  badgePaidText: { color: adminChrome.pitch },
  badgePendingText: { color: adminChrome.textMuted },
  section: {
    marginTop: spacing.md,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: adminChrome.textMuted,
  },
  groupLabel: {
    marginTop: spacing.xs,
    fontSize: 12,
    fontWeight: '800',
    color: adminChrome.accent,
  },
  memberLine: { fontSize: 13, color: adminChrome.text, lineHeight: 20 },
  activityHint: {
    paddingHorizontal: spacing.md,
    paddingBottom: 10,
    fontSize: 12,
    color: adminChrome.textMuted,
  },
});
