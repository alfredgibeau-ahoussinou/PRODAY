import { useCallback, useEffect, useState } from 'react';
import { statsService, type RecruitmentStats } from '../services/stats.service';
import { tournamentService } from '../services/tournament.service';
import { friendlyMatchesService } from '../services/friendlyMatches.service';
import { teamEventsService } from '../services/teamEvents.service';
import type { TeamEvent } from '../models/TeamEvent';
import { mergeSeasonCalendar, type SeasonCalendarItem } from '../utils/seasonCalendar';
import { sponsorsService } from '../services/sponsors.service';
import { messagesService } from '../services/messages.service';
import { recruitmentService } from '../services/recruitment.service';
import type { RecruitmentPost } from '../models/Player';
import type { Tournament } from '../models/Tournament';
import type { FriendlyMatch } from '../models/FriendlyMatch';
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

/** Stats + annonces + tournois réels pour l’écran Découverte. */
export function useDiscoverLiveData() {
  const [stats, setStats] = useState<RecruitmentStats | null>(null);
  const [posts, setPosts] = useState<RecruitmentPost[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const [s, p, t] = await Promise.all([
      statsService.getRecruitmentStats(),
      recruitmentService.listOpenPosts(8),
      tournamentService.listUpcoming(8),
    ]);
    setStats(s);
    setPosts(p);
    setTournaments(t);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { stats, posts, tournaments, loading, refresh };
}

export function useArenaData() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [honorTournament, setHonorTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const [list, honor] = await Promise.all([
      tournamentService.listUpcoming(),
      tournamentService.getLatestWithAwards(),
    ]);
    setTournaments(list);
    setHonorTournament(honor);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { tournaments, honorTournament, loading, refresh };
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
  const { events, loading: loadingEvents, refresh: refreshEvents } = useTeamEvents(
    uid,
    clubId
  );
  const { matches, loading: loadingMatches, refresh: refreshMatches } =
    useFriendlyMatches();
  const { tournaments, loading: loadingTournaments, refresh: refreshTournaments } =
    useArenaData();

  const items: SeasonCalendarItem[] = mergeSeasonCalendar(events, matches, tournaments);
  const loading = loadingEvents || loadingMatches || loadingTournaments;

  const refresh = useCallback(async () => {
    await Promise.all([refreshEvents(), refreshMatches(), refreshTournaments()]);
  }, [refreshEvents, refreshMatches, refreshTournaments]);

  return { items, events, matches, tournaments, loading, refresh };
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
