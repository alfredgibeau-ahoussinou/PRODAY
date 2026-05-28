import React, { useCallback, useEffect, useState } from 'react';
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
import { PlayerRowCard } from '../components/ui/PlayerRowCard';
import { CoachListCard } from '../components/CoachListCard';
import { favoritesService } from '../services/favorites.service';
import { usersService } from '../services/users.service';
import { useAuth } from '../context/AuthContext';
import { colors, spacing } from '../theme/designTokens';

interface FavoritesListScreenProps {
  onBack: () => void;
  onSelectUser: (user: User) => void;
}

export const FavoritesListScreen: React.FC<FavoritesListScreenProps> = ({
  onBack,
  onSelectUser,
}) => {
  const { profile } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!profile?.uid) {
      setUsers([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const ids = await favoritesService.listIds(profile.uid);
    const loaded = (
      await Promise.all(ids.map((id) => usersService.getById(id)))
    ).filter((u): u is User => u != null);
    setUsers(loaded);
    setLoading(false);
  }, [profile?.uid]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <View style={styles.root}>
      <ScreenHeader title="Mes favoris" onBack={onBack} centered />
      {loading ? (
        <ActivityIndicator color={colors.brand} style={styles.loader} />
      ) : users.length === 0 ? (
        <Text style={styles.empty}>
          Aucun favori. Ajoutez des joueurs ou coachs depuis leurs profils.
        </Text>
      ) : (
        <FlatList
          data={users}
          keyExtractor={(u) => u.uid}
          contentContainerStyle={styles.list}
          renderItem={({ item }) =>
            item.role === 'player' ? (
              <PlayerRowCard
                user={item}
                onPress={onSelectUser}
                bookmarked
                onBookmark={async () => {
                  if (profile) {
                    await favoritesService.toggle(profile.uid, item.uid, 'player');
                    load();
                  }
                }}
              />
            ) : (
              <CoachListCard
                user={item}
                onPress={onSelectUser}
                bookmarked
                onBookmark={async () => {
                  if (profile) {
                    await favoritesService.toggle(
                      profile.uid,
                      item.uid,
                      item.role === 'coach' || item.role === 'agent'
                        ? item.role
                        : 'coach'
                    );
                    load();
                  }
                }}
              />
            )
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  loader: { marginTop: spacing.xl },
  empty: {
    textAlign: 'center',
    color: colors.textMuted,
    padding: spacing.xl,
    fontSize: 14,
    lineHeight: 22,
  },
  list: { padding: spacing.lg, paddingBottom: spacing.xxl },
});
