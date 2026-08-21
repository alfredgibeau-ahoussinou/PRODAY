import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  clubFinanceService,
  computeClubFinanceTotals,
} from '../../../services/clubFinance.service';
import type {
  ClubFinanceEntry,
  ClubFinanceTotals,
  CreateClubFinanceEntryInput,
} from '../../../models/ClubFinanceEntry';

const EMPTY_TOTALS: ClubFinanceTotals = {
  recettes_eur: 0,
  depenses_eur: 0,
  solde_eur: 0,
  count: 0,
};

/**
 * Ledger cotisations / dépenses / recettes pour un club.
 */
export function useClubFinance(clubId: string | null) {
  const [entries, setEntries] = useState<ClubFinanceEntry[]>([]);
  const [loading, setLoading] = useState(Boolean(clubId));
  const [refreshing, setRefreshing] = useState(false);

  const refresh = useCallback(async () => {
    if (!clubId) {
      setEntries([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }
    setRefreshing(true);
    try {
      setEntries(await clubFinanceService.listByClub(clubId));
    } catch {
      setEntries([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [clubId]);

  useEffect(() => {
    setLoading(Boolean(clubId));
    void refresh();
  }, [refresh, clubId]);

  const totals = useMemo(() => computeClubFinanceTotals(entries), [entries]);

  const create = useCallback(
    async (input: Omit<CreateClubFinanceEntryInput, 'club_id'> & { club_id?: string }) => {
      const cid = input.club_id ?? clubId;
      if (!cid) throw new Error('Club requis.');
      const created = await clubFinanceService.create({ ...input, club_id: cid });
      await refresh();
      return created;
    },
    [clubId, refresh],
  );

  const softDelete = useCallback(
    async (entryId: string) => {
      await clubFinanceService.softDelete(entryId);
      await refresh();
    },
    [refresh],
  );

  return {
    entries,
    totals: clubId ? totals : EMPTY_TOTALS,
    loading,
    refreshing,
    refresh,
    create,
    softDelete,
  };
}
