import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import type { User } from '../models/User';
import { ProfileCard } from '../components/ProfileCard';
import { DataState } from '../components/DataState';
import { useUsersByRole } from '../hooks/useRecruitmentData';
import { usersService } from '../services/users.service';
import { isFirebaseConfigured } from '../config/firebase';
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
  const { users, loading } = useUsersByRole('player', query);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.back}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Joueurs</Text>
        <TouchableOpacity>
          <Text style={styles.filterIcon}>⚙</Text>
        </TouchableOpacity>
      </View>

      <TextInput
        style={styles.search}
        placeholder="Rechercher…"
        placeholderTextColor={colors.textMuted}
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
              style={[
                styles.chipText,
                activeChip === chip && styles.chipTextActive,
              ]}
            >
              {chip}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <DataState
        loading={loading}
        empty={!loading && users.length === 0}
        emptyMessage={
          isFirebaseConfigured()
            ? 'Aucun joueur inscrit pour le moment.'
            : undefined
        }
        firebaseMissing={!isFirebaseConfigured()}
      >
        <FlatList
          data={users}
          keyExtractor={(item) => item.uid}
          renderItem={({ item }) => (
            <View>
              <ProfileCard user={item} onViewProfile={onSelectPlayer} compact />
              {usersService.isNewProfile(item) && (
                <View style={styles.newBadge}>
                  <Text style={styles.newBadgeText}>Nouveau</Text>
                </View>
              )}
            </View>
          )}
          contentContainerStyle={styles.list}
        />
      </DataState>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    paddingBottom: spacing.sm,
  },
  back: { fontSize: 22, color: colors.bluePrimary, marginRight: spacing.md },
  title: { flex: 1, fontSize: 22, fontWeight: '800', color: colors.text },
  filterIcon: { fontSize: 20, color: colors.textSecondary },
  search: {
    marginHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    marginBottom: spacing.md,
  },
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
  chipActive: {
    backgroundColor: colors.bluePrimary,
    borderColor: colors.bluePrimary,
  },
  chipText: { color: colors.textSecondary, fontSize: 12, fontWeight: '600' },
  chipTextActive: { color: '#FFFFFF' },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  newBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: colors.blueBright,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  newBadgeText: { color: '#FFF', fontSize: 10, fontWeight: '700' },
});
