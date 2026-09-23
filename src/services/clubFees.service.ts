/**
 * Échéances de cotisation club — service Firestore réel.
 *
 * L'identifiant de document est **déterministe** (voir `clubFeeDocId`). C'est ce qui
 * permet de préparer une saison entière sans doubler les échéances. Mais un identifiant
 * déterministe ouvre un risque symétrique : **écraser** une échéance déjà ajustée à la
 * main (remise accordée, date décalée). Le service refuse donc ce cas au lieu de choisir
 * en silence — l'appelant doit demander explicitement `overwrite: true`.
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { isFirebaseConfigured } from '../config/firebase';
import { getDb } from '../lib/firebase';
import {
  CLUB_FEE_DEFAULT_CATEGORY,
  clubFeeDocId,
  clubFeeNetDueEur,
  defaultClubFeeLabel,
  type ClubFee,
  type CreateClubFeeInput,
  type UpdateClubFeeInput,
} from '../models/ClubFee';
import { mapClubFee } from '../utils/clubFees';
import { isValidClubSeasonLabel, type ClubSeasonLabel } from '../utils/clubSeason';

export const CLUB_FEES_COLLECTION = 'club_fees';

export type ClubFeeUpsertOutcome = 'created' | 'unchanged' | 'updated' | 'skipped_conflict';

export type ClubFeeUpsertResult = {
  outcome: ClubFeeUpsertOutcome;
  fee: ClubFee;
  /** Énoncé exploitable quand rien n'a été écrit. */
  message?: string;
};

function isActiveFee(fee: ClubFee): boolean {
  return fee.status === 'active' && !fee.deleted_at;
}

function sameTerms(existing: ClubFee, next: { amount_due_eur: number; discount_eur: number; due_date: Date }): boolean {
  return (
    existing.amount_due_eur === next.amount_due_eur &&
    existing.discount_eur === next.discount_eur &&
    existing.due_date.getTime() === next.due_date.getTime()
  );
}

function buildLocalFee(input: CreateClubFeeInput, id: string, now: Date): ClubFee {
  const category = input.category?.trim() || CLUB_FEE_DEFAULT_CATEGORY;
  const amountDue = Math.round(input.amount_due_eur * 100) / 100;
  const discount = Math.round(Math.max(0, input.discount_eur ?? 0) * 100) / 100;
  return {
    id,
    club_id: input.club_id,
    season: input.season,
    label: input.label?.trim() || defaultClubFeeLabel({ season: input.season, member_name: input.member_name, category }),
    category,
    amount_due_eur: amountDue,
    discount_eur: discount,
    due_date: input.due_date,
    member_uid: input.member_uid ?? null,
    member_name: input.member_name ?? null,
    team_id: input.team_id ?? null,
    status: 'active',
    created_by_uid: input.created_by_uid,
    created_by_name: input.created_by_name,
    created_at: now,
    updated_at: now,
    deleted_at: null,
  };
}

export const clubFeesService = {
  async listByClub(clubId: string, season?: ClubSeasonLabel | null): Promise<ClubFee[]> {
    if (!isFirebaseConfigured() || !clubId) return [];
    const database = getDb();
    if (!database) return [];

    const filters = [where('club_id', '==', clubId)];
    if (season && isValidClubSeasonLabel(season)) filters.push(where('season', '==', season));

    try {
      const snap = await getDocs(
        query(collection(database, CLUB_FEES_COLLECTION), ...filters, limit(500)),
      );
      return snap.docs
        .map((d) => mapClubFee(d.id, d.data() as Record<string, unknown>))
        .filter(isActiveFee)
        .sort((a, b) => b.due_date.getTime() - a.due_date.getTime());
    } catch {
      return [];
    }
  },

  /**
   * Crée l'échéance, ou signale pourquoi elle ne l'a pas été.
   *
   * Ne jette pas sur conflit : un lot de 40 cotisations dont 3 sont déjà ajustées doit
   * produire 37 créations et 3 refus motivés, pas un abandon silencieux de tout le lot.
   */
  async createOrSkip(
    input: CreateClubFeeInput,
    options: { overwrite?: boolean } = {},
  ): Promise<ClubFeeUpsertResult> {
    if (!input.club_id?.trim()) throw new Error('Club requis.');
    if (!input.created_by_uid?.trim()) throw new Error('Auteur requis.');
    if (!isValidClubSeasonLabel(input.season)) {
      throw new Error('Saison requise au format AAAA-AAAA (ex. 2026-2027).');
    }
    const amountDue = Math.round(input.amount_due_eur * 100) / 100;
    if (!(amountDue > 0)) throw new Error('Le montant dû doit être supérieur à zéro.');
    const discount = Math.round(Math.max(0, input.discount_eur ?? 0) * 100) / 100;
    if (discount > amountDue) {
      throw new Error('La remise ne peut pas dépasser le montant dû.');
    }
    if (!(input.due_date instanceof Date) || Number.isNaN(input.due_date.getTime())) {
      throw new Error('Date d’échéance requise.');
    }
    if (!input.member_uid?.trim() && !input.member_name?.trim()) {
      throw new Error('Adhérent requis : une échéance vise une personne précise.');
    }

    const feeId = clubFeeDocId(input);
    const now = new Date();
    const local = buildLocalFee({ ...input, amount_due_eur: amountDue, discount_eur: discount }, feeId, now);

    if (!isFirebaseConfigured()) {
      return { outcome: 'created', fee: local };
    }
    const database = getDb();
    if (!database) return { outcome: 'created', fee: local };

    const ref = doc(database, CLUB_FEES_COLLECTION, feeId);
    const existingSnap = await getDoc(ref);
    const payload = {
      club_id: local.club_id,
      season: local.season,
      label: local.label,
      category: local.category,
      amount_due_eur: local.amount_due_eur,
      discount_eur: local.discount_eur,
      due_date: local.due_date,
      member_uid: local.member_uid,
      member_name: local.member_name,
      team_id: local.team_id,
      status: 'active' as const,
    };

    if (!existingSnap.exists()) {
      await setDoc(ref, {
        ...payload,
        created_by_uid: local.created_by_uid,
        created_by_name: local.created_by_name ?? null,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
        deleted_at: null,
      });
      return { outcome: 'created', fee: local };
    }

    const existing = mapClubFee(existingSnap.id, existingSnap.data() as Record<string, unknown>);
    if (existing.status === 'cancelled' || existing.deleted_at) {
      return {
        outcome: 'skipped_conflict',
        fee: existing,
        message: 'Une échéance annulée existe déjà pour cet adhérent et cette catégorie : elle n’est pas réactivée automatiquement.',
      };
    }
    if (sameTerms(existing, local)) {
      return { outcome: 'unchanged', fee: existing };
    }
    if (!options.overwrite) {
      return {
        outcome: 'skipped_conflict',
        fee: existing,
        message: `Une échéance existe déjà pour cet adhérent (${clubFeeNetDueEur(existing)} € au ${existing.due_date.toLocaleDateString('fr-FR')}). Elle n’a pas été remplacée : confirmez pour l’écraser.`,
      };
    }

    await setDoc(
      ref,
      {
        ...payload,
        created_by_uid: existing.created_by_uid,
        created_by_name: existing.created_by_name ?? null,
        created_at: existingSnap.data().created_at ?? serverTimestamp(),
        updated_at: serverTimestamp(),
        deleted_at: null,
      },
      { merge: false },
    );
    return { outcome: 'updated', fee: { ...local, created_at: existing.created_at } };
  },

  async update(feeId: string, patch: UpdateClubFeeInput): Promise<void> {
    if (!feeId) throw new Error('Identifiant requis.');
    if (!isFirebaseConfigured()) return;
    const database = getDb();
    if (!database) return;

    const payload: Record<string, unknown> = { updated_at: serverTimestamp() };
    if (patch.label !== undefined) {
      const label = patch.label.trim();
      if (!label) throw new Error('Libellé requis.');
      payload.label = label;
    }
    if (patch.category !== undefined) payload.category = patch.category.trim() || CLUB_FEE_DEFAULT_CATEGORY;
    if (patch.amount_due_eur !== undefined) {
      const amount = Math.round(patch.amount_due_eur * 100) / 100;
      if (!(amount > 0)) throw new Error('Le montant dû doit être supérieur à zéro.');
      payload.amount_due_eur = amount;
    }
    if (patch.discount_eur !== undefined) {
      const discount = Math.round(Math.max(0, patch.discount_eur) * 100) / 100;
      payload.discount_eur = discount;
    }
    if (patch.due_date !== undefined) payload.due_date = patch.due_date;
    if (patch.member_uid !== undefined) payload.member_uid = patch.member_uid;
    if (patch.member_name !== undefined) payload.member_name = patch.member_name;
    if (patch.team_id !== undefined) payload.team_id = patch.team_id;
    if (patch.status !== undefined) payload.status = patch.status;

    await updateDoc(doc(database, CLUB_FEES_COLLECTION, feeId), payload);
  },

  /** Annulation : l'échéance sort des totaux, elle n'est pas effacée. */
  async cancel(feeId: string): Promise<void> {
    if (!feeId) throw new Error('Identifiant requis.');
    if (!isFirebaseConfigured()) return;
    const database = getDb();
    if (!database) return;
    await updateDoc(doc(database, CLUB_FEES_COLLECTION, feeId), {
      status: 'cancelled',
      deleted_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    });
  },
};
