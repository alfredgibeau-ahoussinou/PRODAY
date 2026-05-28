import { useCallback, useEffect, useState } from 'react';
import { favoritesService } from '../services/favorites.service';
import type { UserRole } from '../models/User';

export function useFavorites(userUid: string | undefined) {
  const [ids, setIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!userUid) {
      setIds(new Set());
      setLoading(false);
      return;
    }
    setLoading(true);
    const list = await favoritesService.listIds(userUid);
    setIds(new Set(list));
    setLoading(false);
  }, [userUid]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const isFavorite = useCallback((targetUid: string) => ids.has(targetUid), [ids]);

  const toggle = useCallback(
    async (targetUid: string, targetRole?: UserRole) => {
      if (!userUid) return false;
      const added = await favoritesService.toggle(userUid, targetUid, targetRole);
      setIds((prev) => {
        const next = new Set(prev);
        if (added) next.add(targetUid);
        else next.delete(targetUid);
        return next;
      });
      return added;
    },
    [userUid]
  );

  return { ids, loading, refresh, isFavorite, toggle };
}
