import { useCallback, useEffect, useRef, useState } from 'react';
import type { Follow } from '../models/Follow';
import type { TeamEvent } from '../models/TeamEvent';
import type { Tournament } from '../models/Tournament';
import {
  fetchSupporterMatchHub,
  type SupporterMatchHubResult,
} from '../services/supporterMatchHub.service';
import type { SupporterMatchFilters } from '../services/supporterPreferences.service';
import { externalScoresService } from '../services/externalScores.service';
import {
  externalFixtureToMatchItem,
  teamEventToMatchItem,
} from '../utils/supporterMatchFilters';
import { isProdayEventLiveNow } from '../utils/supporterLiveMatches';

const LIVE_POLL_MS = 45_000;

export interface UseSupporterMatchHubOptions {
  calendarEvents: TeamEvent[];
  tournaments: Tournament[];
  follows: Follow[];
  filters: SupporterMatchFilters;
  /** Active le polling live (ex. écran Matchs chapitre En direct). */
  pollLive?: boolean;
}

export interface UseSupporterMatchHubResult extends SupporterMatchHubResult {
  loading: boolean;
  refresh: () => Promise<void>;
}

const EMPTY_HUB: SupporterMatchHubResult = {
  sections: { upcoming: [], live: [], recent: [], proday: [], world: [], follows: [], broadcasts: [] },
  tournaments: [],
  liveCount: 0,
  upcomingCount: 0,
  heroKickoffs: [],
  providerState: {
    source: 'demo',
    last_sync_at: new Date(),
    healthy: false,
    message: 'Impossible de charger les scores',
  },
};

export function useSupporterMatchHub(
  options: UseSupporterMatchHubOptions,
): UseSupporterMatchHubResult {
  const { calendarEvents, tournaments, follows, filters, pollLive = false } = options;
  const [data, setData] = useState<SupporterMatchHubResult>({
    ...EMPTY_HUB,
    providerState: {
      source: 'demo',
      last_sync_at: new Date(),
      healthy: true,
      message: undefined,
    },
  });
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);
  const requestIdRef = useRef(0);
  const calendarRef = useRef(calendarEvents);
  const tournamentsRef = useRef(tournaments);
  const followsRef = useRef(follows);
  const filtersRef = useRef(filters);
  calendarRef.current = calendarEvents;
  tournamentsRef.current = tournaments;
  followsRef.current = follows;
  filtersRef.current = filters;

  const refresh = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    try {
      const result = await fetchSupporterMatchHub({
        calendarEvents: calendarRef.current ?? [],
        tournaments: tournamentsRef.current ?? [],
        follows: followsRef.current ?? [],
        filters: filtersRef.current,
      });
      if (mountedRef.current && requestId === requestIdRef.current) {
        setData(result);
      }
    } catch {
      if (mountedRef.current && requestId === requestIdRef.current) {
        setData(EMPTY_HUB);
      }
    } finally {
      if (mountedRef.current && requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, []);

  /** Poll live uniquement — évite de brûler le quota API sur upcoming/world. */
  const refreshLiveOnly = useCallback(async () => {
    try {
      const liveWorld = await externalScoresService.listLiveFixtures().catch(() => []);
      if (!mountedRef.current) return;
      const worldLive = liveWorld
        .filter((fixture) => fixture.status === 'live')
        .map(externalFixtureToMatchItem);
      const prodayLive = (calendarRef.current ?? [])
        .filter(isProdayEventLiveNow)
        .map(teamEventToMatchItem)
        .filter((item) => item.status === 'live');
      const live = [...worldLive, ...prodayLive];
      setData((prev) => ({
        ...prev,
        sections: { ...prev.sections, live },
        liveCount: live.length,
      }));
    } catch {
      /* poll non bloquant */
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    void refresh();
  }, [calendarEvents, tournaments, follows, filters, refresh]);

  useEffect(() => {
    if (!pollLive) return undefined;
    const timer = setInterval(() => {
      void refreshLiveOnly();
    }, LIVE_POLL_MS);
    return () => clearInterval(timer);
  }, [pollLive, refreshLiveOnly]);

  return {
    ...data,
    loading,
    refresh,
  };
}
