/**
 * Échéance de cotisation club — **ce qui est dû**, par opposition au ledger qui enregistre
 * ce qui a été encaissé.
 *
 * Cette distinction est le cœur de l'extension : sans « dû », un « impayé » ne peut être
 * qu'un chiffre inventé. Une échéance est donc un objet à part entière, créé explicitement
 * par le club (montant, date, adhérent), et jamais déduit d'une absence d'écriture.
 */

import type { ClubSeasonLabel } from '../utils/clubSeason';

export type ClubFeeStatus = 'active' | 'cancelled';

export interface ClubFee {
  id: string;
  club_id: string;
  season: ClubSeasonLabel;
  label: string;
  category: string;
  /** Montant brut dû pour la saison, avant remise. */
  amount_due_eur: number;
  /** Remise accordée (fratrie, bourse…). Ne rend jamais le net négatif. */
  discount_eur: number;
  /** Date d'échéance — la seule base légitime d'un « en retard ». */
  due_date: Date;
  member_uid: string | null;
  member_name: string | null;
  team_id: string | null;
  status: ClubFeeStatus;
  created_by_uid: string;
  created_by_name?: string;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date | null;
}

export interface CreateClubFeeInput {
  club_id: string;
  season: ClubSeasonLabel;
  label?: string;
  category?: string;
  amount_due_eur: number;
  discount_eur?: number;
  due_date: Date;
  member_uid?: string | null;
  member_name?: string | null;
  team_id?: string | null;
  created_by_uid: string;
  created_by_name?: string;
}

export interface UpdateClubFeeInput {
  label?: string;
  category?: string;
  amount_due_eur?: number;
  discount_eur?: number;
  due_date?: Date;
  member_uid?: string | null;
  member_name?: string | null;
  team_id?: string | null;
  status?: ClubFeeStatus;
}

export const CLUB_FEE_DEFAULT_CATEGORY = 'Cotisation';

/**
 * Net dû = brut − remise, borné à zéro. Une remise supérieure au montant dû doit être
 * refusée à la saisie ; le plancher à zéro évite qu'une donnée déjà enregistrée produise
 * un « dû négatif » qui viendrait réduire artificiellement le total des impayés.
 */
export function clubFeeNetDueEur(fee: Pick<ClubFee, 'amount_due_eur' | 'discount_eur'>): number {
  const net = fee.amount_due_eur - fee.discount_eur;
  return Math.round(Math.max(0, net) * 100) / 100;
}

/** Identifiant de périmètre : un UID prime toujours sur un nom. */
export function clubFeeScopeKey(input: {
  member_uid?: string | null;
  member_name?: string | null;
}): string {
  const uid = input.member_uid?.trim();
  if (uid) return `u-${uid}`;
  return `n-${slugify(input.member_name ?? '')}`;
}

export function slugify(raw: string): string {
  return raw
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'sans-nom';
}

/**
 * Identifiant de document **déterministe** : `club__saison__portée__catégorie`.
 *
 * C'est ce qui rend l'attribution d'une cotisation d'équipe entière **réexécutable sans
 * doublonner** : rejouer la même affectation écrit le même document. Un identifiant
 * aléatoire créerait deux échéances pour la même personne, et deux « dus » pour un seul
 * adhérent — le total des impayés doublerait sans que rien ne le signale.
 */
export function clubFeeDocId(input: {
  club_id: string;
  season: ClubSeasonLabel;
  member_uid?: string | null;
  member_name?: string | null;
  category?: string;
}): string {
  const category = slugify(input.category?.trim() || CLUB_FEE_DEFAULT_CATEGORY);
  return [
    input.club_id.trim(),
    input.season.trim(),
    clubFeeScopeKey(input),
    category,
  ].join('__');
}

export function defaultClubFeeLabel(input: {
  season: ClubSeasonLabel;
  member_name?: string | null;
  category?: string;
}): string {
  const category = input.category?.trim() || CLUB_FEE_DEFAULT_CATEGORY;
  const member = input.member_name?.trim();
  return member ? `${category} ${input.season} — ${member}` : `${category} ${input.season}`;
}
