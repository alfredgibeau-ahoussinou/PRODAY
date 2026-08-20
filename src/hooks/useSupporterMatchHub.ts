import { useCallback, useEffect, useRef, useState } from 'react';
import type { Follow } from '../models/Follow';
import type { TeamEvent } from '../models/TeamEvent';
import type { Tournament } from '../models/Tournament';
import {
  fetchSupporterMatchHub,
  type SupporterMatchHubResult,
} from '../services/supporterMatchHub.service';
import type { SupporterMatchFilters } from '../services/supporterPreferences.service';

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

export function useSupporterMatchHub(
  options: UseSupporterMatchHubOptions,
): UseSupporterMatchHubResult {
  const { calendarEvents, tournaments, follows, filters, pollLive = false } = options;
  const [data, setData] = useState<SupporterMatchHubResult>({
    sections: { upcoming: [], live: [], proday: [], world: [], follows: [] },
    tournaments: [],
    liveCount: 0,
    upcomingCount: 0,
    heroKickoffs: [],
    providerState: {
      source: 'api_stub',
      last_sync_at: new Date(),
      healthy: false,
    },
  });
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);

  const refresh = useCallback(async () => {
    const result = await fetchSupporterMatchHub({
      calendarEvents,
      tournaments,
      follows,
      filters,
    });
    if (mountedRef.current) {
      setData(result);
      setLoading(false);
    }
  }, [calendarEvents, tournaments, follows, filters]);

  useEffect(() => {
    mountedRef.current = true;
    setLoading(true);
    void refresh();
    return () => {
      mountedRef.current = false;
    };
  }, [refresh]);

  useEffect(() => {
    if (!pollLive) return undefined;
    const timer = setInterval(() => {
      void refresh();
    }, LIVE_POLL_MS);
    return () => clearInterval(timer);
  }, [pollLive, refresh]);

  return {
    ...data,
    loading,
    refresh,
  };
}
