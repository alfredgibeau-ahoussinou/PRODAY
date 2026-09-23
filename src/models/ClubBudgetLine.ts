/**
 * Ligne budgétaire club — le **prévu**, par saison et par catégorie.
 *
 * Le prévu est saisi par le club ; il n'est jamais extrapolé du réalisé. Sans ce principe,
 * un « écart » se contenterait de comparer une dépense à elle-même et afficherait
 * toujours zéro.
 *
 * Une ligne = (club, saison, catégorie). L'identifiant est déterministe : corriger un
 * budget met à jour la ligne au lieu d'en ajouter une seconde, ce qui doublerait « prévu »
 * sans que rien ne le signale.
 */

import type { ClubSeasonLabel } from '../utils/clubSeason';
import { slugify } from './ClubFee';

export interface ClubBudgetLine {
  id: string;
  club_id: string;
  season: ClubSeasonLabel;
  category: string;
  /** Prévision d'entrées pour cette catégorie. */
  planned_income_eur: number;
  /** Prévision de sorties pour cette catégorie. */
  planned_expense_eur: number;
  note?: string;
  created_by_uid: string;
  created_by_name?: string;
  created_at: Date;
  updated_at: Date;
}

export interface UpsertClubBudgetLineInput {
  club_id: string;
  season: ClubSeasonLabel;
  category: string;
  planned_income_eur?: number;
  planned_expense_eur?: number;
  note?: string;
  created_by_uid: string;
  created_by_name?: string;
}

export function clubBudgetLineDocId(input: {
  club_id: string;
  season: ClubSeasonLabel;
  category: string;
}): string {
  return [input.club_id.trim(), input.season.trim(), slugify(input.category.trim())].join('__');
}

export function clubBudgetNetPlannedEur(
  line: Pick<ClubBudgetLine, 'planned_income_eur' | 'planned_expense_eur'>,
): number {
  return Math.round((line.planned_income_eur - line.planned_expense_eur) * 100) / 100;
}
