import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import type { User } from '../models/User';
import { SearchBar } from '../components/ui/SearchBar';
import { PlayerRowCard } from '../components/ui/PlayerRowCard';
import { usePlayersDirectory } from '../hooks/usePlayersDirectory';
import { useAuth } from '../context/AuthContext';
import { useFavorites } from '../hooks/useFavorites';
import {
  DEFAULT_PLAYER_FILTERS,
  PLAYER_LEVELS_FILTER,
  PLAYER_POSITIONS_FILTER,
  countActiveFilters,
  filterPlayers,
  type PlayerListFilters,
} from '../utils/playerFilters';
import { spacing, radius } from '../theme/designTokens';
import type { AppColors } from '../theme/universeTheme';
import { useAppTheme } from '../context/ProductLineContext';
import { TabScreenShell } from '../components/app/TabScreenShell';
import { ScreenBackButton } from '../components/ui/ScreenBackButton';
import {
  scoutingScoreMap,
  sortPlayersByScouting,
  type PlayerScoutingScore,
} from '../features/v3/engines/playerScouting.engine';
import { trackV3Event } from '../core/analytics/v3Events';
import { TAB_BAR_CONTENT_INSET } from '../navigation/tabBarLayout';
import { Icon } from '../components/ui/Icon';
import { isSubScreenShellEnabled } from '../hooks/useSubScreenShell';
import { isSyntheticUser } from '../utils/realUserFilter';

interface PlayersListScreenProps {
  onBack: () => void;
  onSelectPlayer: (player: User) => void;
  initialQuery?: string;
}

export const PlayersListScreen: React.FC<PlayersListScreenProps> = ({
  onBack,
  onSelectPlayer,
  initialQuery = '',
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [filters, setFilters] = useState<PlayerListFilters>(DEFAULT_PLAYER_FILTERS);
  const [nearMe, setNearMe] = useState(false);
  const { profile } = useAuth();
  const { isFavorite, toggle } = useFavorites(profile?.uid);
  const { colors: themeColors, isWoman } = useAppTheme();
  const directory = usePlayersDirectory({
    search: query,
    city: filters.city,
    radiusKm: nearMe && profile?.location ? 50 : undefined,
    viewerLocation: nearMe ? profile?.location ?? null : null,
  });
  const { users: rawUsers, loading, loadingMore, hasMore, loadMore } = directory;
  const listTitle = isWoman ? 'Joueuses' : 'Joueurs';
  const isStaff = isSubScreenShellEnabled(profile, 'staff');

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  const filteredUsers = useMemo(() => {
    let base = filterPlayers(rawUsers, filters);
    if (
      profile?.role === 'player' &&
      profile.uid &&
      !isSyntheticUser(profile) &&
      !base.some((u) => u.uid === profile.uid)
    ) {
      base = [profile, ...base];
    }
    return base;
  }, [rawUsers, filters, profile]);

  const users = useMemo(() => {
    const base = filteredUsers;
    if (!isStaff || !profile) return base;
    return sortPlayersByScouting(profile, base);
  }, [filteredUsers, profile, isStaff]);

  const scores = useMemo(() => {
    if (!profile || !isStaff) return new Map<string, PlayerScoutingScore>();
    return scoutingScoreMap(profile, users);
  }, [profile, users, isStaff]);

  const activeFilterCount = countActiveFilters(filters);
  const soloProfile =
    profile?.role === 'player' && users.length === 1 && users[0]?.uid === profile.uid;

  const resetFilters = () => {
    setFilters(DEFAULT_PLAYER_FILTERS);
    setNearMe(false);
  };

  const handleSelectPlayer = (player: User) => {
    if (isStaff) {
      const scouting = scores.get(player.uid);
      trackV3Event('staff_player_tap', {
        playerUid: player.uid,
        scoutingScore: scouting?.score ?? 0,
      });
    }
    onSelectPlayer(player);
  };

  const listHeader = (
    <View style={styles.headerBlock}>
      <View style={[styles.infoCard, { backgroundColor: themeColors.surfaceMuted, borderColor: themeColors.border }]}>
        <View style={[styles.infoIcon, { backgroundColor: themeColors.accentSoft }]}>
          <Icon name="people" size={22} color={themeColors.brand} variant="filled" />
        </View>
        <View style={styles.infoCopy}>
          <Text style={[styles.infoTitle, { color: themeColors.text }]}>
            {soloProfile ? 'Votre profil joueur' : 'Profils inscrits sur ProDay'}
          </Text>
          <Text style={[styles.infoSub, { color: themeColors.textMuted }]}>
            {soloProfile
              ? 'Seul votre compte est visible pour le moment. Les autres joueurs apparaîtront ici après inscription.'
              : 'Comptes réels uniquement — les profils de démonstration sont exclus.'}
          </Text>
        </View>
      </View>

      <SearchBar placeholder="Nom, poste, ville…" value={query} onChangeText={setQuery} />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipRow}
      >
        <FilterChip
          label="Poste"
          active={filters.position !== 'Tous'}
          colors={themeColors}
          onPress={() => cycleFilter(PLAYER_POSITIONS_FILTER, filters.position, (position) =>
            setFilters((f) => ({ ...f, position: position as PlayerListFilters['position'] }))
          )}
          value={filters.position !== 'Tous' ? filters.position : undefined}
        />
        <FilterChip
          label="Niveau"
          active={filters.level !== 'Tous'}
          colors={themeColors}
          onPress={() => cycleFilter(PLAYER_LEVELS_FILTER, filters.level, (level) =>
            setFilters((f) => ({ ...f, level: level as PlayerListFilters['level'] }))
          )}
          value={filters.level !== 'Tous' ? filters.level : undefined}
        />
        <FilterChip
          label="Ville"
          active={Boolean(filters.city.trim())}
          colors={themeColors}
          onPress={() => {
            const next = filters.city.trim() ? '' : (profile?.city ?? '');
            setFilters((f) => ({ ...f, city: next }));
          }}
          value={filters.city.trim() || undefined}
        />
        {profile?.location ? (
          <FilterChip
            label="Rayon 50 km"
            active={nearMe}
            colors={themeColors}
            onPress={() => setNearMe((v) => !v)}
            value={nearMe ? 'Autour de moi' : undefined}
          />
        ) : null}
        {activeFilterCount > 0 || nearMe ? (
          <TouchableOpacity onPress={resetFilters} style={[styles.resetChip, { borderColor: themeColors.border }]}>
            <Text style={[styles.resetChipText, { color: themeColors.brand }]}>Réinitialiser</Text>
          </TouchableOpacity>
        ) : null}
      </ScrollView>

      {!loading && users.length > 0 ? (
        <Text style={[styles.countLine, { color: themeColors.textMuted }]}>
          {users.length} profil{users.length > 1 ? 's' : ''}
          {isStaff ? ' — tri par pertinence scouting' : ''}
        </Text>
      ) : null}
    </View>
  );

  const listBody = loading ? (
    <ActivityIndicator color={themeColors.brand} style={styles.loader} />
  ) : (
    <FlatList
      data={users}
      keyExtractor={(item) => item.uid}
      contentContainerStyle={styles.list}
      ListHeaderComponent={listHeader}
      ListFooterComponent={
        loadingMore ? (
          <ActivityIndicator color={themeColors.brand} style={styles.loader} />
        ) : null
      }
      onEndReached={() => {
        if (hasMore && !loadingMore) void loadMore();
      }}
      onEndReachedThreshold={0.4}
      renderItem={({ item }) => {
        const scouting = scores.get(item.uid);
        const isOwn = profile?.uid === item.uid;
        return (
          <PlayerRowCard
            user={item}
            onPress={handleSelectPlayer}
            bookmarked={isFavorite(item.uid)}
            onBookmark={isOwn ? undefined : () => profile && toggle(item.uid, 'player')}
            scoutingScore={scouting?.score}
            scoutingLabel={scouting?.label}
            isOwnProfile={isOwn}
          />
        );
      }}
      ListEmptyComponent={
        <View style={styles.emptyWrap}>
          <Icon name="people" size={40} color={themeColors.textMuted} />
          <Text style={[styles.emptyTitle, { color: themeColors.text }]}>
            {activeFilterCount > 0 || query.trim()
              ? 'Aucun résultat'
              : 'Annuaire vide'}
          </Text>
          <Text style={[styles.empty, { color: themeColors.textMuted }]}>
            {activeFilterCount > 0 || query.trim()
              ? isWoman
                ? 'Aucune joueuse ne correspond à vos critères.'
                : 'Aucun joueur ne correspond à vos critères.'
              : isWoman
                ? 'Aucune joueuse inscrite pour le moment.'
                : 'Aucun joueur inscrit pour le moment.'}
          </Text>
        </View>
      }
    />
  );

  return (
    <TabScreenShell
      caption="Annuaire"
      title={listTitle}
      subtitle={
        soloProfile
          ? 'Votre compte ProDay'
          : users.length > 0
            ? `${users.length} profil(s) actif(s)`
            : 'Recherche et filtres'
      }
      right={<ScreenBackButton onPress={onBack} />}
      flat
    >
      {listBody}
    </TabScreenShell>
  );
};

function cycleFilter(
  options: readonly string[],
  current: string,
  onSelect: (value: string) => void,
) {
  const idx = options.indexOf(current);
  const next = options[(idx + 1) % options.length] ?? 'Tous';
  onSelect(next);
}

const FilterChip: React.FC<{
  label: string;
  value?: string;
  active: boolean;
  colors: AppColors;
  onPress: () => void;
}> = ({ label, value, active, colors: c, onPress }) => (
  <TouchableOpacity
    onPress={onPress}
    style={[
      styles.chip,
      {
        borderColor: active ? c.brand : c.border,
        backgroundColor: active ? c.accentSoft : c.surface,
      },
    ]}
  >
    <Text style={[styles.chipLabel, { color: active ? c.brand : c.textSecondary }]}>
      {value ? `${label} · ${value}` : label}
    </Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  headerBlock: {
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  infoCard: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  infoIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoCopy: { flex: 1, gap: 4 },
  infoTitle: { fontSize: 15, fontWeight: '800' },
  infoSub: { fontSize: 13, lineHeight: 18 },
  chipRow: {
    gap: spacing.xs,
    paddingRight: spacing.lg,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  chipLabel: { fontSize: 12, fontWeight: '700' },
  resetChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
    justifyContent: 'center',
  },
  resetChipText: { fontSize: 12, fontWeight: '800' },
  countLine: {
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 2,
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: TAB_BAR_CONTENT_INSET + spacing.lg,
  },
  emptyWrap: {
    alignItems: 'center',
    marginTop: spacing.xl,
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  emptyTitle: { fontSize: 17, fontWeight: '800', marginTop: spacing.sm },
  empty: { textAlign: 'center', fontSize: 14, lineHeight: 20 },
  loader: { marginTop: 40 },
});
