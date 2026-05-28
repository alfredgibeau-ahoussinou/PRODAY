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
import { colors, spacing, radius } from '../theme/designTokens';

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
  const { users: rawUsers, loading } = useUsersByRole('player', query);

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
    <View style={styles.container}>
      <ScreenHeader
        title="Joueurs"
        onBack={onBack}
        centered
        rightAction={
          activeFilterCount > 0 ? (
            <TouchableOpacity onPress={resetFilters} hitSlop={12}>
              <Text style={styles.resetText}>Réinit.</Text>
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
        />
        <FilterChip
          label="Catégorie"
          active={panel === 'categorie' || filters.category !== 'Tous'}
          onPress={() => togglePanel('categorie')}
        />
        <FilterChip
          label="Niveau"
          active={panel === 'niveau' || filters.level !== 'Tous'}
          onPress={() => togglePanel('niveau')}
        />
        <FilterChip
          label="Ville"
          active={panel === 'ville' || Boolean(filters.city.trim())}
          onPress={() => togglePanel('ville')}
        />
        <FilterChip
          label="Âge max"
          active={panel === 'age' || Boolean(filters.maxAge.trim())}
          onPress={() => togglePanel('age')}
        />
        {activeFilterCount > 0 ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{activeFilterCount}</Text>
          </View>
        ) : null}
      </View>

      {panel === 'poste' ? (
        <OptionRow
          options={PLAYER_POSITIONS_FILTER}
          selected={filters.position}
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
            style={styles.cityInput}
            placeholder="Ex. Paris, Lyon…"
            placeholderTextColor={colors.textMuted}
            value={filters.city}
            onChangeText={(city) => setFilters((f) => ({ ...f, city }))}
            autoCapitalize="words"
          />
        </View>
      ) : null}

      {panel === 'age' ? (
        <View style={styles.cityRow}>
          <TextInput
            style={styles.cityInput}
            placeholder="Ex. 17 (joueurs ≤ cet âge)"
            placeholderTextColor={colors.textMuted}
            value={filters.maxAge}
            onChangeText={(maxAge) => setFilters((f) => ({ ...f, maxAge }))}
            keyboardType="number-pad"
          />
        </View>
      ) : null}

      {loading ? (
        <ActivityIndicator color={colors.brand} style={styles.loader} />
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
            <Text style={styles.empty}>
              {activeFilterCount > 0 || query.trim()
                ? 'Aucun joueur ne correspond à vos critères.'
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
}> = ({ label, active, onPress }) => (
  <TouchableOpacity
    style={[styles.chip, active && styles.chipActive]}
    onPress={onPress}
  >
    <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
  </TouchableOpacity>
);

const OptionRow: React.FC<{
  options: readonly string[];
  selected: string;
  onSelect: (value: string) => void;
}> = ({ options, selected, onSelect }) => (
  <View style={styles.optionRow}>
    {options.map((opt) => (
      <TouchableOpacity
        key={opt}
        style={[styles.optionChip, selected === opt && styles.optionChipActive]}
        onPress={() => onSelect(opt)}
      >
        <Text
          style={[styles.optionText, selected === opt && styles.optionTextActive]}
        >
          {opt}
        </Text>
      </TouchableOpacity>
    ))}
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  resetText: { fontSize: 12, fontWeight: '800', color: colors.accent },
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
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.ink, borderColor: colors.ink },
  chipText: { color: colors.textSecondary, fontSize: 12, fontWeight: '700' },
  chipTextActive: { color: colors.brandInverse },
  badge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.accent,
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
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  optionChipActive: {
    borderColor: colors.accent,
    backgroundColor: colors.accentSoft,
  },
  optionText: { fontSize: 11, fontWeight: '700', color: colors.textSecondary },
  optionTextActive: { color: colors.accent },
  cityRow: { paddingHorizontal: spacing.lg, marginBottom: spacing.md },
  cityInput: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    fontSize: 15,
    color: colors.text,
  },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  empty: { textAlign: 'center', color: colors.textMuted, marginTop: 40 },
  loader: { marginTop: 40 },
});
