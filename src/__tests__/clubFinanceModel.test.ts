import {
  buildClubFinanceLedgerRow,
  buildCotisationCoverage,
  clubFinanceHonestyNote,
  filterClubFinanceEntries,
  formatClubFinanceEur,
  matchMemberFromName,
  resolveClubFinanceSubtitle,
  summarizeClubCotisations,
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

  it('construit une ligne ledger lisible avec statut cotisation', () => {
    const income = buildClubFinanceLedgerRow(
      entry({
        id: '1',
        type: 'cotisation',
        amount_eur: 150,
        label: 'Cotisation U15',
        member_name: 'Martin',
      }),
    );
    expect(income.isExpense).toBe(false);
    expect(income.amountLabel.startsWith('+')).toBe(true);
    expect(income.meta).toContain('Cotisation');
    expect(income.meta).toContain('Martin');
    expect(income.statusLabel).toBe('Payé');

    const expense = buildClubFinanceLedgerRow(
      entry({ id: '2', type: 'depense', amount_eur: 80, label: 'Ballons', category: 'Équipement' }),
    );
    expect(expense.isExpense).toBe(true);
    expect(expense.amountLabel.startsWith('−')).toBe(true);
  });

  it('résume cotisations et couverture adhérents sans inventer d’impayés SEPA', () => {
    const entries = [
      entry({
        id: 'c1',
        type: 'cotisation',
        amount_eur: 120,
        label: 'Cotisation A',
        member_uid: 'p1',
        member_name: 'Alice',
      }),
      entry({ id: 'd1', type: 'depense', amount_eur: 40, label: 'Ballons' }),
    ];
    expect(summarizeClubCotisations(entries).count).toBe(1);
    expect(summarizeClubCotisations(entries).totalEur).toBe(120);

    const coverage = buildCotisationCoverage({
      playerMembers: [
        { uid: 'p1', display_name: 'Alice' },
        { uid: 'p2', display_name: 'Bob' },
      ],
      entries,
    });
    expect(coverage.paid.some((r) => r.name === 'Alice' && r.status === 'paid')).toBe(true);
    expect(coverage.unrecorded.some((r) => r.name === 'Bob' && r.status === 'none')).toBe(true);
    expect(coverage.unrecorded[0].statusLabel).toBe('Non enregistré');
    expect(clubFinanceHonestyNote()).toMatch(/SEPA/i);
    expect(filterClubFinanceEntries(entries, 'cotisation')).toHaveLength(1);
    expect(matchMemberFromName('bob', [{ uid: 'p2', display_name: 'Bob' }])?.uid).toBe('p2');
  });
});
