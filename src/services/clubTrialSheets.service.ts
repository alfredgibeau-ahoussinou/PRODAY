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
  ClubTrialSheet,
  CreateClubTrialSheetInput,
  TrialSheetRatingKey,
} from '../models/ClubTrialSheet';
import { canViewTrialSheet } from '../models/ClubTrialSheet';

const COL = 'club_trial_sheets';

function toDate(v: unknown): Date {
  if (v instanceof Date) return v;
  if (v && typeof v === 'object' && 'toDate' in v) {
    return (v as { toDate: () => Date }).toDate();
  }
  return new Date(0);
}

function mapSheet(id: string, data: Record<string, unknown>): ClubTrialSheet {
  return {
    id,
    club_id: String(data.club_id ?? ''),
    first_name: String(data.first_name ?? ''),
    last_name: String(data.last_name ?? ''),
    birth_year: typeof data.birth_year === 'number' ? data.birth_year : 0,
    position: String(data.position ?? ''),
    target_team_label: data.target_team_label ? String(data.target_team_label) : undefined,
    trial_date: toDate(data.trial_date),
    coach_uid: String(data.coach_uid ?? ''),
    coach_name: String(data.coach_name ?? ''),
    ratings: (data.ratings as Partial<Record<TrialSheetRatingKey, number>>) ?? {},
    overall: typeof data.overall === 'number' ? data.overall : null,
    notes: data.notes ? String(data.notes) : undefined,
    is_minor: data.is_minor === true,
    parental_consent_at: data.parental_consent_at ? toDate(data.parental_consent_at) : null,
    authorized_uids: Array.isArray(data.authorized_uids)
      ? data.authorized_uids.map(String)
      : [],
    created_at: toDate(data.created_at),
    updated_at: toDate(data.updated_at),
    deleted_at: data.deleted_at ? toDate(data.deleted_at) : null,
  };
}

export const clubTrialSheetsService = {
  async listForClub(clubId: string, viewerUid: string, max = 40): Promise<ClubTrialSheet[]> {
    if (!isFirebaseConfigured() || !clubId) return [];
    const database = getDb();
    if (!database) return [];
    try {
      const snap = await getDocs(
        query(
          collection(database, COL),
          where('club_id', '==', clubId),
          orderBy('created_at', 'desc'),
          limit(max),
        ),
      );
      return snap.docs
        .map((d) => mapSheet(d.id, d.data() as Record<string, unknown>))
        .filter((s) => canViewTrialSheet(s, viewerUid));
    } catch {
      const snap = await getDocs(
        query(collection(database, COL), where('club_id', '==', clubId), limit(max)),
      );
      return snap.docs
        .map((d) => mapSheet(d.id, d.data() as Record<string, unknown>))
        .filter((s) => canViewTrialSheet(s, viewerUid));
    }
  },

  async create(input: CreateClubTrialSheetInput): Promise<ClubTrialSheet> {
    const now = new Date();
    const local: ClubTrialSheet = {
      id: `local_${Date.now()}`,
      ...input,
      ratings: {},
      overall: null,
      authorized_uids: [...new Set([input.coach_uid, ...input.authorized_uids])],
      created_at: now,
      updated_at: now,
      parental_consent_at: null,
      deleted_at: null,
    };
    if (!isFirebaseConfigured()) return local;
    const database = getDb();
    if (!database) return local;
    const ref = await addDoc(collection(database, COL), {
      club_id: input.club_id,
      first_name: input.first_name.trim(),
      last_name: input.last_name.trim(),
      birth_year: input.birth_year,
      position: input.position.trim(),
      target_team_label: input.target_team_label?.trim() || null,
      trial_date: input.trial_date.toISOString(),
      coach_uid: input.coach_uid,
      coach_name: input.coach_name,
      ratings: {},
      overall: null,
      notes: null,
      is_minor: input.is_minor,
      parental_consent_at: null,
      authorized_uids: local.authorized_uids,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
      deleted_at: null,
    });
    return { ...local, id: ref.id };
  },

  async updateRatings(
    id: string,
    patch: {
      ratings?: Partial<Record<TrialSheetRatingKey, number>>;
      overall?: number | null;
      notes?: string;
    },
  ): Promise<void> {
    if (!isFirebaseConfigured()) return;
    const database = getDb();
    if (!database) return;
    await updateDoc(doc(database, COL, id), {
      ...(patch.ratings ? { ratings: patch.ratings } : {}),
      overall: patch.overall ?? null,
      notes: patch.notes?.trim() || null,
      updated_at: serverTimestamp(),
    });
  },

  async softDelete(id: string): Promise<void> {
    if (!isFirebaseConfigured()) return;
    const database = getDb();
    if (!database) return;
    await updateDoc(doc(database, COL, id), {
      deleted_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    });
  },

  async recordParentalConsent(id: string): Promise<void> {
    if (!isFirebaseConfigured()) return;
    const database = getDb();
    if (!database) return;
    await updateDoc(doc(database, COL, id), {
      parental_consent_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    });
  },
};
