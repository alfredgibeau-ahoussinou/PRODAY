/** Écritures du ledger club (cotisations / dépenses / recettes) — hors objectifs sponsors. */

export type ClubFinanceEntryType = 'cotisation' | 'depense' | 'recette' | 'autre';

export type ClubFinanceEntryStatus = 'active' | 'cancelled';

export interface ClubFinanceEntry {
  id: string;
  club_id: string;
  type: ClubFinanceEntryType;
  amount_eur: number;
  label: string;
  category: string;
  /** Date métier (encaissement / dépense). */
  entry_date: Date;
  created_by_uid: string;
  created_by_name?: string;
  member_uid?: string | null;
  member_name?: string | null;
  team_id?: string | null;
  status: ClubFinanceEntryStatus;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date | null;
}

export interface CreateClubFinanceEntryInput {
  club_id: string;
  type: ClubFinanceEntryType;
  amount_eur: number;
  label: string;
  category?: string;
  entry_date?: Date;
  created_by_uid: string;
  created_by_name?: string;
  member_uid?: string | null;
  member_name?: string | null;
  team_id?: string | null;
}

export interface UpdateClubFinanceEntryInput {
  type?: ClubFinanceEntryType;
  amount_eur?: number;
  label?: string;
  category?: string;
  entry_date?: Date;
  member_uid?: string | null;
  member_name?: string | null;
  team_id?: string | null;
  status?: ClubFinanceEntryStatus;
}

export interface ClubFinanceTotals {
  recettes_eur: number;
  depenses_eur: number;
  solde_eur: number;
  count: number;
}

export const CLUB_FINANCE_TYPE_LABELS: Record<ClubFinanceEntryType, string> = {
  cotisation: 'Cotisation',
  depense: 'Dépense',
  recette: 'Recette',
  autre: 'Autre',
};

export const CLUB_FINANCE_CATEGORY_SUGGESTIONS = [
  'Licence',
  'Équipement',
  'Déplacement',
  'Location',
  'Arbitrage',
  'Événement',
  'Sponsoring',
  'Divers',
] as const;

export function isClubFinanceIncomeType(type: ClubFinanceEntryType): boolean {
  return type === 'cotisation' || type === 'recette' || type === 'autre';
}

export function isClubFinanceExpenseType(type: ClubFinanceEntryType): boolean {
  return type === 'depense';
}
