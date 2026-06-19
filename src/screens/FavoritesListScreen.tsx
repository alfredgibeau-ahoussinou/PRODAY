import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
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
import { spacing } from '../theme/designTokens';
import { useThemedScreen } from '../hooks/useThemedScreen';
import type { AppColors } from '../theme/universeTheme';
import { TabScreenShell } from '../components/app/TabScreenShell';
import { ScreenBackButton } from '../components/ui/ScreenBackButton';
import { useSectionIntelligence } from '../hooks/useSectionIntelligence';
import { isSubScreenShellEnabled } from '../hooks/useSubScreenShell';
import { scoutingScoreMap } from '../features/v3/engines/playerScouting.engine';
import { StaggerReveal } from '../components/motion';
import { TAB_BAR_CONTENT_INSET } from '../navigation/tabBarLayout';

interface FavoritesListScreenProps {
  onBack: () => void;
  onSelectUser: (user: User) => void;
}

export const FavoritesListScreen: React.FC<FavoritesListScreenProps> = ({
  onBack,
  onSelectUser,
}) => {
  const { profile } = useAuth();
  const { colors: c, productLine, rootStyle } = useThemedScreen();
  const styles = useMemo(() => createStyles(c), [c]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const useShellHeader = isSubScreenShellEnabled(profile, 'signed');
  const isStaff = isSubScreenShellEnabled(profile, 'staff');
  const playerFavorites = useMemo(() => users.filter((u) => u.role === 'player'), [users]);
  const scores = useMemo(() => {
    if (!profile || !isStaff) return new Map();
    return scoutingScoreMap(profile, playerFavorites);
  }, [profile, isStaff, playerFavorites]);
  const intelligence = useSectionIntelligence('recrutement', profile ?? null, productLine, {
    staffMode: isStaff,
    mercatoPosts: users.length,
  });

  const load = useCallback(async () => {
    if (!profile?.uid) {
      setUsers([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const ids = await favoritesService.listIds(profile.uid);
    const loaded = (
      await Promise.all(ids.map((id) => usersService.getPublicById(id)))
    ).filter((u): u is User => u != null);
    setUsers(loaded);
    setLoading(false);
  }, [profile?.uid]);

  useEffect(() => {
    void load();
  }, [load]);

  const body = loading ? (
    <ActivityIndicator color={c.brand} style={styles.loader} />
  ) : users.length === 0 ? (
    <Text style={styles.empty}>
      {productLine === 'woman'
        ? 'Aucun favori. Ajoutez des joueuses ou coachs depuis leurs profils.'
        : 'Aucun favori. Ajoutez des joueurs ou coachs depuis leurs profils.'}
    </Text>
  ) : (
    <FlatList
      data={users}
      keyExtractor={(u) => u.uid}
      contentContainerStyle={styles.list}
      renderItem={({ item, index }) => {
        const scouting = scores.get(item.uid);
        const row =
          item.role === 'player' ? (
            <PlayerRowCard
              user={item}
              onPress={onSelectUser}
              bookmarked
              scoutingScore={scouting?.score}
              scoutingLabel={scouting?.label}
              onBookmark={async () => {
                if (profile) {
                  await favoritesService.toggle(profile.uid, item.uid, 'player');
                  void load();
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
                    item.role === 'coach' || item.role === 'agent' ? item.role : 'coach'
                  );
                  void load();
                }
              }}
            />
          );
        return useShellHeader ? <StaggerReveal index={Math.min(index, 8)}>{row}</StaggerReveal> : row;
      }}
    />
  );

  if (useShellHeader) {
    return (
      <TabScreenShell
        caption="Mercato"
        title="Mes favoris"
        subtitle={`${users.length} profil(s) enregistré(s)`}
        right={<ScreenBackButton onPress={onBack} />}
        
        flat
      >
        {body}
      </TabScreenShell>
    );
  }

  return (
    <View style={[styles.root, rootStyle]}>
      <ScreenHeader title="Mes favoris" onBack={onBack} centered />
      {body}
    </View>
  );
};

function createStyles(c: AppColors) {
  return StyleSheet.create({
    root: { flex: 1 },
    loader: { marginTop: spacing.xl },
    empty: {
      textAlign: 'center',
      padding: spacing.xl,
      fontSize: 14,
      lineHeight: 22,
      color: c.textMuted,
    },
    list: { padding: spacing.lg, paddingBottom: TAB_BAR_CONTENT_INSET + spacing.lg },
  });
}
