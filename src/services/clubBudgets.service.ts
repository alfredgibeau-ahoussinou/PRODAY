/**
 * Lignes budgétaires du club — service Firestore réel.
 *
 * Une ligne = (club, saison, catégorie), identifiée de façon déterministe. Corriger le
 * prévu met donc à jour la ligne au lieu d'en créer une seconde : deux lignes pour la même
 * catégorie feraient doublonner le prévu sans que rien ne l'indique à l'écran.
 */

import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore';
import { isFirebaseConfigured } from '../config/firebase';
import { getDb } from '../lib/firebase';
import {
  clubBudgetLineDocId,
  type ClubBudgetLine,
  type UpsertClubBudgetLineInput,
} from '../models/ClubBudgetLine';
import { mapClubBudgetLine } from '../utils/clubFees';
import { isValidClubSeasonLabel, type ClubSeasonLabel } from '../utils/clubSeason';

export const CLUB_BUDGETS_COLLECTION = 'club_budgets';

function normalizeAmount(raw: number | undefined): number {
  const n = typeof raw === 'number' ? raw : 0;
  if (!Number.isFinite(n) || n < 0) {
    throw new Error('Un montant prévu ne peut pas être négatif.');
  }
  return Math.round(n * 100) / 100;
}

export const clubBudgetsService = {
  async listByClub(clubId: string, season: ClubSeasonLabel): Promise<ClubBudgetLine[]> {
    if (!isFirebaseConfigured() || !clubId || !isValidClubSeasonLabel(season)) return [];
    const database = getDb();
    if (!database) return [];
    try {
      const snap = await getDocs(
        query(
          collection(database, CLUB_BUDGETS_COLLECTION),
          where('club_id', '==', clubId),
          where('season', '==', season),
          limit(300),
        ),
      );
      return snap.docs
        .map((d) => mapClubBudgetLine(d.id, d.data() as Record<string, unknown>))
        .sort((a, b) => a.category.localeCompare(b.category));
    } catch {
      return [];
    }
  },

  /**
   * Crée ou met à jour la ligne. Les champs absents du patch sont conservés : régler une
   * seule des deux colonnes ne doit pas remettre l'autre à zéro.
   */
  async upsertLine(input: UpsertClubBudgetLineInput): Promise<ClubBudgetLine> {
    if (!input.club_id?.trim()) throw new Error('Club requis.');
    if (!input.created_by_uid?.trim()) throw new Error('Auteur requis.');
    if (!isValidClubSeasonLabel(input.season)) {
      throw new Error('Saison requise au format AAAA-AAAA (ex. 2026-2027).');
    }
    const category = input.category.trim();
    if (!category) throw new Error('Catégorie requise.');

    const plannedIncome = normalizeAmount(input.planned_income_eur);
    const plannedExpense = normalizeAmount(input.planned_expense_eur);
    const lineId = clubBudgetLineDocId({ club_id: input.club_id, season: input.season, category });
    const now = new Date();

    const local: ClubBudgetLine = {
      id: lineId,
      club_id: input.club_id,
      season: input.season,
      category,
      planned_income_eur: plannedIncome,
      planned_expense_eur: plannedExpense,
      note: input.note?.trim() || undefined,
      created_by_uid: input.created_by_uid,
      created_by_name: input.created_by_name?.trim() || undefined,
      created_at: now,
      updated_at: now,
    };

    if (!isFirebaseConfigured()) return local;
    const database = getDb();
    if (!database) return local;

    await setDoc(
      doc(database, CLUB_BUDGETS_COLLECTION, lineId),
      {
        club_id: local.club_id,
        season: local.season,
        category: local.category,
        planned_income_eur: local.planned_income_eur,
        planned_expense_eur: local.planned_expense_eur,
        note: local.note ?? null,
        created_by_uid: local.created_by_uid,
        created_by_name: local.created_by_name ?? null,
        updated_at: serverTimestamp(),
      },
      { merge: true },
    );
    return local;
  },

  async removeLine(lineId: string): Promise<void> {
    if (!lineId) throw new Error('Identifiant requis.');
    if (!isFirebaseConfigured()) return;
    const database = getDb();
    if (!database) return;
    await deleteDoc(doc(database, CLUB_BUDGETS_COLLECTION, lineId));
  },
};
