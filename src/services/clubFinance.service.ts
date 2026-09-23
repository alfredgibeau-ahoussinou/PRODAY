import {
  addDoc,
  collection,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { getDb } from '../lib/firebase';
import { isFirebaseConfigured } from '../config/firebase';
import type {
  ClubFinanceEntry,
  CreateClubFinanceEntryInput,
  UpdateClubFinanceEntryInput,
} from '../models/ClubFinanceEntry';
import {
  computeClubFinanceTotals,
  mapClubFinanceEntry,
  normalizeClubFinanceAmount,
  normalizeClubFinanceStatus,
  normalizeClubFinanceType,
} from '../utils/clubFinance';

export const CLUB_FINANCE_COLLECTION = 'club_finance_entries';
export { computeClubFinanceTotals, mapClubFinanceEntry } from '../utils/clubFinance';

function isActiveEntry(e: ClubFinanceEntry): boolean {
  return e.status === 'active' && !e.deleted_at;
}

export const clubFinanceService = {
  async listByClub(clubId: string, max = 80): Promise<ClubFinanceEntry[]> {
    if (!isFirebaseConfigured() || !clubId) return [];
    const database = getDb();
    if (!database) return [];

    const mapAndFilter = (docs: { id: string; data: () => Record<string, unknown> }[]) =>
      docs
        .map((d) => mapClubFinanceEntry(d.id, d.data()))
        .filter(isActiveEntry)
        .sort((a, b) => b.entry_date.getTime() - a.entry_date.getTime())
        .slice(0, max);

    try {
      const snap = await getDocs(
        query(
          collection(database, CLUB_FINANCE_COLLECTION),
          where('club_id', '==', clubId),
          where('status', '==', 'active'),
          orderBy('entry_date', 'desc'),
          limit(max),
        ),
      );
      return snap.docs
        .map((d) => mapClubFinanceEntry(d.id, d.data() as Record<string, unknown>))
        .filter((e) => !e.deleted_at);
    } catch {
      try {
        const snap = await getDocs(
          query(
            collection(database, CLUB_FINANCE_COLLECTION),
            where('club_id', '==', clubId),
            orderBy('entry_date', 'desc'),
            limit(max * 2),
          ),
        );
        return mapAndFilter(
          snap.docs.map((d) => ({
            id: d.id,
            data: () => d.data() as Record<string, unknown>,
          })),
        );
      } catch {
        const snap = await getDocs(
          query(
            collection(database, CLUB_FINANCE_COLLECTION),
            where('club_id', '==', clubId),
            limit(max * 2),
          ),
        );
        return mapAndFilter(
          snap.docs.map((d) => ({
            id: d.id,
            data: () => d.data() as Record<string, unknown>,
          })),
        );
      }
    }
  },

  async create(input: CreateClubFinanceEntryInput): Promise<ClubFinanceEntry> {
    const amount = normalizeClubFinanceAmount(input.amount_eur);
    if (amount <= 0) throw new Error('Le montant doit être positif.');
    const label = input.label.trim();
    if (!label) throw new Error('Libellé requis.');
    if (!input.club_id || !input.created_by_uid) {
      throw new Error('Club et auteur requis.');
    }

    const now = new Date();
    const entryDate = input.entry_date ?? now;
    const local: ClubFinanceEntry = {
      id: `local_${Date.now()}`,
      club_id: input.club_id,
      type: normalizeClubFinanceType(input.type),
      amount_eur: amount,
      label,
      category: (input.category ?? 'Divers').trim() || 'Divers',
      entry_date: entryDate,
      created_by_uid: input.created_by_uid,
      created_by_name: input.created_by_name?.trim() || undefined,
      member_uid: input.member_uid ?? null,
      member_name: input.member_name ?? null,
      team_id: input.team_id ?? null,
      status: 'active',
      payment_method: input.payment_method ?? null,
      payment_provenance: 'manual',
      fee_id: input.fee_id ?? null,
      receipt: input.receipt ?? null,
      created_at: now,
      updated_at: now,
      deleted_at: null,
    };

    if (!isFirebaseConfigured()) return local;
    const database = getDb();
    if (!database) return local;

    const ref = await addDoc(collection(database, CLUB_FINANCE_COLLECTION), {
      club_id: local.club_id,
      type: local.type,
      amount_eur: local.amount_eur,
      label: local.label,
      category: local.category,
      entry_date: entryDate,
      created_by_uid: local.created_by_uid,
      created_by_name: local.created_by_name ?? null,
      member_uid: local.member_uid,
      member_name: local.member_name,
      team_id: local.team_id,
      status: 'active',
      payment_method: local.payment_method,
      // Écrit littéralement : aucune valeur « confirmé par un prestataire » n'existe côté client.
      payment_provenance: 'manual',
      fee_id: local.fee_id,
      receipt: local.receipt
        ? { name: local.receipt.name, url: local.receipt.url, uploaded_at: local.receipt.uploaded_at }
        : null,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
      deleted_at: null,
    });
    return { ...local, id: ref.id };
  },

  async update(entryId: string, patch: UpdateClubFinanceEntryInput): Promise<void> {
    if (!entryId) throw new Error('Identifiant requis.');
    if (!isFirebaseConfigured()) return;
    const database = getDb();
    if (!database) return;

    const payload: Record<string, unknown> = { updated_at: serverTimestamp() };
    if (patch.type !== undefined) payload.type = normalizeClubFinanceType(patch.type);
    if (patch.amount_eur !== undefined) {
      const amount = normalizeClubFinanceAmount(patch.amount_eur);
      if (amount <= 0) throw new Error('Le montant doit être positif.');
      payload.amount_eur = amount;
    }
    if (patch.label !== undefined) {
      const label = patch.label.trim();
      if (!label) throw new Error('Libellé requis.');
      payload.label = label;
    }
    if (patch.category !== undefined) {
      payload.category = patch.category.trim() || 'Divers';
    }
    if (patch.entry_date !== undefined) payload.entry_date = patch.entry_date;
    if (patch.member_uid !== undefined) payload.member_uid = patch.member_uid;
    if (patch.member_name !== undefined) payload.member_name = patch.member_name;
    if (patch.team_id !== undefined) payload.team_id = patch.team_id;
    if (patch.status !== undefined) payload.status = normalizeClubFinanceStatus(patch.status);
    if (patch.payment_method !== undefined) payload.payment_method = patch.payment_method;
    if (patch.fee_id !== undefined) payload.fee_id = patch.fee_id;
    if (patch.receipt !== undefined) payload.receipt = patch.receipt;
    // `payment_provenance` n'est jamais modifiable: il n'a qu'une valeur possible.

    await updateDoc(doc(database, CLUB_FINANCE_COLLECTION, entryId), payload);
  },

  async softDelete(entryId: string): Promise<void> {
    if (!entryId) throw new Error('Identifiant requis.');
    if (!isFirebaseConfigured()) return;
    const database = getDb();
    if (!database) return;
    await updateDoc(doc(database, CLUB_FINANCE_COLLECTION, entryId), {
      status: 'cancelled',
      deleted_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    });
  },
};
