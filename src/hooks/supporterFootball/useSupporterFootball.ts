import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Follow } from '../../models/Follow';
import type { TeamEvent } from '../../models/TeamEvent';
import type { Tournament } from '../../models/Tournament';
import {
  createSupporterFootballFacade,
  filterMatchesForFollows,
  type MergedSupporterFootballFacade,
  type ProviderHealth,
  type UnifiedMatch,
} from '../../services/supporterFootball';

export type SupporterFootballFeed = {
  health: ProviderHealth | null;
  live: UnifiedMatch[];
  upcoming: UnifiedMatch[];
  finished: UnifiedMatch[];
  proday: UnifiedMatch[];
  favorites: UnifiedMatch[];
  loading: boolean;
  error: string | null;
  refresh: (opts?: { silent?: boolean }) => Promise<void>;
  facade: MergedSupporterFootballFacade;
};

export function useSupporterFootballFeed(opts: {
  calendarEvents: TeamEvent[];
  tournaments: Tournament[];
  follows: Follow[];
  pollLive?: boolean;
}): SupporterFootballFeed {
  const facade = useMemo(
    () => createSupporterFootballFacade(opts.calendarEvents, opts.tournaments),
    [opts.calendarEvents, opts.tournaments],
  );

  const [health, setHealth] = useState<ProviderHealth | null>(null);
  const [live, setLive] = useState<UnifiedMatch[]>([]);
  const [upcoming, setUpcoming] = useState<UnifiedMatch[]>([]);
  const [finished, setFinished] = useState<UnifiedMatch[]>([]);
  const [proday, setProday] = useState<UnifiedMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  const refresh = useCallback(
    async (refreshOpts?: { silent?: boolean }) => {
      if (!refreshOpts?.silent) setLoading(true);
      setError(null);
      try {
        const [h, l, u, f, p] = await Promise.all([
          facade.getHealth(),
          facade.getLive(),
          facade.getUpcoming(10),
          facade.getFinished(5),
          facade.getProDayMatches(),
        ]);
        if (!mounted.current) return;
        setHealth(h);
        setLive(l);
        setUpcoming(u);
        setFinished(f);
        setProday(p);
      } catch (e) {
        if (!mounted.current) return;
        setError(e instanceof Error ? e.message : 'Chargement impossible');
      } finally {
        if (mounted.current && !refreshOpts?.silent) setLoading(false);
      }
    },
    [facade],
  );

  useEffect(() => {
    mounted.current = true;
    void refresh();
    return () => {
      mounted.current = false;
    };
  }, [refresh]);

  useEffect(() => {
    if (!opts.pollLive) return undefined;
    const id = setInterval(() => {
      void refresh({ silent: true });
    }, 45_000);
    return () => clearInterval(id);
  }, [opts.pollLive, refresh]);

  const favorites = useMemo(
    () => filterMatchesForFollows([...live, ...upcoming], opts.follows),
    [live, upcoming, opts.follows],
  );

  return {
    health,
    live,
    upcoming,
    finished,
    proday,
    favorites,
    loading,
    error,
    refresh,
    facade,
  };
}

export function useLiveMatchPoll(
  matchId: string | null,
  facade: MergedSupporterFootballFacade,
  enabled: boolean,
) {
  const [match, setMatch] = useState<UnifiedMatch | null>(null);

  const load = useCallback(async () => {
    if (!matchId) {
      setMatch(null);
      return;
    }
    const payload = await facade.getMatchCenter(matchId);
    setMatch(payload?.match ?? null);
  }, [facade, matchId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!enabled || !matchId) return undefined;
    const id = setInterval(() => {
      void load();
    }, 45_000);
    return () => clearInterval(id);
  }, [enabled, matchId, load]);

  return { match, reload: load };
}
