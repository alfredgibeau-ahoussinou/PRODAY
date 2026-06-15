import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import type { User } from '../models/User';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { SearchBar } from '../components/ui/SearchBar';
import { PlayerRowCard } from '../components/ui/PlayerRowCard';
import { useUsersByRole } from '../hooks/useRecruitmentData';
import { useAuth } from '../context/AuthContext';
import { useFavorites } from '../hooks/useFavorites';
import {
  DEFAULT_PLAYER_FILTERS,
  PLAYER_CATEGORIES_FILTER,
  PLAYER_LEVELS_FILTER,
  PLAYER_POSITIONS_FILTER,
  countActiveFilters,
  filterPlayers,
  type PlayerListFilters,
} from '../utils/playerFilters';
import { ProDayActionTiles } from '../components/ui/ProDayActionTiles';
import { spacing, radius } from '../theme/designTokens';
import type { AppColors } from '../theme/universeTheme';
import { useAppTheme } from '../context/ProductLineContext';
import { isV3ShellEnabled } from '../config/featureFlags';
import { V3TabShell } from '../components/v3/V3TabShell';
import { V3ScreenBack } from '../components/v3/V3ScreenBack';
import { useSectionIntelligence } from '../hooks/useSectionIntelligence';
import {
  scoutingScoreMap,
  sortPlayersByScouting,
  type PlayerScoutingScore,
} from '../features/v3/engines/playerScouting.engine';
import { StaggerReveal } from '../components/motion';
import { trackV3Event } from '../core/analytics/v3Events';
import { TAB_BAR_CONTENT_INSET } from '../navigation/tabBarLayout';

type FilterPanel = 'poste' | 'categorie' | 'niveau' | 'ville' | 'age' | null;

interface PlayersListScreenProps {
  onBack: () => void;
  onSelectPlayer: (player: User) => void;
}

export const PlayersListScreen: React.FC<PlayersListScreenProps> = ({
  onBack,
  onSelectPlayer,
}) => {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<PlayerListFilters>(DEFAULT_PLAYER_FILTERS);
  const [panel, setPanel] = useState<FilterPanel>(null);
  const { profile } = useAuth();
  const { isFavorite, toggle } = useFavorites(profile?.uid);
  const { colors: themeColors, productLine } = useAppTheme();
  const { users: rawUsers, loading } = useUsersByRole('player', query);
  const listTitle = productLine === 'woman' ? 'Joueuses' : 'Joueurs';
  const useV3Header = isV3ShellEnabled() && Boolean(profile && profile.role !== 'player');

  const filteredUsers = useMemo(() => filterPlayers(rawUsers, filters), [rawUsers, filters]);
  const users = useMemo(() => {
    if (!useV3Header || !profile) return filteredUsers;
    return sortPlayersByScouting(profile, filteredUsers);
  }, [filteredUsers, profile, useV3Header]);

  const scores = useMemo(() => {
    if (!profile || !useV3Header) return new Map<string, PlayerScoutingScore>();
    return scoutingScoreMap(profile, users);
  }, [profile, users, useV3Header]);

  const intelligence = useSectionIntelligence('recrutement', profile ?? null, productLine, {
    staffMode: true,
    mercatoPosts: users.length,
  });

  const activeFilterCount = countActiveFilters(filters);

  const togglePanel = (p: FilterPanel) => {
    setPanel((cur) => (cur === p ? null : p));
  };

  const resetFilters = () => {
    setFilters(DEFAULT_PLAYER_FILTERS);
    setPanel(null);
  };

  const handleSelectPlayer = (player: User) => {
    if (useV3Header) {
      const scouting = scores.get(player.uid);
      trackV3Event('staff_player_tap', {
        playerUid: player.uid,
        scoutingScore: scouting?.score ?? 0,
      });
    }
    onSelectPlayer(player);
  };

  const resetAction =
    activeFilterCount > 0 ? (
      <TouchableOpacity onPress={resetFilters} hitSlop={12}>
        <Text style={[styles.resetText, { color: themeColors.brand }]}>Réinit.</Text>
      </TouchableOpacity>
    ) : undefined;

  const filtersBlock = (
    <>
      <SearchBar placeholder="Nom, poste, ville…" value={query} onChangeText={setQuery} />

      <ProDayActionTiles
        items={[
          {
            id: 'poste',
            label: 'Poste',
            icon: 'football',
            badge: filters.position !== 'Tous' ? 1 : undefined,
          },
          {
            id: 'categorie',
            label: 'Catégorie',
            icon: 'people',
            badge: filters.category !== 'Tous' ? 1 : undefined,
          },
          {
            id: 'niveau',
            label: 'Niveau',
            icon: 'trophy',
            badge: filters.level !== 'Tous' ? 1 : undefined,
          },
          {
            id: 'ville',
            label: 'Ville',
            icon: 'location',
            badge: filters.city.trim() ? 1 : undefined,
          },
          {
            id: 'age',
            label: 'Âge max',
            icon: 'calendar',
            badge: filters.maxAge.trim() ? 1 : undefined,
          },
        ]}
        activeId={panel}
        onPress={(id) => togglePanel(id as FilterPanel)}
      />

      {panel === 'poste' ? (
        <OptionRow
          options={PLAYER_POSITIONS_FILTER}
          selected={filters.position}
          colors={themeColors}
          onSelect={(position) =>
            setFilters((f) => ({
              ...f,
              position: position as PlayerListFilters['position'],
            }))
          }
        />
      ) : null}

      {panel === 'categorie' ? (
        <OptionRow
          options={PLAYER_CATEGORIES_FILTER}
          selected={filters.category}
          colors={themeColors}
          onSelect={(category) =>
            setFilters((f) => ({
              ...f,
              category: category as PlayerListFilters['category'],
            }))
          }
        />
      ) : null}

      {panel === 'niveau' ? (
        <OptionRow
          options={PLAYER_LEVELS_FILTER}
          selected={filters.level}
          colors={themeColors}
          onSelect={(level) =>
            setFilters((f) => ({
              ...f,
              level: level as PlayerListFilters['level'],
            }))
          }
        />
      ) : null}

      {panel === 'ville' ? (
        <View style={styles.cityRow}>
          <TextInput
            style={[
              styles.cityInput,
              {
                backgroundColor: themeColors.surface,
                borderColor: themeColors.border,
                color: themeColors.text,
              },
            ]}
            placeholder="Ex. Paris, Lyon…"
            placeholderTextColor={themeColors.textMuted}
            value={filters.city}
            onChangeText={(city) => setFilters((f) => ({ ...f, city }))}
            autoCapitalize="words"
          />
        </View>
      ) : null}

      {panel === 'age' ? (
        <View style={styles.cityRow}>
          <TextInput
            style={[
              styles.cityInput,
              {
                backgroundColor: themeColors.surface,
                borderColor: themeColors.border,
                color: themeColors.text,
              },
            ]}
            placeholder={
              productLine === 'woman'
                ? 'Ex. 17 (joueuses ≤ cet âge)'
                : 'Ex. 17 (joueurs ≤ cet âge)'
            }
            placeholderTextColor={themeColors.textMuted}
            value={filters.maxAge}
            onChangeText={(maxAge) => setFilters((f) => ({ ...f, maxAge }))}
            keyboardType="number-pad"
          />
        </View>
      ) : null}
    </>
  );

  const listBody = loading ? (
    <ActivityIndicator color={themeColors.brand} style={styles.loader} />
  ) : (
    <FlatList
      data={users}
      keyExtractor={(item) => item.uid}
      contentContainerStyle={styles.list}
      ListHeaderComponent={useV3Header ? filtersBlock : undefined}
      renderItem={({ item, index }) => {
        const scouting = scores.get(item.uid);
        const row = (
          <PlayerRowCard
            user={item}
            onPress={handleSelectPlayer}
            bookmarked={isFavorite(item.uid)}
            onBookmark={() => profile && toggle(item.uid, 'player')}
            scoutingScore={scouting?.score}
            scoutingLabel={scouting?.label}
          />
        );
        return useV3Header ? (
          <StaggerReveal index={Math.min(index, 8)}>{row}</StaggerReveal>
        ) : (
          row
        );
      }}
      ListEmptyComponent={
        <Text style={[styles.empty, { color: themeColors.textMuted }]}>
          {activeFilterCount > 0 || query.trim()
            ? productLine === 'woman'
              ? 'Aucune joueuse ne correspond à vos critères.'
              : 'Aucun joueur ne correspond à vos critères.'
            : productLine === 'woman'
              ? 'Aucune joueuse inscrite.'
              : 'Aucun joueur inscrit.'}
        </Text>
      }
    />
  );

  if (useV3Header) {
    return (
      <V3TabShell
        caption="Scouting"
        title={listTitle}
        subtitle={
          users.length > 0
            ? `${users.length} profil(s) — triés par pertinence`
            : 'Explorez la base joueurs'
        }
        right={
          <View style={styles.headerRight}>
            {resetAction}
            <V3ScreenBack onPress={onBack} />
          </View>
        }
        intelligence={intelligence}
        flat
      >
        {listBody}
      </V3TabShell>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <ScreenHeader
        title={listTitle}
        onBack={onBack}
        centered
        rightAction={resetAction}
      />
      {filtersBlock}
      {listBody}
    </View>
  );
};

const OptionRow: React.FC<{
  options: readonly string[];
  selected: string;
  colors: AppColors;
  onSelect: (value: string) => void;
}> = ({ options, selected, onSelect, colors: c }) => (
  <View style={styles.optionRow}>
    {options.map((opt) => {
      const isSelected = selected === opt;
      return (
        <TouchableOpacity
          key={opt}
          style={[
            styles.optionChip,
            {
              borderColor: isSelected ? c.brand : c.border,
              backgroundColor: isSelected ? c.accentSoft : c.surface,
            },
          ]}
          onPress={() => onSelect(opt)}
        >
          <Text
            style={[
              styles.optionText,
              { color: isSelected ? c.brand : c.textSecondary },
            ]}
          >
            {opt}
          </Text>
        </TouchableOpacity>
      );
    })}
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  resetText: { fontSize: 12, fontWeight: '800' },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  optionChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  optionText: { fontSize: 11, fontWeight: '700' },
  cityRow: { paddingHorizontal: spacing.lg, marginBottom: spacing.md },
  cityInput: {
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    fontSize: 15,
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: TAB_BAR_CONTENT_INSET + spacing.lg,
  },
  empty: { textAlign: 'center', marginTop: 40 },
  loader: { marginTop: 40 },
});
