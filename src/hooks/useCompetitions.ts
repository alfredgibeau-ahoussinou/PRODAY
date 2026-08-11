import { useCallback, useEffect, useState } from 'react';
import { competitionsService } from '../services/competitions.service';
import type {
  Competition,
  CompetitionFixture,
  CompetitionSeason,
  CompetitionStandingRow,
  PlayerCompetitionStats,
} from '../models/Competition';

export function useCompetitions(refreshSignal = 0) {
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [seasons, setSeasons] = useState<CompetitionSeason[]>([]);
  const [fixtures, setFixtures] = useState<CompetitionFixture[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [comps, seas, upcoming] = await Promise.all([
        competitionsService.listCompetitions(),
        competitionsService.listSeasons(),
        competitionsService.listUpcomingFixtures(30),
      ]);
      setCompetitions(comps);
      setSeasons(seas);
      setFixtures(upcoming);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh, refreshSignal]);

  return { competitions, seasons, fixtures, loading, refresh };
}

export function useCompetitionSeason(seasonId: string | null, refreshSignal = 0) {
  const [season, setSeason] = useState<CompetitionSeason | null>(null);
  const [fixtures, setFixtures] = useState<CompetitionFixture[]>([]);
  const [standings, setStandings] = useState<CompetitionStandingRow[]>([]);
  const [playerStats, setPlayerStats] = useState<PlayerCompetitionStats[]>([]);
  const [loading, setLoading] = useState(Boolean(seasonId));

  const refresh = useCallback(async () => {
    if (!seasonId) {
      setSeason(null);
      setFixtures([]);
      setStandings([]);
      setPlayerStats([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [s, f, st, ps] = await Promise.all([
        competitionsService.getSeason(seasonId),
        competitionsService.listFixtures(seasonId),
        competitionsService.getStandings(seasonId),
        competitionsService.listPlayerStats(seasonId),
      ]);
      setSeason(s);
      setFixtures(f);
      setStandings(st);
      setPlayerStats(ps);
    } finally {
      setLoading(false);
    }
  }, [seasonId]);

  useEffect(() => {
    void refresh();
  }, [refresh, refreshSignal]);

  return { season, fixtures, standings, playerStats, loading, refresh };
}
