/**
 * Helpers purs Finances Club — format, ledger, couverture cotisations (testables).
 */
import {
  CLUB_FINANCE_TYPE_LABELS,
  isClubFinanceExpenseType,
  type ClubFinanceEntry,
  type ClubFinanceEntryType,
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
