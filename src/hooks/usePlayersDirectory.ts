import { useCallback, useEffect, useRef, useState } from 'react';
import type { User, GeoPoint } from '../models/User';
import {
  playersDirectoryService,
  type PlayersDirectoryCursor,
} from '../services/playersDirectory.service';

export function usePlayersDirectory(options: {
  search?: string;
  city?: string;
  radiusKm?: number;
  viewerLocation?: GeoPoint | null;
}) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const cursorRef = useRef<PlayersDirectoryCursor>(null);

  const loadFirst = useCallback(async () => {
    setLoading(true);
    cursorRef.current = null;
    const page = await playersDirectoryService.fetchPage({
      search: options.search,
      city: options.city,
      radiusKm: options.radiusKm,
      viewerLocation: options.viewerLocation,
    });
    cursorRef.current = page.cursor;
    setUsers(page.users);
    setHasMore(page.hasMore);
    setLoading(false);
  }, [options.city, options.radiusKm, options.search, options.viewerLocation]);

  const loadMore = useCallback(async () => {
    if (!hasMore || loadingMore || !cursorRef.current) return;
    setLoadingMore(true);
    const page = await playersDirectoryService.fetchPage({
      search: options.search,
      city: options.city,
      radiusKm: options.radiusKm,
      viewerLocation: options.viewerLocation,
      cursor: cursorRef.current,
    });
    cursorRef.current = page.cursor;
    setUsers((prev) => {
      const seen = new Set(prev.map((u) => u.uid));
      return [...prev, ...page.users.filter((u) => !seen.has(u.uid))];
    });
    setHasMore(page.hasMore);
    setLoadingMore(false);
  }, [hasMore, loadingMore, options.city, options.radiusKm, options.search, options.viewerLocation]);

  useEffect(() => {
    void loadFirst();
  }, [loadFirst]);

  return { users, loading, loadingMore, hasMore, refresh: loadFirst, loadMore };
}
