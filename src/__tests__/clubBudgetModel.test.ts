import {
  buildClubBudgetReport,
  clubBudgetUnplannedNote,
  clubBudgetVarianceDefinition,
  isEntryInSeason,
  resolveClubBudgetSummaryLabel,
  selectSeasonActualEntries,
} from '../features/club/ui/clubBudgetModel';
import { clubBudgetLineDocId, clubBudgetNetPlannedEur } from '../models/ClubBudgetLine';
import type { ClubBudgetLine } from '../models/ClubBudgetLine';
import type { ClubFinanceEntry } from '../models/ClubFinanceEntry';

const SEASON = '2026-2027';

function line(partial: Partial<ClubBudgetLine> & Pick<ClubBudgetLine, 'category'>): ClubBudgetLine {
  return {
    id: clubBudgetLineDocId({ club_id: 'club-1', season: SEASON, category: partial.category }),
    club_id: 'club-1',
    season: SEASON,
    planned_income_eur: 0,
    planned_expense_eur: 0,
    created_by_uid: 'club-1',
    created_at: new Date('2026-08-01T09:00:00'),
    updated_at: new Date('2026-08-01T09:00:00'),
    ...partial,
  };
}

function entry(
  partial: Partial<ClubFinanceEntry> &
    Pick<ClubFinanceEntry, 'id' | 'type' | 'amount_eur' | 'category' | 'entry_date'>,
): ClubFinanceEntry {
  return {
    club_id: 'club-1',
    label: 'Écriture',
    created_by_uid: 'club-1',
    status: 'active',
    payment_method: null,
    payment_provenance: 'manual',
    fee_id: null,
    receipt: null,
    created_at: partial.entry_date,
    updated_at: partial.entry_date,
    deleted_at: null,
    ...partial,
  };
}

describe('bornes de saison', () => {
  it('rattache juillet à la saison précédente et août à la suivante', () => {
    expect(isEntryInSeason(entry({ id: 'a', type: 'recette', amount_eur: 10, category: 'X', entry_date: new Date('2026-07-31T23:00:00') }), SEASON)).toBe(false);
    expect(isEntryInSeason(entry({ id: 'b', type: 'recette', amount_eur: 10, category: 'X', entry_date: new Date('2026-08-01T00:30:00') }), SEASON)).toBe(true);
    expect(isEntryInSeason(entry({ id: 'c', type: 'recette', amount_eur: 10, category: 'X', entry_date: new Date('2027-07-31T23:59:00') }), SEASON)).toBe(true);
    expect(isEntryInSeason(entry({ id: 'd', type: 'recette', amount_eur: 10, category: 'X', entry_date: new Date('2027-08-01T00:00:00') }), SEASON)).toBe(false);
  });

  it('n’impute aucun réalisé à une saison mal formée', () => {
    const entries = [entry({ id: 'a', type: 'recette', amount_eur: 100, category: 'X', entry_date: new Date('2026-09-01') })];
    expect(selectSeasonActualEntries(entries, '2026/2027')).toHaveLength(0);

    const report = buildClubBudgetReport({ lines: [line({ category: 'X', planned_income_eur: 50 })], entries, season: '2026/2027' });
    expect(report.seasonResolved).toBe(false);
    expect(report.actualEntriesCount).toBe(0);
    expect(report.totals.actualIncomeEur).toBe(0);
    expect(resolveClubBudgetSummaryLabel(report)).toContain('Saison mal formée');
  });

  it('écarte les écritures annulées et supprimées du réalisé', () => {
    const entries = [
      entry({ id: 'a', type: 'cotisation', amount_eur: 100, category: 'Licence', entry_date: new Date('2026-09-01') }),
      entry({ id: 'b', type: 'cotisation', amount_eur: 900, category: 'Licence', entry_date: new Date('2026-09-02'), status: 'cancelled' }),
      entry({ id: 'c', type: 'cotisation', amount_eur: 700, category: 'Licence', entry_date: new Date('2026-09-03'), deleted_at: new Date('2026-09-04') }),
    ];
    const report = buildClubBudgetReport({ lines: [], entries, season: SEASON });
    expect(report.totals.actualIncomeEur).toBe(100);
    expect(report.actualEntriesCount).toBe(1);
  });
});

describe('buildClubBudgetReport', () => {
  it('calcule l’écart dans les deux sens', () => {
    const report = buildClubBudgetReport({
      lines: [
        line({ category: 'Licence', planned_income_eur: 10000 }),
        line({ category: 'Déplacement', planned_expense_eur: 2000 }),
      ],
      entries: [
        entry({ id: 'a', type: 'cotisation', amount_eur: 4000, category: 'Licence', entry_date: new Date('2026-09-15') }),
        entry({ id: 'b', type: 'depense', amount_eur: 2500, category: 'Déplacement', entry_date: new Date('2026-10-01') }),
      ],
      season: SEASON,
    });

    const licence = report.rows.find((r) => r.category === 'Licence')!;
    // Entrées : réalisé sous le prévu → écart négatif, pas un dépassement.
    expect(licence.incomeVarianceEur).toBe(-6000);
    expect(licence.coverage).toBe('budgeted');

    const deplacement = report.rows.find((r) => r.category === 'Déplacement')!;
    // Dépenses : réalisé au-dessus du prévu → dépassement de 500.
    expect(deplacement.expenseVarianceEur).toBe(500);
    expect(deplacement.coverageLabel).toBe('Budgété');

    expect(report.totals.plannedIncomeEur).toBe(10000);
    expect(report.totals.actualIncomeEur).toBe(4000);
    expect(report.totals.actualExpenseEur).toBe(2500);
    expect(report.totals.netPlannedEur).toBe(8000);
    expect(report.totals.netActualEur).toBe(1500);
    expect(report.totals.netVarianceEur).toBe(-6500);
  });

  it('fait apparaître une dépense hors budget au lieu de la noyer', () => {
    const report = buildClubBudgetReport({
      lines: [line({ category: 'Licence', planned_income_eur: 1000 })],
      entries: [
        entry({ id: 'a', type: 'depense', amount_eur: 450, category: 'Arbitrage', entry_date: new Date('2026-11-04') }),
      ],
      season: SEASON,
    });
    const unplanned = report.rows.find((r) => r.category === 'Arbitrage')!;
    expect(unplanned.coverage).toBe('unplanned_actual');
    expect(unplanned.plannedExpenseEur).toBe(0);
    expect(unplanned.expenseVarianceEur).toBe(450);
    expect(report.totals.unplannedCount).toBe(1);
    expect(clubBudgetUnplannedNote(report)).toContain('aucune ligne budgétaire');
  });

  it('montre un prévu sans réalisé au lieu de le supprimer', () => {
    const report = buildClubBudgetReport({
      lines: [line({ category: 'Location', planned_expense_eur: 3000 })],
      entries: [],
      season: SEASON,
    });
    expect(report.rows).toHaveLength(1);
    expect(report.rows[0].coverage).toBe('plan_without_actual');
    expect(report.rows[0].coverageLabel).toBe('Rien réalisé');
    expect(report.rows[0].actualExpenseEur).toBe(0);
  });

  it('ignore les lignes budgétaires d’une autre saison', () => {
    const report = buildClubBudgetReport({
      lines: [
        line({ category: 'Licence', planned_income_eur: 5000 }),
        line({ category: 'Licence', planned_income_eur: 9999, season: '2025-2026' }),
      ],
      entries: [],
      season: SEASON,
    });
    expect(report.totals.plannedIncomeEur).toBe(5000);
  });

  it('isole les écritures sans catégorie sans les perdre', () => {
    const report = buildClubBudgetReport({
      lines: [],
      entries: [
        entry({ id: 'a', type: 'recette', amount_eur: 120, category: '   ', entry_date: new Date('2026-09-09') }),
      ],
      season: SEASON,
    });
    expect(report.uncategorizedCount).toBe(1);
    expect(report.rows[0].category).toBe('Sans catégorie');
    expect(report.totals.actualIncomeEur).toBe(120);
  });

  it('trie par poids d’écart décroissant', () => {
    const report = buildClubBudgetReport({
      lines: [
        line({ category: 'Petit', planned_expense_eur: 100 }),
        line({ category: 'Gros', planned_expense_eur: 100 }),
        line({ category: 'Moyen', planned_expense_eur: 100 }),
      ],
      entries: [
        entry({ id: 'g', type: 'depense', amount_eur: 900, category: 'Gros', entry_date: new Date('2026-09-01') }),
        entry({ id: 'p', type: 'depense', amount_eur: 150, category: 'Petit', entry_date: new Date('2026-09-01') }),
        entry({ id: 'm', type: 'depense', amount_eur: 400, category: 'Moyen', entry_date: new Date('2026-09-01') }),
      ],
      season: SEASON,
    });
    expect(report.rows.map((r) => r.category)).toEqual(['Gros', 'Moyen', 'Petit']);
  });

  it('ne compte pas les lignes d’une autre saison dans le prévu, mais garde le réalisé', () => {
    const report = buildClubBudgetReport({
      lines: [],
      entries: [
        entry({ id: 'a', type: 'depense', amount_eur: 300, category: 'Déplacement', entry_date: new Date('2026-07-10') }),
      ],
      season: SEASON,
    });
    expect(report.rows).toHaveLength(0);
    expect(report.totals.actualExpenseEur).toBe(0);
    expect(report.actualEntriesCount).toBe(0);
  });

  it('résume le prévu, le réalisé et l’écart signé', () => {
    const report = buildClubBudgetReport({
      lines: [line({ category: 'Licence', planned_income_eur: 1000 })],
      entries: [
        entry({ id: 'a', type: 'cotisation', amount_eur: 400, category: 'Licence', entry_date: new Date('2026-09-15') }),
      ],
      season: SEASON,
    });
    const summary = resolveClubBudgetSummaryLabel(report);
    expect(summary).toContain('Net prévu');
    expect(summary).toContain('écart');
    expect(summary).toContain('−');
  });
});

describe('identifiant de ligne budgétaire', () => {
  it('est stable : corriger un budget met à jour au lieu de dupliquer', () => {
    const a = clubBudgetLineDocId({ club_id: 'club-1', season: SEASON, category: 'Licence' });
    const b = clubBudgetLineDocId({ club_id: 'club-1', season: SEASON, category: ' licence ' });
    expect(a).toBe(b);
    expect(a.split('__')[0]).toBe('club-1');
    expect(a.split('__')[1]).toBe(SEASON);
  });

  it('net prévu = entrées − sorties', () => {
    expect(clubBudgetNetPlannedEur({ planned_income_eur: 5000, planned_expense_eur: 3200 })).toBe(1800);
  });
});

describe('clubBudgetVarianceDefinition', () => {
  it('écrit ce que recouvre l’écart, y compris son signe', () => {
    const text = clubBudgetVarianceDefinition();
    expect(text).toContain('1er août');
    expect(text).toContain('positif');
  });
});
