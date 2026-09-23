/**
 * Helpers purs Finances Club — format, ledger, couverture cotisations (testables).
 */
import {
  CLUB_FINANCE_TYPE_LABELS,
  isClubFinanceExpenseType,
  isClubFinanceIncomeType,
  type ClubFinanceEntry,
  type ClubFinanceEntryType,
  type ClubFinanceTotals,
} from '../../../models/ClubFinanceEntry';
import { CLUB_SEASON_START_MONTH, clubSeasonBoundsForDate } from '../../../utils/clubSeason';

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

/** Disclaimer honnête — pas de SEPA / prélèvement auto. */
export function clubFinanceHonestyNote(): string {
  return 'Enregistrement manuel des encaissements. Pas de prélèvement SEPA automatique ni d’impayés inventés.';
}

export type ClubFinanceLedgerFilter = 'all' | 'cotisation' | 'depense' | 'recette';

export function filterClubFinanceEntries(
  entries: ClubFinanceEntry[],
  filter: ClubFinanceLedgerFilter,
): ClubFinanceEntry[] {
  if (filter === 'all') return entries;
  return entries.filter((e) => e.type === filter);
}

export type ClubFinanceLedgerRowModel = {
  id: string;
  label: string;
  meta: string;
  amountLabel: string;
  isExpense: boolean;
  typeLabel: string;
  /** Cotisation encaissée = payé enregistré. */
  statusLabel?: string;
};

export function buildClubFinanceLedgerRow(entry: ClubFinanceEntry): ClubFinanceLedgerRowModel {
  const isExpense = isClubFinanceExpenseType(entry.type);
  const typeLabel = CLUB_FINANCE_TYPE_LABELS[entry.type];
  const member = entry.member_name?.trim() || null;
  const metaParts = [
    typeLabel,
    entry.category,
    formatClubFinanceEntryDate(entry.entry_date),
    member,
  ].filter(Boolean);

  return {
    id: entry.id,
    label: entry.label.trim() || 'Sans libellé',
    meta: metaParts.join(' · '),
    amountLabel: `${isExpense ? '−' : '+'}${formatClubFinanceEur(entry.amount_eur)}`,
    isExpense,
    typeLabel,
    statusLabel: entry.type === 'cotisation' ? 'Payé' : undefined,
  };
}

export type ClubCotisationSummary = {
  count: number;
  totalEur: number;
  label: string;
};

export function summarizeClubCotisations(entries: ClubFinanceEntry[]): ClubCotisationSummary {
  const cotis = entries.filter((e) => e.type === 'cotisation' && e.status === 'active' && !e.deleted_at);
  const totalEur = cotis.reduce((s, e) => s + e.amount_eur, 0);
  if (cotis.length === 0) {
    return {
      count: 0,
      totalEur: 0,
      label: 'Aucune cotisation enregistrée',
    };
  }
  return {
    count: cotis.length,
    totalEur,
    label: `${cotis.length} cotisation${cotis.length > 1 ? 's' : ''} · ${formatClubFinanceEur(totalEur)} encaissés`,
  };
}

export type CotisationCoverageRow = {
  key: string;
  name: string;
  status: 'paid' | 'none';
  statusLabel: string;
  amountEur?: number;
  hint: string;
};

/**
 * Couverture cotisations vs adhérents joueurs.
 * « none » = aucune écriture enregistrée (pas un impayé SEPA inventé).
 */
export function buildCotisationCoverage(input: {
  playerMembers: { uid: string; display_name: string }[];
  entries: ClubFinanceEntry[];
  limitUnrecorded?: number;
}): {
  summary: ClubCotisationSummary;
  paid: CotisationCoverageRow[];
  unrecorded: CotisationCoverageRow[];
} {
  const summary = summarizeClubCotisations(input.entries);
  const cotis = input.entries.filter(
    (e) => e.type === 'cotisation' && e.status === 'active' && !e.deleted_at,
  );

  const paidByUid = new Map<string, ClubFinanceEntry>();
  const paidOrphan: CotisationCoverageRow[] = [];

  for (const e of cotis) {
    if (e.member_uid) {
      const prev = paidByUid.get(e.member_uid);
      if (!prev || e.amount_eur >= prev.amount_eur) paidByUid.set(e.member_uid, e);
    } else {
      paidOrphan.push({
        key: e.id,
        name: e.member_name?.trim() || e.label,
        status: 'paid',
        statusLabel: 'Payé',
        amountEur: e.amount_eur,
        hint: `${formatClubFinanceEur(e.amount_eur)} · ${formatClubFinanceEntryDate(e.entry_date)}`,
      });
    }
  }

  const paid: CotisationCoverageRow[] = [];
  for (const m of input.playerMembers) {
    const e = paidByUid.get(m.uid);
    if (e) {
      paid.push({
        key: m.uid,
        name: m.display_name,
        status: 'paid',
        statusLabel: 'Payé',
        amountEur: e.amount_eur,
        hint: `${formatClubFinanceEur(e.amount_eur)} · ${formatClubFinanceEntryDate(e.entry_date)}`,
      });
    }
  }
  paid.push(...paidOrphan);

  const unrecorded: CotisationCoverageRow[] = [];
  for (const m of input.playerMembers) {
    if (paidByUid.has(m.uid)) continue;
    unrecorded.push({
      key: m.uid,
      name: m.display_name,
      status: 'none',
      statusLabel: 'Non enregistré',
      hint: 'Aucune cotisation au ledger pour cet adhérent',
    });
  }

  const limit = input.limitUnrecorded ?? 8;
  return {
    summary,
    paid: paid.slice(0, 12),
    unrecorded: unrecorded.slice(0, limit),
  };
}

export function matchMemberFromName(
  name: string,
  members: { uid: string; display_name: string }[],
): { uid: string; display_name: string } | null {
  const q = name.trim().toLowerCase();
  if (!q) return null;
  const exact = members.find((m) => m.display_name.trim().toLowerCase() === q);
  if (exact) return exact;
  const partial = members.find((m) => m.display_name.trim().toLowerCase().includes(q));
  return partial ?? null;
}

export function defaultCotisationLabel(memberName?: string): string {
  const season = new Date().getFullYear();
  if (memberName?.trim()) return `Cotisation ${season} — ${memberName.trim()}`;
  return `Cotisation saison ${season}`;
}

export type { ClubFinanceEntryType };

/* ------------------------------------------------------------------ *
 * Périodes et ventilation — calculé, jamais inventé
 * ------------------------------------------------------------------ */

/**
 * Périodes proposées. `season` suit la convention du football français : la saison
 * commence le **1er août** et finit le **31 juillet**. Le seuil est écrit ici, une fois,
 * et affiché à l'utilisateur (`CLUB_FINANCE_PERIOD_DEFINITION`) : un intervalle choisi
 * implicitement serait un chiffre que personne ne peut vérifier.
 */
export type ClubFinancePeriod = 'all' | 'month' | 'lastMonth' | 'season';

/** Réexporté depuis `utils/clubSeason` — une seule définition de la saison dans le projet. */
export const CLUB_FINANCE_SEASON_START_MONTH = CLUB_SEASON_START_MONTH;

export const CLUB_FINANCE_PERIOD_LABELS: Record<ClubFinancePeriod, string> = {
  all: 'Tout',
  month: 'Ce mois',
  lastMonth: 'Mois dernier',
  season: 'Saison',
};

export const CLUB_FINANCE_PERIOD_DEFINITION =
  'Ce mois : mois calendaire en cours. Mois dernier : mois calendaire précédent. Saison : du 1er août au 31 juillet.';

export function clubFinanceSeasonBounds(now: Date): { start: Date; end: Date } {
  return clubSeasonBoundsForDate(now);
}

/** Bornes d'une période. `null` = pas de filtré (tout l'historique). */
export function clubFinancePeriodRange(
  period: ClubFinancePeriod,
  now: Date = new Date(),
): { start: Date; end: Date } | null {
  if (period === 'all') return null;
  if (period === 'month') {
    return {
      start: new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0),
      end: new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0, 0),
    };
  }
  if (period === 'lastMonth') {
    return {
      start: new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0),
      end: new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0),
    };
  }
  return clubFinanceSeasonBounds(now);
}

/**
 * Écritures actives de la période. Une écriture annulée ou supprimée n'entre **jamais**
 * dans un total : c'est la règle qui rend un solde cohérent avec le registre.
 */
export function filterClubFinanceByPeriod(
  entries: ClubFinanceEntry[],
  period: ClubFinancePeriod,
  now: Date = new Date(),
): ClubFinanceEntry[] {
  const active = entries.filter((e) => e.status === 'active' && !e.deleted_at);
  const range = clubFinancePeriodRange(period, now);
  if (!range) return active;
  return active.filter(
    (e) => e.entry_date.getTime() >= range.start.getTime() && e.entry_date.getTime() < range.end.getTime(),
  );
}

export type ClubFinanceCategoryRow = {
  category: string;
  incomeEur: number;
  expenseEur: number;
  netEur: number;
  count: number;
};

/**
 * Ventilation par catégorie des écritures reçues (déjà filtrées par période en amont).
 *
 * La catégorie vide est regroupée sous « Sans catégorie » — un libellé explicite plutôt
 * qu'une ligne anonyme. Le tri se fait sur le **poids** (valeur absolue du net) : une
 * grosse dépense doit remonter, pas disparaître en bas de liste.
 */
export function buildClubFinanceCategoryBreakdown(
  entries: ClubFinanceEntry[],
): ClubFinanceCategoryRow[] {
  const byCategory = new Map<string, ClubFinanceCategoryRow>();
  for (const e of entries) {
    const category = e.category?.trim() || 'Sans catégorie';
    const row =
      byCategory.get(category) ??
      ({ category, incomeEur: 0, expenseEur: 0, netEur: 0, count: 0 } satisfies ClubFinanceCategoryRow);
    const isIncome = isClubFinanceIncomeType(e.type);
    if (isIncome) row.incomeEur += e.amount_eur;
    else row.expenseEur += e.amount_eur;
    row.netEur = row.incomeEur - row.expenseEur;
    row.count += 1;
    byCategory.set(category, row);
  }
  return [...byCategory.values()].sort(
    (a, b) => Math.abs(b.netEur) - Math.abs(a.netEur) || a.category.localeCompare(b.category),
  );
}

/**
 * Ce qui manque, dans le modèle de données, pour parler d'« impayés » ou d'« attendu ».
 *
 * Dit explicitement à l'écran plutôt que rempli par un montant par défaut : sans montant dû
 * ni échéance enregistrés, tout « reste à recouvrer » serait une donnée inventée.
 */
export function clubFinanceOutstandingPrerequisites(): string {
  return 'Un « reste à recouvrer » se calcule dans la section « Cotisations dues », à partir des montants dus et de leurs échéances. Tant que le club n’en a enregistré aucun, aucun impayé n’est calculable ici : c’est un état du club, pas une impossibilité du produit.';
}

/**
 * Statut réel d'une écriture vis-à-vis des moyens de paiement : le registre ne stocke ni
 * moyen de paiement ni confirmation d'un prestataire. Toute écriture est donc une **saisie
 * manuelle**, et le dire évite de laisser croire à un rapprochement bancaire.
 */
export function clubFinancePaymentProvenanceNote(): string {
  return 'Saisie manuelle : le moyen de paiement est celui déclaré par le club. Aucun encaissement n’est confirmé par un prestataire ni rapproché d’un relevé bancaire.';
}
