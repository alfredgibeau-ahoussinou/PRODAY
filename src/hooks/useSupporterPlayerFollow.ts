import { useCallback } from 'react';
import type { User } from '../models/User';
import { isSupporterFreeAccess } from '../utils/supporterFreeAccess';
import { useFavorites } from './useFavorites';
import { useFollows } from './useFollows';
import { useAppTheme } from '../context/ProductLineContext';

/**
 * Suivre un joueur : `follows` pour le pôle supporter,
 * `favorites` pour le reste (scouting / recrutement).
 */
export function useSupporterPlayerFollow(viewer: User | null | undefined) {
  const { productLine } = useAppTheme();
  const tribune = isSupporterFreeAccess(viewer?.role, productLine);
  const favorites = useFavorites(tribune ? undefined : viewer?.uid);
  const follows = useFollows(tribune ? viewer?.uid : undefined);

  const isFollowingPlayer = useCallback(
    (playerUid: string) =>
      tribune
        ? follows.isFollowing('player', playerUid)
        : favorites.isFavorite(playerUid),
    [tribune, follows, favorites],
  );

  const togglePlayer = useCallback(
    async (player: Pick<User, 'uid' | 'display_name' | 'city' | 'profile'>) => {
      if (!viewer?.uid) return false;
      if (tribune) {
        const meta = [player.profile?.position, player.city].filter(Boolean).join(' · ');
        const label = meta ? `${player.display_name} · ${meta}` : player.display_name;
        return follows.toggle('player', player.uid, label);
      }
      return favorites.toggle(player.uid, 'player');
    },
    [viewer?.uid, tribune, follows, favorites],
  );

  return {
    tribune,
    isFollowingPlayer,
    togglePlayer,
    loading: tribune ? follows.loading : favorites.loading,
    followedPlayers: tribune ? follows.players : [],
    refresh: tribune ? follows.refresh : favorites.refresh,
  };
}
