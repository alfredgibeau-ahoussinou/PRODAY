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

function isLive(m: UnifiedMatch): boolean {
  return m.status === 'live' || m.status === 'halftime';
}

export type SupporterFootballFeed = {
  health: ProviderHealth | null;
  /** Live ProDay + Ligues (demo stripped). Prefer `liveProday` / `liveLeagues` for dual rails. */
  live: UnifiedMatch[];
  liveProday: UnifiedMatch[];
  liveLeagues: UnifiedMatch[];
  upcoming: UnifiedMatch[];
  upcomingProday: UnifiedMatch[];
  upcomingLeagues: UnifiedMatch[];
  finished: UnifiedMatch[];
  finishedLeagues: UnifiedMatch[];
  proday: UnifiedMatch[];
  leagues: UnifiedMatch[];
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

  const followsKey = useMemo(
    () =>
      opts.follows
        .filter((f) => f.target_type === 'club')
        .map((f) => `${f.target_id}:${f.target_label ?? ''}`)
        .sort()
        .join('|'),
    [opts.follows],
  );

  const [health, setHealth] = useState<ProviderHealth | null>(null);
  const [live, setLive] = useState<UnifiedMatch[]>([]);
  const [upcoming, setUpcoming] = useState<UnifiedMatch[]>([]);
  const [finished, setFinished] = useState<UnifiedMatch[]>([]);
  const [proday, setProday] = useState<UnifiedMatch[]>([]);
  const [leagues, setLeagues] = useState<UnifiedMatch[]>([]);
  const [followedPool, setFollowedPool] = useState<UnifiedMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  const refresh = useCallback(
    async (refreshOpts?: { silent?: boolean }) => {
      if (!refreshOpts?.silent) setLoading(true);
      setError(null);
      try {
        const clubFollows = opts.follows.filter((f) => f.target_type === 'club');
        const [h, l, u, f, p, leagueUp, leagueLive, leagueFin, followed] =
          await Promise.all([
            facade.getHealth(),
            facade.getLive(),
            facade.getUpcoming(14),
            facade.getFinished(7),
            facade.getProDayMatches(),
            facade.getLeagueUpcoming(14),
            facade.getLeagueLive(),
            facade.getLeagueFinished(7),
            clubFollows.length
              ? facade.getFollowedClubMatches(clubFollows)
              : Promise.resolve([] as UnifiedMatch[]),
          ]);
        if (!mounted.current) return;
        setHealth(h);
        setLive(l);
        setUpcoming(u);
        setFinished(f);
        setProday(p);
        setFollowedPool(followed);
        const leaguePool = dedupe([
          ...leagueLive,
          ...leagueUp,
          ...leagueFin,
          ...followed,
        ]).filter(
          (m) => m.source === 'external' || (h.mode === 'demo' && m.source === 'demo'),
        );
        setLeagues(leaguePool);
      } catch (e) {
        if (!mounted.current) return;
        setError(e instanceof Error ? e.message : 'Chargement impossible');
      } finally {
        if (mounted.current && !refreshOpts?.silent) setLoading(false);
      }
    },
    // followsKey captures club follow identity without thrashing on array identity
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [facade, followsKey],
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

  const liveProday = useMemo(
    () => live.filter((m) => m.source === 'proday' && isLive(m)),
    [live],
  );
  const liveLeagues = useMemo(
    () => live.filter((m) => m.source === 'external' && isLive(m)),
    [live],
  );
  const upcomingProday = useMemo(
    () => upcoming.filter((m) => m.source === 'proday'),
    [upcoming],
  );
  const upcomingLeagues = useMemo(
    () => upcoming.filter((m) => m.source === 'external'),
    [upcoming],
  );
  const finishedLeagues = useMemo(
    () => finished.filter((m) => m.source === 'external'),
    [finished],
  );

  const favorites = useMemo(
    () =>
      filterMatchesForFollows(
        dedupe([...live, ...upcoming, ...finished, ...followedPool, ...leagues]),
        opts.follows,
      ),
    [live, upcoming, finished, followedPool, leagues, opts.follows],
  );

  return {
    health,
    live,
    liveProday,
    liveLeagues,
    upcoming,
    upcomingProday,
    upcomingLeagues,
    finished,
    finishedLeagues,
    proday,
    leagues,
    favorites,
    loading,
    error,
    refresh,
    facade,
  };
}

function dedupe(list: UnifiedMatch[]): UnifiedMatch[] {
  const seen = new Set<string>();
  return list.filter((m) => {
    if (seen.has(m.id)) return false;
    seen.add(m.id);
    return true;
  });
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
