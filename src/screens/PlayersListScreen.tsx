import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import type { User } from '../models/User';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { SearchBar } from '../components/ui/SearchBar';
import { PlayerRowCard } from '../components/ui/PlayerRowCard';
import { useUsersByRole } from '../hooks/useRecruitmentData';
import { colors, spacing, radius } from '../theme/designTokens';

const FILTER_CHIPS = ['Poste', 'Niveau', 'Localisation', 'Filtres'] as const;

interface PlayersListScreenProps {
  onBack: () => void;
  onSelectPlayer: (player: User) => void;
}

export const PlayersListScreen: React.FC<PlayersListScreenProps> = ({
  onBack,
  onSelectPlayer,
}) => {
  const [query, setQuery] = useState('');
  const [activeChip, setActiveChip] = useState<string | null>(null);
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());
  const { users, loading } = useUsersByRole('player', query);

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Joueurs"
        onBack={onBack}
        rightAction={
          <TouchableOpacity>
            <Text style={styles.filterIcon}>⚙</Text>
          </TouchableOpacity>
        }
      />
      <SearchBar
        placeholder="Rechercher…"
        value={query}
        onChangeText={setQuery}
      />

      <View style={styles.chips}>
        {FILTER_CHIPS.map((chip) => (
          <TouchableOpacity
            key={chip}
            style={[styles.chip, activeChip === chip && styles.chipActive]}
            onPress={() => setActiveChip(activeChip === chip ? null : chip)}
          >
            <Text
              style={[styles.chipText, activeChip === chip && styles.chipTextActive]}
            >
              {chip}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

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
              bookmarked={bookmarks.has(item.uid)}
              onBookmark={() =>
                setBookmarks((prev) => {
                  const next = new Set(prev);
                  if (next.has(item.uid)) next.delete(item.uid);
                  else next.add(item.uid);
                  return next;
                })
              }
            />
          )}
          ListEmptyComponent={
            <Text style={styles.empty}>Aucun joueur inscrit.</Text>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  filterIcon: { fontSize: 22, color: colors.textSecondary },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.brand, borderColor: colors.brand },
  chipText: { color: colors.textSecondary, fontSize: 12, fontWeight: '600' },
  chipTextActive: { color: '#FFFFFF' },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  empty: { textAlign: 'center', color: colors.textMuted, marginTop: 40 },
  loader: { marginTop: 40 },
});
