import { useCallback, useEffect, useState } from 'react';
import { statsService, type RecruitmentStats } from '../services/stats.service';
import { tournamentService } from '../services/tournament.service';
import { friendlyMatchesService } from '../services/friendlyMatches.service';
import { sponsorsService } from '../services/sponsors.service';
import { messagesService } from '../services/messages.service';
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

export function useArenaData() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [honorTournament, setHonorTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [list, honor] = await Promise.all([
        tournamentService.listUpcoming(),
        tournamentService.getLatestWithAwards(),
      ]);
      setTournaments(list);
      setHonorTournament(honor);
      setLoading(false);
    })();
  }, []);

  return { tournaments, honorTournament, loading };
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

  useEffect(() => {
    (async () => {
      const [o, g] = await Promise.all([
        sponsorsService.listOffers(),
        sponsorsService.listFundingGoals(),
      ]);
      setOffers(o);
      setGoals(g);
      setLoading(false);
    })();
  }, []);

  return { offers, goals, loading };
}

export function useMessagesData() {
  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    messagesService.listThreads().then((t) => {
      setThreads(t);
      setLoading(false);
    });
  }, []);

  return { threads, loading };
}
