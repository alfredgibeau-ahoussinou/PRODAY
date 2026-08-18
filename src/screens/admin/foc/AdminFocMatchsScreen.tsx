import React, { useState, useMemo, useCallback } from 'react';
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
import type { FriendlyMatch, FriendlyMatchStatus } from '../../../models/FriendlyMatch';
import { FRIENDLY_STATUS_LABELS } from '../../../models/FriendlyMatch';
import { adminChrome } from '../../../theme/adminTheme';
import { spacing, radius } from '../../../theme/designTokens';
import { Icon } from '../../../components/ui/Icon';

type FilterId = 'tous' | 'avenir' | 'termines' | 'invitations';

const FILTERS: { id: FilterId; label: string }[] = [
  { id: 'tous', label: 'Tous' },
  { id: 'avenir', label: 'À venir' },
  { id: 'termines', label: 'Terminés' },
  { id: 'invitations', label: 'Invitations' },
];

const AVENIR_STATUSES: FriendlyMatchStatus[] = ['OPEN', 'INVITED', 'ACCEPTED'];
const TERMINES_STATUSES: FriendlyMatchStatus[] = ['PLAYED'];
const INVITATION_STATUSES: FriendlyMatchStatus[] = ['INVITED', 'COUNTERED'];

function filterMatches(matches: FriendlyMatch[], filter: FilterId): FriendlyMatch[] {
  switch (filter) {
    case 'avenir':
      return matches.filter((m) => AVENIR_STATUSES.includes(m.status));
    case 'termines':
      return matches.filter((m) => TERMINES_STATUSES.includes(m.status));
    case 'invitations':
      return matches.filter((m) => INVITATION_STATUSES.includes(m.status));
    default:
      return matches;
  }
}

function statusColor(status: FriendlyMatchStatus): string {
  switch (status) {
    case 'ACCEPTED':
      return adminChrome.success;
    case 'INVITED':
    case 'COUNTERED':
      return adminChrome.warning;
    case 'PLAYED':
      return adminChrome.textMuted;
    case 'DECLINED':
    case 'CANCELLED':
      return adminChrome.danger;
    default:
      return adminChrome.accent;
  }
}

function formatMatchDate(date: Date): string {
  try {
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(date instanceof Date ? date : new Date(date));
  } catch {
    return '—';
  }
}

/* ─── Card ──────────────────────────────────────────────────────────── */

type CardProps = {
  match: FriendlyMatch;
  onPress: (match: FriendlyMatch) => void;
};

function AdminFocMatchCard({ match, onPress }: CardProps) {
  const color = statusColor(match.status);
  const label = FRIENDLY_STATUS_LABELS[match.status] ?? match.status;

  return (
    <Pressable
      onPress={() => onPress(match)}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      accessibilityRole="button"
    >
      <View style={styles.cardHeader}>
        <View style={[styles.statusDot, { backgroundColor: color }]} />
        <Text style={styles.statusText} numberOfLines={1}>
          {label}
        </Text>
        <Icon name="chevron-forward" size={14} color={adminChrome.textMuted} />
      </View>

      <View style={styles.cardBody}>
        <View style={styles.clubRow}>
          <Icon name="business" size={13} color={adminChrome.textMuted} />
          <Text style={styles.clubName} numberOfLines={1}>
            {match.requester_club_name}
          </Text>
          {match.opponent_club_name ? (
            <>
              <Text style={styles.vsText}>vs</Text>
              <Text style={styles.clubName} numberOfLines={1}>
                {match.opponent_club_name}
              </Text>
            </>
          ) : null}
        </View>

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Icon name="calendar" size={12} color={adminChrome.textMuted} />
            <Text style={styles.metaText}>{formatMatchDate(match.date)}</Text>
          </View>
          {match.time_label ? (
            <View style={styles.metaItem}>
              <Icon name="time" size={12} color={adminChrome.textMuted} />
              <Text style={styles.metaText}>{match.time_label}</Text>
            </View>
          ) : null}
          <View style={styles.metaItem}>
            <Icon name="location" size={12} color={adminChrome.textMuted} />
            <Text style={styles.metaText}>{match.city}</Text>
          </View>
        </View>

        <View style={styles.tagRow}>
          <View style={styles.tag}>
            <Text style={styles.tagText}>{match.category}</Text>
          </View>
          <View style={styles.tag}>
            <Text style={styles.tagText}>{match.level}</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

/* ─── Screen ────────────────────────────────────────────────────────── */

export function AdminFocMatchsScreen() {
  const { matches, refresh, refreshing } = useAdminData();
  const [filter, setFilter] = useState<FilterId>('tous');

  const filtered = useMemo(
    () => filterMatches(matches ?? [], filter),
    [matches, filter],
  );

  const handleMatchPress = useCallback((match: FriendlyMatch) => {
    const isInvited = match.status === 'INVITED' || match.status === 'COUNTERED';

    const actions: Parameters<typeof Alert.alert>[2] = [
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: () => {
          Alert.alert(
            'Supprimer ce match ?',
            `Supprimer le match de ${match.requester_club_name} du ${formatMatchDate(match.date)} ?`,
            [
              { text: 'Annuler', style: 'cancel' },
              {
                text: 'Supprimer',
                style: 'destructive',
                onPress: async () => {
                  try {
                    await adminService.deleteFriendlyMatch(match.id);
                    void refresh();
                  } catch {
                    Alert.alert('Erreur', 'Impossible de supprimer ce match.');
                  }
                },
              },
            ],
          );
        },
      },
      { text: 'Fermer', style: 'cancel' },
    ];

    const statusLabel = FRIENDLY_STATUS_LABELS[match.status] ?? match.status;
    const opponentLabel = match.opponent_club_name
      ? ` vs ${match.opponent_club_name}`
      : '';

    const title = `${match.requester_club_name}${opponentLabel}`;
    const message =
      `Statut : ${statusLabel}\n` +
      `Date : ${formatMatchDate(match.date)}${match.time_label ? ` à ${match.time_label}` : ''}\n` +
      `Lieu : ${match.city}\n` +
      `Catégorie : ${match.category} — ${match.level}`;

    Alert.alert(title, message, actions, { cancelable: true });

    void isInvited;
  }, [refresh]);

  return (
    <View style={styles.root}>
      {/* Filters */}
      <View style={styles.filterBar}>
        {FILTERS.map((f) => {
          const on = filter === f.id;
          return (
            <Pressable
              key={f.id}
              onPress={() => setFilter(f.id)}
              style={[styles.chip, on && styles.chipOn]}
            >
              <Text style={[styles.chipText, on && styles.chipTextOn]}>
                {f.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(m) => m.id}
        renderItem={({ item }) => (
          <AdminFocMatchCard match={item} onPress={handleMatchPress} />
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={adminChrome.accent} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Icon name="football" size={32} color={adminChrome.textMuted} />
            <Text style={styles.emptyTitle}>Aucun match trouvé</Text>
            <Text style={styles.emptySub}>
              {filter === 'tous'
                ? 'Aucun match amical n\'est enregistré sur la plateforme.'
                : 'Aucun match ne correspond à ce filtre.'}
            </Text>
          </View>
        }
        contentContainerStyle={
          filtered.length === 0
            ? styles.emptyContainer
            : styles.listContent
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: adminChrome.band },
  filterBar: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: adminChrome.shell,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: adminChrome.shellBorder,
    flexWrap: 'wrap',
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: adminChrome.shellBorder,
    backgroundColor: adminChrome.shell,
  },
  chipOn: {
    backgroundColor: adminChrome.accent,
    borderColor: adminChrome.accent,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '700',
    color: adminChrome.textMuted,
  },
  chipTextOn: { color: '#FFFFFF' },
  listContent: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  empty: {
    alignItems: 'center',
    gap: spacing.md,
    paddingTop: spacing.xl * 2,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: adminChrome.text,
  },
  emptySub: {
    fontSize: 13,
    color: adminChrome.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  card: {
    backgroundColor: adminChrome.shell,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: adminChrome.shellBorder,
    overflow: 'hidden',
    shadowColor: adminChrome.cardShadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 1,
  },
  cardPressed: { opacity: 0.82 },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: 9,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: adminChrome.shellBorder,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    flex: 1,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
    color: adminChrome.textMuted,
    textTransform: 'uppercase',
  },
  cardBody: {
    padding: spacing.md,
    gap: spacing.xs,
  },
  clubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  clubName: {
    fontSize: 15,
    fontWeight: '700',
    color: adminChrome.text,
    flexShrink: 1,
  },
  vsText: {
    fontSize: 11,
    fontWeight: '600',
    color: adminChrome.textMuted,
    marginHorizontal: 2,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginTop: 2,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: adminChrome.textMuted,
    fontWeight: '500',
  },
  tagRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: 4,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 5,
    backgroundColor: adminChrome.shellElevated,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: adminChrome.shellBorder,
  },
  tagText: {
    fontSize: 10,
    fontWeight: '700',
    color: adminChrome.textMuted,
    letterSpacing: 0.3,
  },
  separator: { height: spacing.sm },
});
