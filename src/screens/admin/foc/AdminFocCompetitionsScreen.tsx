import React, { useMemo, useState } from 'react';
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
import { ADMIN_FOC_SCREEN_TABS } from '../../../navigation/adminFocConfig';
import { AdminFocTabs, AdminFocPageHeader } from '../../../components/admin/foc/AdminFocTabs';
import { Icon } from '../../../components/ui/Icon';
import { adminChrome } from '../../../theme/adminTheme';
import { spacing, radius } from '../../../theme/designTokens';
import type { TeamEvent } from '../../../models/TeamEvent';
import type { AdminTournament } from '../../../services/admin.service';

const TABS = ADMIN_FOC_SCREEN_TABS.competitions;
type TabId = (typeof TABS)[number]['id'];

function formatDate(d: Date | null | undefined): string {
  if (!d) return '—';
  try {
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(d instanceof Date ? d : new Date(d));
  } catch {
    return '—';
  }
}

/* ─── Event card ────────────────────────────────────────────────────── */

function EventCard({ event, onDelete }: { event: TeamEvent; onDelete: (id: string) => void }) {
  return (
    <Pressable
      style={({ pressed }) => [s.card, pressed && s.cardPressed]}
      onPress={() => {
        Alert.alert(
          event.title,
          [event.city, event.event_type, formatDate(event.starts_at)].filter(Boolean).join(' · '),
          [
            {
              text: 'Supprimer',
              style: 'destructive',
              onPress: () => onDelete(event.id),
            },
            { text: 'Fermer', style: 'cancel' },
          ],
          { cancelable: true },
        );
      }}
    >
      <View style={s.cardHeader}>
        <Text style={s.cardTitle} numberOfLines={1}>{event.title}</Text>
        {event.city ? <Text style={s.cardCity} numberOfLines={1}>{event.city}</Text> : null}
      </View>
      <View style={s.cardMeta}>
        <View style={s.metaItem}>
          <Icon name="calendar" size={12} color={adminChrome.textMuted} />
          <Text style={s.metaText}>{formatDate(event.starts_at)}</Text>
        </View>
        {event.event_type ? (
          <View style={[s.tag]}>
            <Text style={s.tagText}>{event.event_type}</Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

/* ─── Tournament card ───────────────────────────────────────────────── */

function TournamentCard({
  tournament,
  onDelete,
}: {
  tournament: AdminTournament;
  onDelete: (id: string) => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [s.card, pressed && s.cardPressed]}
      onPress={() => {
        Alert.alert(
          tournament.name,
          [tournament.city, tournament.status].filter(Boolean).join(' · ') || '—',
          [
            {
              text: 'Supprimer',
              style: 'destructive',
              onPress: () => onDelete(tournament.id),
            },
            { text: 'Fermer', style: 'cancel' },
          ],
          { cancelable: true },
        );
      }}
    >
      <View style={s.cardHeader}>
        <Text style={s.cardTitle} numberOfLines={1}>{tournament.name}</Text>
        {tournament.city ? (
          <Text style={s.cardCity} numberOfLines={1}>{tournament.city}</Text>
        ) : null}
      </View>
      <View style={s.cardMeta}>
        {tournament.status ? (
          <View style={[s.tag, tournamentStatusStyle(tournament.status)]}>
            <Text style={[s.tagText, tournamentStatusTextStyle(tournament.status)]}>
              {tournament.status}
            </Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

function tournamentStatusStyle(status: string): object {
  if (status === 'published') return { backgroundColor: adminChrome.soft, borderColor: adminChrome.accentMuted };
  if (status === 'cancelled') return { backgroundColor: 'rgba(225,29,72,0.08)', borderColor: 'rgba(225,29,72,0.3)' };
  return {};
}

function tournamentStatusTextStyle(status: string): object {
  if (status === 'published') return { color: adminChrome.accent };
  if (status === 'cancelled') return { color: adminChrome.danger };
  return { color: adminChrome.textMuted };
}

/* ─── Screen ────────────────────────────────────────────────────────── */

export function AdminFocCompetitionsScreen() {
  const { events, tournaments, refresh, refreshing } = useAdminData();
  const [tab, setTab] = useState<TabId>('events');

  const handleDeleteEvent = useMemo(
    () => (id: string) => {
      Alert.alert(
        'Supprimer cet événement ?',
        'Cette action est irréversible.',
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Supprimer',
            style: 'destructive',
            onPress: async () => {
              try {
                await adminService.deleteTeamEvent(id);
                void refresh();
              } catch {
                Alert.alert('Erreur', 'Impossible de supprimer cet événement.');
              }
            },
          },
        ],
      );
    },
    [refresh],
  );

  const handleDeleteTournament = useMemo(
    () => (id: string) => {
      Alert.alert(
        'Supprimer ce tournoi ?',
        'Cette action est irréversible.',
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Supprimer',
            style: 'destructive',
            onPress: async () => {
              try {
                await adminService.deleteTournament(id);
                void refresh();
              } catch {
                Alert.alert('Erreur', 'Impossible de supprimer ce tournoi.');
              }
            },
          },
        ],
      );
    },
    [refresh],
  );

  return (
    <View style={s.root}>
      <AdminFocPageHeader
        title="Compétitions"
        subtitle={
          tab === 'events'
            ? `${events.length} événement${events.length !== 1 ? 's' : ''}`
            : `${tournaments.length} tournoi${tournaments.length !== 1 ? 's' : ''}`
        }
      />
      <AdminFocTabs tabs={TABS} value={tab} onChange={(id) => setTab(id as TabId)} />

      {tab === 'events' ? (
        <FlatList
          data={events}
          keyExtractor={(e) => e.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={adminChrome.accent} />
          }
          renderItem={({ item }) => (
            <EventCard event={item} onDelete={handleDeleteEvent} />
          )}
          ItemSeparatorComponent={() => <View style={s.sep} />}
          ListEmptyComponent={
            <View style={s.empty}>
              <Icon name="calendar" size={32} color={adminChrome.textMuted} />
              <Text style={s.emptyTitle}>Aucun événement</Text>
              <Text style={s.emptySub}>Aucun événement enregistré.</Text>
            </View>
          }
          contentContainerStyle={events.length === 0 ? s.emptyContainer : s.list}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <FlatList
          data={tournaments}
          keyExtractor={(t) => t.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={adminChrome.accent} />
          }
          renderItem={({ item }) => (
            <TournamentCard tournament={item} onDelete={handleDeleteTournament} />
          )}
          ItemSeparatorComponent={() => <View style={s.sep} />}
          ListEmptyComponent={
            <View style={s.empty}>
              <Icon name="trophy" size={32} color={adminChrome.textMuted} />
              <Text style={s.emptyTitle}>Aucun tournoi</Text>
              <Text style={s.emptySub}>Aucun tournoi enregistré.</Text>
            </View>
          }
          contentContainerStyle={tournaments.length === 0 ? s.emptyContainer : s.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: adminChrome.band },
  list: { padding: spacing.md, gap: spacing.sm, paddingBottom: 80 },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  empty: { alignItems: 'center', gap: spacing.md, paddingTop: spacing.xl * 2 },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: adminChrome.text },
  emptySub: { fontSize: 13, color: adminChrome.textMuted, textAlign: 'center', lineHeight: 20 },
  sep: { height: spacing.sm },
  card: {
    backgroundColor: adminChrome.shell,
    borderRadius: adminChrome.radius,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: adminChrome.shellBorder,
    overflow: 'hidden',
    padding: spacing.md,
    gap: spacing.xs,
  },
  cardPressed: { opacity: 0.82 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.xs },
  cardTitle: { flex: 1, fontSize: 15, fontWeight: '700', color: adminChrome.text },
  cardCity: { fontSize: 12, color: adminChrome.textMuted },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, flexWrap: 'wrap' },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, color: adminChrome.textMuted },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
    backgroundColor: adminChrome.shellMid,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: adminChrome.shellBorder,
  },
  tagText: { fontSize: 11, fontWeight: '700', color: adminChrome.textMuted },
});
