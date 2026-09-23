/**
 * Mappers purs Firestore → modèles pour les échéances de cotisation et les lignes
 * budgétaires. Aucun accès réseau : testables directement.
 */

import type { ClubBudgetLine } from '../models/ClubBudgetLine';
import { CLUB_FEE_DEFAULT_CATEGORY, type ClubFee, type ClubFeeStatus } from '../models/ClubFee';
import { toDate } from './clubFinance';

function toAmount(raw: unknown): number {
  const n = typeof raw === 'number' ? raw : Number(raw);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.round(n * 100) / 100;
}

function toOptionalString(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  return trimmed ? trimmed : null;
}

function normalizeFeeStatus(raw: unknown): ClubFeeStatus {
  return String(raw ?? '') === 'cancelled' ? 'cancelled' : 'active';
}

export function mapClubFee(id: string, data: Record<string, unknown>): ClubFee {
  return {
    id,
    club_id: String(data.club_id ?? '').trim(),
    season: String(data.season ?? '').trim(),
    label: String(data.label ?? '').trim(),
    category: String(data.category ?? '').trim() || CLUB_FEE_DEFAULT_CATEGORY,
    amount_due_eur: toAmount(data.amount_due_eur),
    discount_eur: toAmount(data.discount_eur),
    due_date: toDate(data.due_date),
    member_uid: toOptionalString(data.member_uid),
    member_name: toOptionalString(data.member_name),
    team_id: toOptionalString(data.team_id),
    status: normalizeFeeStatus(data.status),
    created_by_uid: String(data.created_by_uid ?? ''),
    created_by_name: toOptionalString(data.created_by_name) ?? undefined,
    created_at: toDate(data.created_at),
    updated_at: toDate(data.updated_at),
    deleted_at: data.deleted_at ? toDate(data.deleted_at) : null,
  };
}

export function mapClubBudgetLine(id: string, data: Record<string, unknown>): ClubBudgetLine {
  return {
    id,
    club_id: String(data.club_id ?? '').trim(),
    season: String(data.season ?? '').trim(),
    category: String(data.category ?? '').trim(),
    planned_income_eur: toAmount(data.planned_income_eur),
    planned_expense_eur: toAmount(data.planned_expense_eur),
    note: toOptionalString(data.note) ?? undefined,
    created_by_uid: String(data.created_by_uid ?? ''),
    created_by_name: toOptionalString(data.created_by_name) ?? undefined,
    created_at: toDate(data.created_at),
    updated_at: toDate(data.updated_at),
  };
}
