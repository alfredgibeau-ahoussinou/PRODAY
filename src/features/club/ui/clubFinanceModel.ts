/**
 * Helpers purs Finances Club — format, libellés ledger (testables).
 */
import {
  CLUB_FINANCE_TYPE_LABELS,
  isClubFinanceExpenseType,
  type ClubFinanceEntry,
  type ClubFinanceTotals,
} from '../../../models/ClubFinanceEntry';

export function formatClubFinanceEur(n: number): string {
  return `${n.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} €`;
}

export function formatClubFinanceEntryDate(d: Date): string {
  return d.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function resolveClubFinanceSubtitle(totals: ClubFinanceTotals): string {
  if (totals.count <= 0) return 'Cotisations · dépenses · recettes';
  return `${totals.count} écriture${totals.count > 1 ? 's' : ''} · solde ${formatClubFinanceEur(totals.solde_eur)}`;
}

export type ClubFinanceLedgerRowModel = {
  id: string;
  label: string;
  meta: string;
  amountLabel: string;
  isExpense: boolean;
  typeLabel: string;
};

export function buildClubFinanceLedgerRow(entry: ClubFinanceEntry): ClubFinanceLedgerRowModel {
  const isExpense = isClubFinanceExpenseType(entry.type);
  const typeLabel = CLUB_FINANCE_TYPE_LABELS[entry.type];
  return {
    id: entry.id,
    label: entry.label.trim() || 'Sans libellé',
    meta: `${typeLabel} · ${entry.category} · ${formatClubFinanceEntryDate(entry.entry_date)}`,
    amountLabel: `${isExpense ? '−' : '+'}${formatClubFinanceEur(entry.amount_eur)}`,
    isExpense,
    typeLabel,
  };
}
