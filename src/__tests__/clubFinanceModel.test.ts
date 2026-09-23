import {
  buildClubFinanceCategoryBreakdown,
  clubFinanceOutstandingPrerequisites,
  clubFinancePaymentProvenanceNote,
  clubFinancePeriodRange,
  clubFinanceSeasonBounds,
  filterClubFinanceByPeriod,
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

describe('finances club — périodes', () => {
  const now = new Date('2026-09-15T12:00:00');

  it('la saison court du 1er août au 31 juillet', () => {
    const b = clubFinanceSeasonBounds(now);
    expect(b.start.getMonth()).toBe(7); // août
    expect(b.start.getDate()).toBe(1);
    expect(b.end.getFullYear()).toBe(b.start.getFullYear() + 1);
    expect(b.end.getMonth()).toBe(7);
  });

  it('bascule la saison avant le mois d’août', () => {
    // En juin 2026, la saison en cours a commencé en août 2025.
    const b = clubFinanceSeasonBounds(new Date('2026-06-10T12:00:00'));
    expect(b.start.getFullYear()).toBe(2025);
    expect(b.end.getFullYear()).toBe(2026);
  });

  it('« Tout » ne borne rien', () => {
    expect(clubFinancePeriodRange('all', now)).toBeNull();
  });

  it('« Ce mois » couvre le mois calendaire en cours', () => {
    const r = clubFinancePeriodRange('month', now)!;
    expect(r.start.getMonth()).toBe(8);
    expect(r.end.getMonth()).toBe(9);
  });

  it('« Mois dernier » couvre le mois précédent', () => {
    const r = clubFinancePeriodRange('lastMonth', now)!;
    expect(r.start.getMonth()).toBe(7);
    expect(r.end.getMonth()).toBe(8);
  });

  it('exclut de la période les écritures hors bornes', () => {
    const inMonth = entry({ id: 'a', type: 'recette', amount_eur: 100, label: 'X', entry_date: new Date('2026-09-02T10:00:00') });
    const prevMonth = entry({ id: 'b', type: 'recette', amount_eur: 200, label: 'Y', entry_date: new Date('2026-08-02T10:00:00') });
    const filtered = filterClubFinanceByPeriod([inMonth, prevMonth], 'month', now);
    expect(filtered.map((e) => e.id)).toEqual(['a']);
  });

  it('n’inclut jamais une écriture annulée ou supprimée', () => {
    const cancelled = entry({ id: 'c', type: 'recette', amount_eur: 500, label: 'Z', status: 'cancelled', entry_date: new Date('2026-09-03T10:00:00') });
    const deleted = entry({ id: 'd', type: 'recette', amount_eur: 900, label: 'W', deleted_at: new Date('2026-09-04T10:00:00'), entry_date: new Date('2026-09-04T10:00:00') });
    expect(filterClubFinanceByPeriod([cancelled, deleted], 'all', now)).toEqual([]);
  });
});

describe('finances club — ventilation par catégorie', () => {
  it('sépare recettes et dépenses et calcule le net', () => {
    const rows = buildClubFinanceCategoryBreakdown([
      entry({ id: 'a', type: 'cotisation', amount_eur: 300, label: 'C', category: 'Licence' }),
      entry({ id: 'b', type: 'depense', amount_eur: 120, label: 'D', category: 'Licence' }),
      entry({ id: 'c', type: 'depense', amount_eur: 400, label: 'E', category: 'Déplacement' }),
    ]);
    const licence = rows.find((r) => r.category === 'Licence')!;
    expect(licence.incomeEur).toBe(300);
    expect(licence.expenseEur).toBe(120);
    expect(licence.netEur).toBe(180);
    expect(licence.count).toBe(2);
  });

  it('trie par poids, pas par signe', () => {
    const rows = buildClubFinanceCategoryBreakdown([
      entry({ id: 'a', type: 'depense', amount_eur: 900, label: 'D', category: 'Gros' }),
      entry({ id: 'b', type: 'recette', amount_eur: 100, label: 'R', category: 'Petit' }),
    ]);
    expect(rows.map((r) => r.category)).toEqual(['Gros', 'Petit']);
  });

  it('nomme explicitement l’absence de catégorie', () => {
    const rows = buildClubFinanceCategoryBreakdown([
      entry({ id: 'a', type: 'recette', amount_eur: 10, label: 'R', category: '   ' }),
    ]);
    expect(rows[0]!.category).toBe('Sans catégorie');
  });

  it('ne fabrique aucune ligne sans écriture', () => {
    expect(buildClubFinanceCategoryBreakdown([])).toEqual([]);
  });
});

describe('finances club — ce qui manque est dit, pas inventé', () => {
  it('renvoie les impayés vers les échéances saisies, et nomme l’état du club', () => {
    const note = clubFinanceOutstandingPrerequisites();
    // Le modèle enregistre désormais montant dû et échéance : la note ne doit plus dire
    // l'inverse, mais elle doit toujours refuser de calculer un impayé sans échéance.
    expect(note).not.toMatch(/Le modèle enregistre des encaissements, pas des montants dus/);
    expect(note).toMatch(/montants dus/i);
    expect(note).toMatch(/échéances/i);
    expect(note).toMatch(/aucun impayé n’est calculable/i);
    expect(note).toMatch(/état du club/i);
  });

  it('qualifie toute écriture de saisie manuelle, sans prétendre au rapprochement bancaire', () => {
    const note = clubFinancePaymentProvenanceNote();
    expect(note).toMatch(/Saisie manuelle/);
    expect(note).toMatch(/déclaré par le club/);
    expect(note).toMatch(/Aucun encaissement n’est confirmé par un prestataire/);
    expect(note).toMatch(/relevé bancaire/);
  });
});
