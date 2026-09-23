import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  clubFeesService,
  type ClubFeeUpsertResult,
} from '../../../services/clubFees.service';
import { clubBudgetsService } from '../../../services/clubBudgets.service';
import type { ClubFee, CreateClubFeeInput, UpdateClubFeeInput } from '../../../models/ClubFee';
import type { ClubBudgetLine, UpsertClubBudgetLineInput } from '../../../models/ClubBudgetLine';
import { clubSeasonLabelForDate, clubSeasonStartYear } from '../../../utils/clubSeason';

/**
 * Charge « ce qui est dû » (échéances) et « ce qui est prévu » (budget) pour la saison
 * active du club.
 *
 * La saison est un état explicite : elle est affichée et changeable. La déduire en silence
 * de la date du jour ferait basculer tout l'écran le 1er août sans que l'utilisateur
 * comprenne pourquoi ses chiffres ont changé.
 */
export function useClubFinancePlan(clubId: string | null) {
  const [season, setSeason] = useState(() => clubSeasonLabelForDate(new Date()));
  const [fees, setFees] = useState<ClubFee[]>([]);
  const [budgetLines, setBudgetLines] = useState<ClubBudgetLine[]>([]);
  const [loading, setLoading] = useState(Boolean(clubId));
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!clubId) {
      setFees([]);
      setBudgetLines([]);
      setLoadError(null);
      setLoading(false);
      setRefreshing(false);
      return;
    }
    setRefreshing(true);
    try {
      const [nextFees, nextBudget] = await Promise.all([
        clubFeesService.listByClub(clubId, season),
        clubBudgetsService.listByClub(clubId, season),
      ]);
      setFees(nextFees);
      setBudgetLines(nextBudget);
      setLoadError(null);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'Chargement impossible.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [clubId, season]);

  useEffect(() => {
    setLoading(Boolean(clubId));
    void refresh();
  }, [refresh, clubId]);

  /** Saisons proposées : l'active et la précédente. Dérivées, jamais inventées. */
  const seasonOptions = useMemo(() => {
    const current = clubSeasonLabelForDate(new Date());
    const previousStart = clubSeasonStartYear(new Date()) - 1;
    return [current, `${previousStart}-${previousStart + 1}`];
  }, []);

  const createFee = useCallback(
    async (input: CreateClubFeeInput, options?: { overwrite?: boolean }): Promise<ClubFeeUpsertResult> => {
      const result = await clubFeesService.createOrSkip(input, options);
      // Rechargé même en cas de refus : l'échéance existante doit être visible.
      await refresh();
      return result;
    },
    [refresh],
  );

  const updateFee = useCallback(
    async (feeId: string, patch: UpdateClubFeeInput) => {
      await clubFeesService.update(feeId, patch);
      await refresh();
    },
    [refresh],
  );

  const cancelFee = useCallback(
    async (feeId: string) => {
      await clubFeesService.cancel(feeId);
      await refresh();
    },
    [refresh],
  );

  const saveBudgetLine = useCallback(
    async (input: UpsertClubBudgetLineInput) => {
      const line = await clubBudgetsService.upsertLine(input);
      await refresh();
      return line;
    },
    [refresh],
  );

  const removeBudgetLine = useCallback(
    async (lineId: string) => {
      await clubBudgetsService.removeLine(lineId);
      await refresh();
    },
    [refresh],
  );

  return {
    season,
    setSeason,
    seasonOptions,
    fees,
    budgetLines,
    loading: clubId ? loading : false,
    refreshing,
    loadError,
    refresh,
    createFee,
    updateFee,
    cancelFee,
    saveBudgetLine,
    removeBudgetLine,
  };
}
