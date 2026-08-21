import type {
  ClubFinanceEntry,
  ClubFinanceEntryStatus,
  ClubFinanceEntryType,
  ClubFinanceTotals,
} from '../models/ClubFinanceEntry';
import {
  isClubFinanceExpenseType,
  isClubFinanceIncomeType,
} from '../models/ClubFinanceEntry';

const VALID_TYPES: ClubFinanceEntryType[] = ['cotisation', 'depense', 'recette', 'autre'];
const VALID_STATUSES: ClubFinanceEntryStatus[] = ['active', 'cancelled'];

function toDate(v: unknown): Date {
  if (v instanceof Date) return v;
  if (v && typeof v === 'object' && 'toDate' in v) {
    return (v as { toDate: () => Date }).toDate();
  }
  if (typeof v === 'string' || typeof v === 'number') {
    const d = new Date(v);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return new Date(0);
}

export function normalizeClubFinanceType(raw: unknown): ClubFinanceEntryType {
  const t = String(raw ?? '');
  return VALID_TYPES.includes(t as ClubFinanceEntryType)
    ? (t as ClubFinanceEntryType)
    : 'autre';
}

export function normalizeClubFinanceStatus(raw: unknown): ClubFinanceEntryStatus {
  const s = String(raw ?? '');
  return VALID_STATUSES.includes(s as ClubFinanceEntryStatus)
    ? (s as ClubFinanceEntryStatus)
    : 'active';
}

export function normalizeClubFinanceAmount(raw: unknown): number {
  const n = typeof raw === 'number' ? raw : Number(raw);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.round(n * 100) / 100;
}

/** Mapper Firestore → modèle (pur, testable sans Firebase). */
export function mapClubFinanceEntry(
  id: string,
  data: Record<string, unknown>,
): ClubFinanceEntry {
  return {
    id,
    club_id: String(data.club_id ?? ''),
    type: normalizeClubFinanceType(data.type),
    amount_eur: normalizeClubFinanceAmount(data.amount_eur),
    label: String(data.label ?? '').trim() || 'Sans libellé',
    category: String(data.category ?? 'Divers').trim() || 'Divers',
    entry_date: toDate(data.entry_date ?? data.created_at),
    created_by_uid: String(data.created_by_uid ?? ''),
    created_by_name: data.created_by_name ? String(data.created_by_name) : undefined,
    member_uid: data.member_uid ? String(data.member_uid) : null,
    member_name: data.member_name ? String(data.member_name) : null,
    team_id: data.team_id ? String(data.team_id) : null,
    status: normalizeClubFinanceStatus(data.status),
    created_at: toDate(data.created_at),
    updated_at: toDate(data.updated_at),
    deleted_at: data.deleted_at ? toDate(data.deleted_at) : null,
  };
}

/** Totaux actifs uniquement. */
export function computeClubFinanceTotals(entries: ClubFinanceEntry[]): ClubFinanceTotals {
  const active = entries.filter((e) => e.status === 'active' && !e.deleted_at);
  let recettes_eur = 0;
  let depenses_eur = 0;
  for (const e of active) {
    if (isClubFinanceIncomeType(e.type)) recettes_eur += e.amount_eur;
    else if (isClubFinanceExpenseType(e.type)) depenses_eur += e.amount_eur;
  }
  recettes_eur = Math.round(recettes_eur * 100) / 100;
  depenses_eur = Math.round(depenses_eur * 100) / 100;
  return {
    recettes_eur,
    depenses_eur,
    solde_eur: Math.round((recettes_eur - depenses_eur) * 100) / 100,
    count: active.length,
  };
}
