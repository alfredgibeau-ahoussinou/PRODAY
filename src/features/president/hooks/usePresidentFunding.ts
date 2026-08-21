import { useCallback, useEffect, useState } from 'react';
import { sponsorsService } from '../../../services/sponsors.service';
import type { ClubFundingGoal } from '../../../models/SponsorOffer';

/**
 * Objectifs de financement club (sources partagées sponsors.service).
 */
export function usePresidentFunding(clubId: string | null) {
  const [goals, setGoals] = useState<ClubFundingGoal[]>([]);
  const [loading, setLoading] = useState(Boolean(clubId));

  const refresh = useCallback(async () => {
    if (!clubId) {
      setGoals([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const list = await sponsorsService.listFundingGoalsForClub(clubId);
      setGoals(list);
    } catch {
      setGoals([]);
    } finally {
      setLoading(false);
    }
  }, [clubId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { goals, loading, refresh };
}
