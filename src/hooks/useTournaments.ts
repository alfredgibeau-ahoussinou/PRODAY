import { useCallback, useEffect, useState } from 'react';
import type { Tournament } from '../models/Tournament';
import { tournamentsService } from '../services/tournaments.service';

export function useTournaments(refreshSignal = 0) {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setTournaments(await tournamentsService.listUpcoming());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh, refreshSignal]);

  return { tournaments, loading, refresh };
}

export function useTournament(tournamentId: string | null, refreshSignal = 0) {
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(Boolean(tournamentId));

  const refresh = useCallback(async () => {
    if (!tournamentId) {
      setTournament(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      setTournament(await tournamentsService.getById(tournamentId));
    } finally {
      setLoading(false);
    }
  }, [tournamentId]);

  useEffect(() => {
    void refresh();
  }, [refresh, refreshSignal]);

  return { tournament, loading, refresh };
}
