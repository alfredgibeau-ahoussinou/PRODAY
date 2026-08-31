import {
  computeClubFinanceTotals,
  mapClubFinanceEntry,
} from '../utils/clubFinance';
import type { ClubFinanceEntry } from '../models/ClubFinanceEntry';

function entry(
  partial: Partial<ClubFinanceEntry> & Pick<ClubFinanceEntry, 'id' | 'type' | 'amount_eur'>,
): ClubFinanceEntry {
  const now = new Date('2026-08-21T12:00:00Z');
  return {
    club_id: 'club_1',
    label: 'Test',
    category: 'Divers',
    entry_date: now,
    created_by_uid: 'u1',
    status: 'active',
    created_at: now,
    updated_at: now,
    deleted_at: null,
    ...partial,
  };
}

describe('clubFinance mapper & totals', () => {
  it('mapClubFinanceEntry normalise type, montant et dates', () => {
    const mapped = mapClubFinanceEntry('e1', {
      club_id: 'c1',
      type: 'cotisation',
      amount_eur: 42.456,
      label: '  Cotisation U15  ',
      category: 'Licence',
      entry_date: { toDate: () => new Date('2026-01-15T10:00:00Z') },
      created_by_uid: 'uid',
      status: 'active',
      created_at: { toDate: () => new Date('2026-01-10T10:00:00Z') },
      updated_at: { toDate: () => new Date('2026-01-11T10:00:00Z') },
    });
    expect(mapped.id).toBe('e1');
    expect(mapped.club_id).toBe('c1');
    expect(mapped.type).toBe('cotisation');
    expect(mapped.amount_eur).toBe(42.46);
    expect(mapped.label).toBe('Cotisation U15');
    expect(mapped.entry_date.toISOString()).toBe('2026-01-15T10:00:00.000Z');
  });

  it('mapClubFinanceEntry fallback type invalide → autre', () => {
    const mapped = mapClubFinanceEntry('e2', {
      club_id: 'c1',
      type: 'inconnu',
      amount_eur: -5,
      label: '',
    });
    expect(mapped.type).toBe('autre');
    expect(mapped.amount_eur).toBe(0);
    expect(mapped.label).toBe('Sans libellé');
  });

  it('computeClubFinanceTotals sépare recettes / dépenses / solde', () => {
    const totals = computeClubFinanceTotals([
      entry({ id: '1', type: 'cotisation', amount_eur: 100 }),
      entry({ id: '2', type: 'recette', amount_eur: 50 }),
      entry({ id: '3', type: 'autre', amount_eur: 10 }),
      entry({ id: '4', type: 'depense', amount_eur: 40 }),
      entry({ id: '5', type: 'depense', amount_eur: 20, status: 'cancelled' }),
      entry({
        id: '6',
        type: 'cotisation',
        amount_eur: 99,
        deleted_at: new Date(),
      }),
    ]);
    expect(totals.recettes_eur).toBe(160);
    expect(totals.depenses_eur).toBe(40);
    expect(totals.solde_eur).toBe(120);
    expect(totals.count).toBe(4);
  });
});
