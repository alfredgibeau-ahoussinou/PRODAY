/**
 * Budget club — **prévu vs réalisé**, par saison et par catégorie. Logique pure.
 *
 * Deux principes, et ils suffisent à rendre l'écart interprétable :
 *
 *  1. Le **prévu** vient de lignes saisies par le club. Il n'est jamais extrapolé du
 *     réalisé — sinon l'écart comparerait une dépense à elle-même et vaudrait zéro.
 *  2. Toute catégorie apparaît **des deux côtés** si elle existe d'un seul : une dépense
 *     réelle hors budget doit produire une ligne, pas disparaître faute de prévu.
 *
 * Un écart sans signe serait ambigu : ici, positif = au-dessus du prévu. Pour les
 * dépenses c'est un dépassement, pour les entrées c'est un gain. Le consommateur reçoit
 * les deux montants séparés pour ne pas confondre les deux lectures.
 */

import {
  clubBudgetNetPlannedEur,
  type ClubBudgetLine,
} from '../../../models/ClubBudgetLine';
import type { ClubFinanceEntry } from '../../../models/ClubFinanceEntry';
import { isClubFinanceExpenseType, isClubFinanceIncomeType } from '../../../models/ClubFinanceEntry';
import { isActiveClubFinanceEntry } from './clubFeeModel';
import { formatClubFinanceEur } from './clubFinanceModel';
import {
  clubSeasonBoundsFromLabel,
  formatClubSeasonLabel,
  type ClubSeasonLabel,
} from '../../../utils/clubSeason';

export type ClubBudgetCoverage = 'budgeted' | 'unplanned_actual' | 'plan_without_actual';

export const CLUB_BUDGET_COVERAGE_LABELS: Record<ClubBudgetCoverage, string> = {
  budgeted: 'Budgété',
  unplanned_actual: 'Hors budget',
  plan_without_actual: 'Rien réalisé',
};

export type ClubBudgetVarianceRow = {
  category: string;
  plannedIncomeEur: number;
  plannedExpenseEur: number;
  actualIncomeEur: number;
  actualExpenseEur: number;
  /** Réalisé − prévu. Positif = au-dessus du prévu. */
  incomeVarianceEur: number;
  expenseVarianceEur: number;
  netPlannedEur: number;
  netActualEur: number;
  netVarianceEur: number;
  coverage: ClubBudgetCoverage;
  coverageLabel: string;
  hint: string;
};

export type ClubBudgetReport = {
  season: ClubSeasonLabel;
  /** `false` si le libellé de saison est mal formé : aucun réalisé n'est alors imputé. */
  seasonResolved: boolean;
  rows: ClubBudgetVarianceRow[];
  totals: {
    plannedIncomeEur: number;
    plannedExpenseEur: number;
    actualIncomeEur: number;
    actualExpenseEur: number;
    incomeVarianceEur: number;
    expenseVarianceEur: number;
    netPlannedEur: number;
    netActualEur: number;
    netVarianceEur: number;
    /** Nombre de catégories réelles sans ligne budgétaire correspondante. */
    unplannedCount: number;
  };
  /** Écritures actives de la saison retenues comme réalisé. */
  actualEntriesCount: number;
  /** Écritures actives de la saison sans catégorie exploitable. */
  uncategorizedCount: number;
};

const UNCATEGORIZED = 'Sans catégorie';

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function isEntryInSeason(entry: ClubFinanceEntry, season: ClubSeasonLabel): boolean {
  const bounds = clubSeasonBoundsFromLabel(season);
  if (!bounds) return false;
  const t = entry.entry_date.getTime();
  return t >= bounds.start.getTime() && t < bounds.end.getTime();
}

/**
 * Réalisé d'une saison : écritures actives dont la **date métier** tombe dans la saison.
 *
 * La saison n'est pas stockée sur l'écriture, elle en est dérivée. Recopier la saison
 * créerait deux vérités possibles pour la même ligne ; une correction de date laisserait
 * alors l'écriture dans l'ancienne saison du budget.
 */
export function selectSeasonActualEntries(
  entries: ClubFinanceEntry[],
  season: ClubSeasonLabel,
): ClubFinanceEntry[] {
  return entries.filter((e) => isActiveClubFinanceEntry(e) && isEntryInSeason(e, season));
}

export function buildClubBudgetReport(input: {
  lines: ClubBudgetLine[];
  entries: ClubFinanceEntry[];
  season: ClubSeasonLabel;
}): ClubBudgetReport {
  const seasonResolved = clubSeasonBoundsFromLabel(input.season) !== null;
  const actualEntries = seasonResolved
    ? selectSeasonActualEntries(input.entries, input.season)
    : [];

  type Bucket = {
    plannedIncomeEur: number;
    plannedExpenseEur: number;
    actualIncomeEur: number;
    actualExpenseEur: number;
    hasPlan: boolean;
    hasActual: boolean;
  };
  const buckets = new Map<string, Bucket>();
  const bucketFor = (category: string): Bucket => {
    const existing = buckets.get(category);
    if (existing) return existing;
    const fresh: Bucket = {
      plannedIncomeEur: 0,
      plannedExpenseEur: 0,
      actualIncomeEur: 0,
      actualExpenseEur: 0,
      hasPlan: false,
      hasActual: false,
    };
    buckets.set(category, fresh);
    return fresh;
  };

  for (const line of input.lines) {
    if (line.season !== input.season) continue;
    const category = line.category.trim() || UNCATEGORIZED;
    const bucket = bucketFor(category);
    bucket.plannedIncomeEur += line.planned_income_eur;
    bucket.plannedExpenseEur += line.planned_expense_eur;
    bucket.hasPlan = true;
  }

  let uncategorizedCount = 0;
  for (const entry of actualEntries) {
    const raw = entry.category?.trim() ?? '';
    if (!raw) uncategorizedCount += 1;
    const category = raw || UNCATEGORIZED;
    const bucket = bucketFor(category);
    if (isClubFinanceIncomeType(entry.type)) bucket.actualIncomeEur += entry.amount_eur;
    else if (isClubFinanceExpenseType(entry.type)) bucket.actualExpenseEur += entry.amount_eur;
    bucket.hasActual = true;
  }

  const rows: ClubBudgetVarianceRow[] = [...buckets.entries()].map(([category, b]) => {
    const plannedIncomeEur = round2(b.plannedIncomeEur);
    const plannedExpenseEur = round2(b.plannedExpenseEur);
    const actualIncomeEur = round2(b.actualIncomeEur);
    const actualExpenseEur = round2(b.actualExpenseEur);
    const coverage: ClubBudgetCoverage = b.hasPlan
      ? b.hasActual
        ? 'budgeted'
        : 'plan_without_actual'
      : 'unplanned_actual';
    const incomeVarianceEur = round2(actualIncomeEur - plannedIncomeEur);
    const expenseVarianceEur = round2(actualExpenseEur - plannedExpenseEur);
    const netPlannedEur = round2(plannedIncomeEur - plannedExpenseEur);
    const netActualEur = round2(actualIncomeEur - actualExpenseEur);

    const hintParts = [`Prévu ${formatClubFinanceEur(netPlannedEur)}`];
    if (b.hasActual) hintParts.push(`réalisé ${formatClubFinanceEur(netActualEur)}`);
    if (coverage === 'unplanned_actual') hintParts.push('aucun prévu enregistré');
    if (coverage === 'plan_without_actual') hintParts.push('aucune écriture sur la saison');

    return {
      category,
      plannedIncomeEur,
      plannedExpenseEur,
      actualIncomeEur,
      actualExpenseEur,
      incomeVarianceEur,
      expenseVarianceEur,
      netPlannedEur,
      netActualEur,
      netVarianceEur: round2(netActualEur - netPlannedEur),
      coverage,
      coverageLabel: CLUB_BUDGET_COVERAGE_LABELS[coverage],
      hint: hintParts.join(' · '),
    } satisfies ClubBudgetVarianceRow;
  });

  rows.sort(
    (a, b) =>
      Math.abs(b.netVarianceEur) - Math.abs(a.netVarianceEur) ||
      a.category.localeCompare(b.category),
  );

  const totals = rows.reduce(
    (acc, r) => {
      acc.plannedIncomeEur += r.plannedIncomeEur;
      acc.plannedExpenseEur += r.plannedExpenseEur;
      acc.actualIncomeEur += r.actualIncomeEur;
      acc.actualExpenseEur += r.actualExpenseEur;
      if (r.coverage === 'unplanned_actual') acc.unplannedCount += 1;
      return acc;
    },
    {
      plannedIncomeEur: 0,
      plannedExpenseEur: 0,
      actualIncomeEur: 0,
      actualExpenseEur: 0,
      unplannedCount: 0,
    },
  );

  const netPlannedEur = round2(totals.plannedIncomeEur - totals.plannedExpenseEur);
  const netActualEur = round2(totals.actualIncomeEur - totals.actualExpenseEur);

  return {
    season: input.season,
    seasonResolved,
    rows,
    totals: {
      plannedIncomeEur: round2(totals.plannedIncomeEur),
      plannedExpenseEur: round2(totals.plannedExpenseEur),
      actualIncomeEur: round2(totals.actualIncomeEur),
      actualExpenseEur: round2(totals.actualExpenseEur),
      incomeVarianceEur: round2(totals.actualIncomeEur - totals.plannedIncomeEur),
      expenseVarianceEur: round2(totals.actualExpenseEur - totals.plannedExpenseEur),
      netPlannedEur,
      netActualEur,
      netVarianceEur: round2(netActualEur - netPlannedEur),
      unplannedCount: totals.unplannedCount,
    },
    actualEntriesCount: actualEntries.length,
    uncategorizedCount,
  };
}

export function resolveClubBudgetSummaryLabel(report: ClubBudgetReport): string {
  if (!report.seasonResolved) {
    return 'Saison mal formée : aucun réalisé n’est imputé au budget.';
  }
  if (report.rows.length === 0) {
    return `${formatClubSeasonLabel(report.season)} : aucun budget ni aucune écriture pour l’instant.`;
  }
  const parts = [`Net prévu ${formatClubFinanceEur(report.totals.netPlannedEur)}`];
  parts.push(`net réalisé ${formatClubFinanceEur(report.totals.netActualEur)}`);
  const variance = report.totals.netVarianceEur;
  parts.push(`écart ${variance >= 0 ? '+' : '−'}${formatClubFinanceEur(Math.abs(variance))}`);
  return parts.join(' · ');
}

/**
 * Définition affichée à l'utilisateur : ce que recouvre exactement l'écart.
 */
export function clubBudgetVarianceDefinition(): string {
  return 'Écart = réalisé − prévu, sur les écritures actives dont la date métier tombe dans la saison (1er août → 31 juillet). Un écart positif est un dépassement sur les dépenses et un gain sur les entrées.';
}

export function clubBudgetUnplannedNote(report: ClubBudgetReport): string {
  if (report.totals.unplannedCount === 0) return '';
  return `${report.totals.unplannedCount} catégorie${report.totals.unplannedCount > 1 ? 's' : ''} présente${report.totals.unplannedCount > 1 ? 's' : ''} dans les écritures n’a aucune ligne budgétaire : son écart se lit contre zéro prévu.`;
}
