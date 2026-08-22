import {
  buildClubFinanceLedgerRow,
  formatClubFinanceEur,
  resolveClubFinanceSubtitle,
} from '../features/club/ui/clubFinanceModel';
import type { ClubFinanceEntry } from '../models/ClubFinanceEntry';

function entry(
  partial: Partial<ClubFinanceEntry> & Pick<ClubFinanceEntry, 'id' | 'type' | 'amount_eur' | 'label'>,
): ClubFinanceEntry {
  const now = new Date('2026-08-21T12:00:00Z');
  return {
    club_id: 'club_1',
    category: 'Licence',
    entry_date: now,
    created_by_uid: 'u1',
    status: 'active',
    created_at: now,
    updated_at: now,
    deleted_at: null,
    ...partial,
  };
}

describe('clubFinanceModel', () => {
  it('formate le solde et le sous-titre', () => {
    expect(formatClubFinanceEur(1200)).toContain('€');
    expect(
      resolveClubFinanceSubtitle({
        recettes_eur: 0,
        depenses_eur: 0,
        solde_eur: 0,
        count: 0,
      }),
    ).toBe('Cotisations · dépenses · recettes');
    expect(
      resolveClubFinanceSubtitle({
        recettes_eur: 100,
        depenses_eur: 40,
        solde_eur: 60,
        count: 2,
      }),
    ).toContain('2 écritures');
  });

  it('construit une ligne ledger lisible', () => {
    const income = buildClubFinanceLedgerRow(
      entry({ id: '1', type: 'cotisation', amount_eur: 150, label: 'Cotisation U15' }),
    );
    expect(income.isExpense).toBe(false);
    expect(income.amountLabel.startsWith('+')).toBe(true);
    expect(income.meta).toContain('Cotisation');

    const expense = buildClubFinanceLedgerRow(
      entry({ id: '2', type: 'depense', amount_eur: 80, label: 'Ballons', category: 'Équipement' }),
    );
    expect(expense.isExpense).toBe(true);
    expect(expense.amountLabel.startsWith('−')).toBe(true);
  });
});
