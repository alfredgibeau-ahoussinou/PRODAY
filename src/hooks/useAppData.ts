import { useCallback, useEffect, useMemo, useState } from 'react';
import { statsService, type RecruitmentStats } from '../services/stats.service';
import { friendlyMatchesService } from '../services/friendlyMatches.service';
import { teamEventsService } from '../services/teamEvents.service';
import type { TeamEvent } from '../models/TeamEvent';
import { mergeSeasonCalendar, type SeasonCalendarItem } from '../utils/seasonCalendar';
import {
  loadSeasonCalendarCache,
  saveSeasonCalendarCache,
} from '../utils/seasonCalendarCache';
import { sponsorsService } from '../services/sponsors.service';
import { messagesService } from '../services/messages.service';
import { recruitmentService } from '../services/recruitment.service';
import { competitionsService } from '../services/competitions.service';
import type { RecruitmentPost } from '../models/Player';
import type { FriendlyMatch } from '../models/FriendlyMatch';
import type { CompetitionFixture } from '../models/Competition';
import type { SponsorOffer, ClubFundingGoal } from '../models/SponsorOffer';
import type { MessageThread } from '../lib/firestoreMappers';

export function useHomeStats() {
  const [stats, setStats] = useState<RecruitmentStats | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    setStats(await statsService.getRecruitmentStats());
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { stats, loading, refresh };
}

/** Stats + annonces réelles pour l’écran Découverte. */
export function useDiscoverLiveData() {
  const [stats, setStats] = useState<RecruitmentStats | null>(null);
  const [posts, setPosts] = useState<RecruitmentPost[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const [s, p] = await Promise.all([
      statsService.getRecruitmentStats(),
      recruitmentService.listOpenPosts(8),
    ]);
    setStats(s);
    setPosts(p);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { stats, posts, loading, refresh };
}

export function useTeamEvents(uid?: string, clubId?: string) {
  const [events, setEvents] = useState<TeamEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    if (uid) {
      setEvents(await teamEventsService.listForUser(uid, clubId));
    } else {
      setEvents(await teamEventsService.listUpcoming());
    }
    setLoading(false);
  }, [uid, clubId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { events, loading, refresh };
}

export function useSeasonCalendar(uid?: string, clubId?: string) {
  const [cachedItems, setCachedItems] = useState<SeasonCalendarItem[] | null>(null);
  const [fixtures, setFixtures] = useState<CompetitionFixture[]>([]);
  const { events, loading: loadingEvents, refresh: refreshEvents } = useTeamEvents(
    uid,
    clubId
  );
  const { matches, loading: loadingMatches, refresh: refreshMatches } =
    useFriendlyMatches();

  const refreshFixtures = useCallback(async () => {
    setFixtures(await competitionsService.listUpcomingFixtures(40));
  }, []);

  useEffect(() => {
    void refreshFixtures();
  }, [refreshFixtures]);

  useEffect(() => {
    if (!uid) {
      setCachedItems(null);
      return;
    }
    void loadSeasonCalendarCache(uid).then(setCachedItems);
  }, [uid]);

  const liveItems = useMemo(
    () => mergeSeasonCalendar(events, matches, fixtures),
    [events, matches, fixtures]
  );
  const hasLive = liveItems.length > 0;
  const hasCache = (cachedItems?.length ?? 0) > 0;
  const loading = loadingEvents || loadingMatches;
  const items = hasLive ? liveItems : (cachedItems ?? []);
  const fromCache = !hasLive && hasCache && !loading ? true : loading && hasCache && !hasLive;

  const refresh = useCallback(async () => {
    await Promise.all([refreshEvents(), refreshMatches(), refreshFixtures()]);
  }, [refreshEvents, refreshMatches, refreshFixtures]);

  useEffect(() => {
    if (!uid || liveItems.length === 0) return;
    void saveSeasonCalendarCache(uid, liveItems);
    setCachedItems((prev) => {
      if (
        prev &&
        prev.length === liveItems.length &&
        prev.every((item, index) => item.id === liveItems[index]?.id)
      ) {
        return prev;
      }
      return liveItems;
    });
  }, [uid, liveItems]);

  return { items, events, matches, fixtures, loading, fromCache, refresh };
}

export function useDetectionEvents() {
  const [events, setEvents] = useState<TeamEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    setEvents(await teamEventsService.listDetections());
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { events, loading, refresh };
}

export function useFriendlyMatches() {
  const [matches, setMatches] = useState<FriendlyMatch[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    setMatches(await friendlyMatchesService.listUpcoming());
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { matches, loading, refresh };
}

export function useSponsorsData() {
  const [offers, setOffers] = useState<SponsorOffer[]>([]);
  const [goals, setGoals] = useState<ClubFundingGoal[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const [o, g] = await Promise.all([
      sponsorsService.listOffers(),
      sponsorsService.listFundingGoals(),
    ]);
    setOffers(o);
    setGoals(g);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { offers, goals, loading, refresh };
}

export function useMessagesData(currentUid: string | undefined) {
  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!currentUid) {
      setThreads([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setThreads(await messagesService.listThreads(currentUid));
    setLoading(false);
  }, [currentUid]);

  useEffect(() => {
    if (!currentUid) {
      setThreads([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsub = messagesService.subscribeThreads(currentUid, (list) => {
      setThreads(list);
      setLoading(false);
    });
    if (!unsub) refresh();
    return () => unsub?.();
  }, [currentUid, refresh]);

  return { threads, loading, refresh };
}
