import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  /** Premier chargement ou pull-to-refresh explicite (silent=false). */
  refresh: (opts?: { silent?: boolean }) => Promise<void>;
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

function calendarSignature(events: TeamEvent[]): string {
  return events.map((e) => `${e.id}:${e.updated_at?.getTime?.() ?? e.starts_at?.getTime?.() ?? 0}`).join('|');
}

function tournamentsSignature(rows: Tournament[]): string {
  return rows.map((t) => t.id).join('|');
}

function followsSignature(rows: Follow[]): string {
  return rows.map((f) => f.id).join('|');
}

function filtersSignature(filters: SupporterMatchFilters): string {
  return `${filters.gender}|${filters.source}|${filters.scope}|${filters.competition}`;
}

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
  const hasLoadedRef = useRef(false);
  const calendarRef = useRef(calendarEvents);
  const tournamentsRef = useRef(tournaments);
  const followsRef = useRef(follows);
  const filtersRef = useRef(filters);
  calendarRef.current = calendarEvents;
  tournamentsRef.current = tournaments;
  followsRef.current = follows;
  filtersRef.current = filters;

  const inputKey = useMemo(
    () =>
      [
        calendarSignature(calendarEvents ?? []),
        tournamentsSignature(tournaments ?? []),
        followsSignature(follows ?? []),
        filtersSignature(filters),
      ].join('#'),
    [calendarEvents, tournaments, follows, filters],
  );

  const refresh = useCallback(async (opts?: { silent?: boolean }) => {
    /** silent par défaut après le 1er load ; PTR / Retry peuvent forcer `silent: false`. */
    const silent = opts?.silent ?? hasLoadedRef.current;
    const requestId = ++requestIdRef.current;
    if (!silent) setLoading(true);
    try {
      const result = await fetchSupporterMatchHub({
        calendarEvents: calendarRef.current ?? [],
        tournaments: tournamentsRef.current ?? [],
        follows: followsRef.current ?? [],
        filters: filtersRef.current,
      });
      if (mountedRef.current && requestId === requestIdRef.current) {
        setData(result);
        hasLoadedRef.current = true;
      }
    } catch {
      if (mountedRef.current && requestId === requestIdRef.current) {
        setData(EMPTY_HUB);
        hasLoadedRef.current = true;
      }
    } finally {
      if (mountedRef.current && requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, []);

  /** Poll live uniquement — ne touche jamais `loading`. */
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
    void refresh({ silent: hasLoadedRef.current });
  }, [inputKey, refresh]);

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
