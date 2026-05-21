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
import { CoachListCard } from '../components/CoachListCard';
import { DataState } from '../components/DataState';
import { useUsersByRole } from '../hooks/useRecruitmentData';
import type { StaffType } from '../services/users.service';
import { isFirebaseConfigured } from '../config/firebase';
import { colors, spacing, radius } from '../theme/designTokens';

interface CoachesListScreenProps {
  initialType?: StaffType;
  onBack: () => void;
  onSelect: (user: User) => void;
}

export const CoachesListScreen: React.FC<CoachesListScreenProps> = ({
  initialType = 'coach',
  onBack,
  onSelect,
}) => {
  const [staffType, setStaffType] = useState<StaffType>(initialType);
  const [query, setQuery] = useState('');
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());
  const { users, loading } = useUsersByRole(staffType, query);

  const toggleBookmark = (uid: string) => {
    setBookmarks((prev) => {
      const next = new Set(prev);
      if (next.has(uid)) next.delete(uid);
      else next.add(uid);
      return next;
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.back}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Recrutement</Text>
      </View>

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

      <TextInput
        style={styles.search}
        placeholder="Rechercher un coach, un agent…"
        placeholderTextColor={colors.textMuted}
        value={query}
        onChangeText={setQuery}
      />

      <Text style={styles.section}>Populaires</Text>

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
              bookmarked={bookmarks.has(item.uid)}
              onBookmark={() => toggleBookmark(item.uid)}
            />
          )}
          contentContainerStyle={styles.list}
        />
      </DataState>

      <TouchableOpacity style={styles.fab}>
        <Text style={styles.fabText}>+ Publier une annonce</Text>
      </TouchableOpacity>
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
  title: { fontSize: 22, fontWeight: '800', color: colors.text },
  toggle: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    padding: 4,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: radius.sm,
  },
  toggleActive: { backgroundColor: colors.surface },
  toggleText: { color: colors.textSecondary, fontWeight: '600' },
  toggleTextActive: { color: colors.bluePrimary },
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
  section: {
    paddingHorizontal: spacing.lg,
    color: colors.textSecondary,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  list: { paddingHorizontal: spacing.lg, paddingBottom: 88 },
  fab: {
    position: 'absolute',
    bottom: spacing.lg,
    left: spacing.lg,
    right: spacing.lg,
    backgroundColor: colors.bluePrimary,
    borderRadius: radius.md,
    paddingVertical: 16,
    alignItems: 'center',
  },
  fabText: { color: '#FFF', fontWeight: '700' },
});
