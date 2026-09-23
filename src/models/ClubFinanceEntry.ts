/** Écritures du ledger club (cotisations / dépenses / recettes) — hors objectifs sponsors. */

export type ClubFinanceEntryType = 'cotisation' | 'depense' | 'recette' | 'autre';

export type ClubFinanceEntryStatus = 'active' | 'cancelled';

/** Moyens de paiement qu'un club encaisse réellement sur le terrain. */
export type ClubFinancePaymentMethod = 'cash' | 'cheque' | 'transfer' | 'card' | 'other';

export const CLUB_FINANCE_PAYMENT_METHODS: ClubFinancePaymentMethod[] = [
  'cash',
  'cheque',
  'transfer',
  'card',
  'other',
];

export const CLUB_FINANCE_PAYMENT_METHOD_LABELS: Record<ClubFinancePaymentMethod, string> = {
  cash: 'Espèces',
  cheque: 'Chèque',
  transfer: 'Virement',
  card: 'Carte',
  other: 'Autre',
};

/**
 * Provenance d'un encaissement.
 *
 * Une **seule** valeur existe côté client : `manual`. Aucun prestataire ne confirme un
 * paiement à ProDay aujourd'hui, et le type le dit. Une valeur `provider_confirmed`
 * impliquerait un rapprochement bancaire qui n'existe pas — l'écrire ici serait un faux.
 */
export type ClubFinancePaymentProvenance = 'manual';

export interface ClubFinanceReceipt {
  /** Nom du fichier d'origine, tel que choisi par l'utilisateur. */
  name: string;
  /** URL Storage du justificatif. */
  url: string;
  uploaded_at: Date;
}

export interface ClubFinanceEntry {
  id: string;
  club_id: string;
  type: ClubFinanceEntryType;
  amount_eur: number;
  label: string;
  category: string;
  /** Date métier (encaissement / dépense). La saison s'en déduit — elle n'est pas recopiée. */
  entry_date: Date;
  created_by_uid: string;
  created_by_name?: string;
  member_uid?: string | null;
  member_name?: string | null;
  team_id?: string | null;
  status: ClubFinanceEntryStatus;
  /** Moyen de paiement. `null` = non renseigné, jamais deviné. */
  payment_method?: ClubFinancePaymentMethod | null;
  payment_provenance?: ClubFinancePaymentProvenance;
  /** Échéance réglée par cette écriture. `null` = encaissement non rattaché. */
  fee_id?: string | null;
  receipt?: ClubFinanceReceipt | null;
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
  payment_method?: ClubFinancePaymentMethod | null;
  fee_id?: string | null;
  receipt?: ClubFinanceReceipt | null;
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
  payment_method?: ClubFinancePaymentMethod | null;
  fee_id?: string | null;
  receipt?: ClubFinanceReceipt | null;
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

export const CLUB_FINANCE_PAYMENT_PROVENANCE_MANUAL: ClubFinancePaymentProvenance = 'manual';

/**
 * Libellé du moyen de paiement. Un moyen absent reste **« non renseigné »** : afficher
 * « Autre » ferait passer une donnée manquante pour une réponse.
 */
export function clubFinancePaymentMethodLabel(
  method: ClubFinancePaymentMethod | null | undefined,
): string {
  return method ? CLUB_FINANCE_PAYMENT_METHOD_LABELS[method] : 'Moyen non renseigné';
}

export function isClubFinanceIncomeType(type: ClubFinanceEntryType): boolean {
  return type === 'cotisation' || type === 'recette' || type === 'autre';
}

export function isClubFinanceExpenseType(type: ClubFinanceEntryType): boolean {
  return type === 'depense';
}
