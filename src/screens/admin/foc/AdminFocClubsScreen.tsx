import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  Alert,
  RefreshControl,
} from 'react-native';
import { useAdminData } from '../../../context/AdminDataContext';
import { adminService } from '../../../services/admin.service';
import type { AdminTeam } from '../../../services/admin.service';
import { ADMIN_FOC_TABS } from '../../../navigation/adminFocConfig';
import { AdminFocTabs, AdminFocPageHeader } from '../../../components/admin/foc/AdminFocTabs';
import { Icon } from '../../../components/ui/Icon';
import { adminChrome } from '../../../theme/adminTheme';
import { spacing, radius } from '../../../theme/designTokens';
import type { Club } from '../../../models/Club';

const TABS = ADMIN_FOC_TABS.clubs;
type TabId = (typeof TABS)[number]['id'];

/* ─── Club Row ──────────────────────────────────────────────────────── */

function ClubRow({ club, onDelete }: { club: Club; onDelete: (id: string, name: string) => void }) {
  return (
    <Pressable
      style={({ pressed }) => [s.row, pressed && s.rowPressed]}
      onPress={() => {
        Alert.alert(
          club.name,
          [club.city, club.department].filter(Boolean).join(' · ') || 'Aucune info',
          [
            {
              text: 'Supprimer le club',
              style: 'destructive',
              onPress: () => onDelete(club.id, club.name),
            },
            { text: 'Fermer', style: 'cancel' },
          ],
          { cancelable: true },
        );
      }}
    >
      <View style={s.rowMain}>
        <Text style={s.rowTitle} numberOfLines={1}>{club.name}</Text>
        <Text style={s.rowSub} numberOfLines={1}>
          {[club.city, club.department].filter(Boolean).join(' · ') || '—'}
        </Text>
      </View>
      <Icon name="chevron-forward" size={14} color={adminChrome.textMuted} />
    </Pressable>
  );
}

/* ─── Team Row ──────────────────────────────────────────────────────── */

function TeamRow({ team, onDelete }: { team: AdminTeam; onDelete: (id: string, name: string) => void }) {
  return (
    <Pressable
      style={({ pressed }) => [s.row, pressed && s.rowPressed]}
      onPress={() => {
        Alert.alert(
          team.name,
          [team.category, team.club_id].filter(Boolean).join(' · ') || '—',
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
          {team.category || '—'}
        </Text>
      </View>
      <Icon name="chevron-forward" size={14} color={adminChrome.textMuted} />
    </Pressable>
  );
}

/* ─── Screen ────────────────────────────────────────────────────────── */

export function AdminFocClubsScreen() {
  const { clubs, refresh, refreshing } = useAdminData();
  const [tab, setTab] = useState<TabId>('clubs');
  const [teams, setTeams] = useState<AdminTeam[]>([]);
  const [loadingTeams, setLoadingTeams] = useState(false);
  const styles = useMemo(() => s, []);
  void styles;

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
              try {
                await adminService.deleteClub(id);
                void refresh();
              } catch {
                Alert.alert('Erreur', 'Impossible de supprimer ce club.');
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
                void loadTeams();
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

  const isRefreshing = refreshing || loadingTeams;

  return (
    <View style={s.root}>
      <AdminFocPageHeader
        title={tab === 'clubs' ? 'Clubs' : 'Équipes'}
        subtitle={
          tab === 'clubs'
            ? `${clubs.length} club${clubs.length !== 1 ? 's' : ''}`
            : `${teams.length} équipe${teams.length !== 1 ? 's' : ''}`
        }
      />
      <AdminFocTabs tabs={TABS} value={tab} onChange={(id) => setTab(id as TabId)} />

      {tab === 'clubs' ? (
        <FlatList
          data={clubs}
          keyExtractor={(c) => c.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={adminChrome.accent} />
          }
          renderItem={({ item }) => (
            <ClubRow club={item} onDelete={handleDeleteClub} />
          )}
          ItemSeparatorComponent={() => <View style={s.sep} />}
          ListEmptyComponent={
            <View style={s.empty}>
              <Icon name="business" size={32} color={adminChrome.textMuted} />
              <Text style={s.emptyTitle}>Aucun club</Text>
              <Text style={s.emptySub}>Aucun club enregistré sur la plateforme.</Text>
            </View>
          }
          contentContainerStyle={clubs.length === 0 ? s.emptyContainer : s.list}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <FlatList
          data={teams}
          keyExtractor={(t) => t.id}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={adminChrome.accent} />
          }
          renderItem={({ item }) => (
            <TeamRow team={item} onDelete={handleDeleteTeam} />
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
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: adminChrome.band },
  list: { paddingBottom: 80 },
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
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
    backgroundColor: adminChrome.shellMid,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: adminChrome.shellBorder,
  },
  tagText: { fontSize: 11, fontWeight: '700', color: adminChrome.textMuted },
  sep: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: adminChrome.shellBorder,
    marginLeft: spacing.md,
  },
});
