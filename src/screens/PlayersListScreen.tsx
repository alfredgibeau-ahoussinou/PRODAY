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
import { spacing, radius } from '../theme/designTokens';
import type { AppColors } from '../theme/universeTheme';
import { useAppTheme } from '../context/ProductLineContext';

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

  const users = useMemo(() => filterPlayers(rawUsers, filters), [rawUsers, filters]);
  const activeFilterCount = countActiveFilters(filters);

  const togglePanel = (p: FilterPanel) => {
    setPanel((cur) => (cur === p ? null : p));
  };

  const resetFilters = () => {
    setFilters(DEFAULT_PLAYER_FILTERS);
    setPanel(null);
  };

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <ScreenHeader
        title={listTitle}
        onBack={onBack}
        centered
        rightAction={
          activeFilterCount > 0 ? (
            <TouchableOpacity onPress={resetFilters} hitSlop={12}>
              <Text style={[styles.resetText, { color: themeColors.brand }]}>Réinit.</Text>
            </TouchableOpacity>
          ) : undefined
        }
      />
      <SearchBar
        placeholder="Nom, poste, ville…"
        value={query}
        onChangeText={setQuery}
      />

      <View style={styles.chips}>
        <FilterChip
          label="Poste"
          active={panel === 'poste' || filters.position !== 'Tous'}
          onPress={() => togglePanel('poste')}
          colors={themeColors}
        />
        <FilterChip
          label="Catégorie"
          active={panel === 'categorie' || filters.category !== 'Tous'}
          onPress={() => togglePanel('categorie')}
          colors={themeColors}
        />
        <FilterChip
          label="Niveau"
          active={panel === 'niveau' || filters.level !== 'Tous'}
          onPress={() => togglePanel('niveau')}
          colors={themeColors}
        />
        <FilterChip
          label="Ville"
          active={panel === 'ville' || Boolean(filters.city.trim())}
          onPress={() => togglePanel('ville')}
          colors={themeColors}
        />
        <FilterChip
          label="Âge max"
          active={panel === 'age' || Boolean(filters.maxAge.trim())}
          onPress={() => togglePanel('age')}
          colors={themeColors}
        />
        {activeFilterCount > 0 ? (
          <View style={[styles.badge, { backgroundColor: themeColors.brand }]}>
            <Text style={styles.badgeText}>{activeFilterCount}</Text>
          </View>
        ) : null}
      </View>

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

      {loading ? (
        <ActivityIndicator color={themeColors.brand} style={styles.loader} />
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item.uid}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <PlayerRowCard
              user={item}
              onPress={onSelectPlayer}
              bookmarked={isFavorite(item.uid)}
              onBookmark={() => profile && toggle(item.uid, 'player')}
            />
          )}
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
      )}
    </View>
  );
};

const FilterChip: React.FC<{
  label: string;
  active: boolean;
  onPress: () => void;
  colors: AppColors;
}> = ({ label, active, onPress, colors: c }) => (
  <TouchableOpacity
    style={[
      styles.chip,
      {
        backgroundColor: active ? c.brand : c.surface,
        borderColor: active ? c.brand : c.border,
      },
    ]}
    onPress={onPress}
  >
    <Text style={[styles.chipText, { color: active ? c.brandInverse : c.textSecondary }]}>
      {label}
    </Text>
  </TouchableOpacity>
);

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
  resetText: { fontSize: 12, fontWeight: '800' },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  chipText: { fontSize: 12, fontWeight: '700' },
  badge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '900' },
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
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  empty: { textAlign: 'center', marginTop: 40 },
  loader: { marginTop: 40 },
});
