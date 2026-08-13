import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Follow, FollowTargetType } from '../models/Follow';
import { followsService } from '../services/follows.service';

export function useFollows(followerUid: string | undefined) {
  const [follows, setFollows] = useState<Follow[]>([]);
  const [loading, setLoading] = useState(Boolean(followerUid));
  const [pendingKey, setPendingKey] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!followerUid) {
      setFollows([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const list = await followsService.listByFollower(followerUid);
      setFollows(list);
    } catch {
      setFollows([]);
    } finally {
      setLoading(false);
    }
  }, [followerUid]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const keySet = useMemo(
    () => new Set(follows.map((f) => `${f.target_type}:${f.target_id}`)),
    [follows]
  );

  const isFollowing = useCallback(
    (targetType: FollowTargetType, targetId: string) =>
      keySet.has(`${targetType}:${targetId}`),
    [keySet]
  );

  const toggle = useCallback(
    async (
      targetType: FollowTargetType,
      targetId: string,
      targetLabel?: string
    ): Promise<boolean> => {
      if (!followerUid || !targetId) return false;
      const key = `${targetType}:${targetId}`;
      const wasFollowing = keySet.has(key);
      setPendingKey(key);
      // Optimistic
      setFollows((prev) => {
        if (wasFollowing) {
          return prev.filter(
            (f) => !(f.target_type === targetType && f.target_id === targetId)
          );
        }
        return [
          ...prev,
          {
            id: `${followerUid}__${targetType}__${targetId}`,
            follower_uid: followerUid,
            target_type: targetType,
            target_id: targetId,
            target_label: targetLabel,
            created_at: new Date(),
          },
        ];
      });
      try {
        const nowFollowing = await followsService.toggle(
          followerUid,
          targetType,
          targetId,
          targetLabel
        );
        if (nowFollowing === wasFollowing) {
          await refresh();
        }
        return nowFollowing;
      } catch (error) {
        await refresh();
        throw error;
      } finally {
        setPendingKey(null);
      }
    },
    [followerUid, keySet, refresh]
  );

  return {
    follows,
    loading,
    pendingKey,
    refresh,
    isFollowing,
    toggle,
    clubs: follows.filter((f) => f.target_type === 'club'),
    players: follows.filter((f) => f.target_type === 'player'),
    tournaments: follows.filter((f) => f.target_type === 'tournament'),
  };
}
