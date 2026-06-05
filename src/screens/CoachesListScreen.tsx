import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import type { User } from '../models/User';
import { CoachListCard } from '../components/CoachListCard';
import { DataState } from '../components/DataState';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { SearchBar } from '../components/ui/SearchBar';
import { useUsersByRole } from '../hooks/useRecruitmentData';
import type { StaffType } from '../services/users.service';
import { isFirebaseConfigured } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { useFavorites } from '../hooks/useFavorites';
import { Icon } from '../components/ui/Icon';
import { spacing, radius, shadows } from '../theme/designTokens';
import { useThemedScreen } from '../hooks/useThemedScreen';
import type { AppColors } from '../theme/universeTheme';

const FILTER_CHIPS = ['Spécialité', 'Niveau', 'Localisation', 'Filtres'] as const;

interface CoachesListScreenProps {
  initialType?: StaffType;
  onBack: () => void;
  onSelect: (user: User) => void;
  onCreatePost?: () => void;
}

export const CoachesListScreen: React.FC<CoachesListScreenProps> = ({
  initialType = 'coach',
  onBack,
  onSelect,
  onCreatePost,
}) => {
  const [staffType, setStaffType] = useState<StaffType>(initialType);
  const [query, setQuery] = useState('');
  const [activeChip, setActiveChip] = useState<string | null>(null);
  const { profile } = useAuth();
  const { isFavorite, toggle } = useFavorites(profile?.uid);
  const { users, loading } = useUsersByRole(staffType, query);
  const { colors: c, rootStyle } = useThemedScreen();
  const styles = useMemo(() => createStyles(c), [c]);

  return (
    <View style={[styles.container, rootStyle]}>
      <ScreenHeader
        title="Recrutement"
        subtitle={
          staffType === 'coach'
            ? `${users.length} coachs`
            : `${users.length} agents`
        }
        onBack={onBack}
        centered
      />

      <View style={styles.toggle}>
        <TouchableOpacity
          style={[styles.toggleBtn, staffType === 'coach' && styles.toggleActive]}
          onPress={() => setStaffType('coach')}
        >
          <Text
            style={[
              styles.toggleText,
              staffType === 'coach' && styles.toggleTextActive,
            ]}
          >
            Coachs
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleBtn, staffType === 'agent' && styles.toggleActive]}
          onPress={() => setStaffType('agent')}
        >
          <Text
            style={[
              styles.toggleText,
              staffType === 'agent' && styles.toggleTextActive,
            ]}
          >
            Agents
          </Text>
        </TouchableOpacity>
      </View>

      <SearchBar
        placeholder={
          staffType === 'coach'
            ? 'Rechercher un coach…'
            : 'Rechercher un agent…'
        }
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

      <Text style={styles.section}>
        {staffType === 'coach' ? 'Coachs populaires' : 'Agents en avant'}
      </Text>

      <DataState
        loading={loading}
        empty={!loading && users.length === 0}
        emptyMessage={
          isFirebaseConfigured()
            ? `Aucun ${staffType === 'coach' ? 'coach' : 'agent'} inscrit pour le moment.`
            : undefined
        }
        firebaseMissing={!isFirebaseConfigured()}
      >
        <FlatList
          data={users}
          keyExtractor={(item) => item.uid}
          renderItem={({ item }) => (
            <CoachListCard
              user={item}
              onPress={onSelect}
              bookmarked={isFavorite(item.uid)}
              onBookmark={() => profile && toggle(item.uid, staffType)}
            />
          )}
          contentContainerStyle={styles.list}
        />
      </DataState>

      {onCreatePost ? (
        <TouchableOpacity
          style={[styles.fab, shadows.fab]}
          onPress={onCreatePost}
        >
          <Text style={styles.fabText}>Publier une annonce</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

function createStyles(c: AppColors) {
  return StyleSheet.create({
    container: { flex: 1 },
    toggle: {
      flexDirection: 'row',
      marginHorizontal: spacing.lg,
      marginBottom: spacing.md,
      backgroundColor: c.surfaceMuted,
      borderRadius: radius.md,
      padding: 4,
    },
    toggleBtn: {
      flex: 1,
      paddingVertical: spacing.sm,
      alignItems: 'center',
      borderRadius: radius.sm,
    },
    toggleActive: { backgroundColor: c.surface },
    toggleText: { color: c.textSecondary, fontWeight: '600' },
    toggleTextActive: { color: c.brand, fontWeight: '700' },
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
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
    },
    chipActive: { backgroundColor: c.brand, borderColor: c.brand },
    chipText: { fontSize: 12, fontWeight: '600', color: c.textSecondary },
    chipTextActive: { color: c.brandInverse },
    section: {
      paddingHorizontal: spacing.lg,
      color: c.text,
      fontWeight: '700',
      fontSize: 16,
      marginBottom: spacing.sm,
    },
    list: { paddingHorizontal: spacing.lg, paddingBottom: 88 },
    fab: {
      position: 'absolute',
      bottom: spacing.lg,
      left: spacing.lg,
      right: spacing.lg,
      backgroundColor: c.brand,
      borderRadius: radius.md,
      paddingVertical: 16,
      alignItems: 'center',
    },
    fabText: { color: c.brandInverse, fontWeight: '700' },
  });
}
