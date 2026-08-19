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
  ClubEquipmentListing,
  EquipmentCondition,
  EquipmentCategory,
  EquipmentListingKind,
} from '../models/ClubEquipmentListing';

const COL = 'club_equipment_listings';

function toDate(v: unknown): Date {
  if (v instanceof Date) return v;
  if (v && typeof v === 'object' && 'toDate' in v) {
    return (v as { toDate: () => Date }).toDate();
  }
  return new Date(0);
}

function mapListing(id: string, data: Record<string, unknown>): ClubEquipmentListing {
  return {
    id,
    club_id: String(data.club_id ?? ''),
    kind: (data.kind as EquipmentListingKind) ?? 'sell',
    title: String(data.title ?? ''),
    description: String(data.description ?? ''),
    category: String(data.category ?? 'autre'),
    size: data.size ? String(data.size) : undefined,
    condition: (data.condition as EquipmentCondition) ?? 'used',
    price_cents: typeof data.price_cents === 'number' ? data.price_cents : null,
    photo_urls: Array.isArray(data.photo_urls) ? data.photo_urls.map(String) : [],
    author_uid: String(data.author_uid ?? ''),
    author_is_minor: data.author_is_minor === true,
    guardian_uid: data.guardian_uid ? String(data.guardian_uid) : null,
    visibility: 'club_members',
    club_validated_at: data.club_validated_at ? toDate(data.club_validated_at) : null,
    created_at: toDate(data.created_at),
    updated_at: toDate(data.updated_at),
    status: (data.status as ClubEquipmentListing['status']) ?? 'draft',
    buyer_uid: data.buyer_uid ? String(data.buyer_uid) : null,
    sold_at: data.sold_at ? toDate(data.sold_at) : null,
  };
}

export const clubEquipmentService = {
  async listForClub(clubId: string, max = 40): Promise<ClubEquipmentListing[]> {
    if (!isFirebaseConfigured() || !clubId) return [];
    const database = getDb();
    if (!database) return [];
    try {
      const snap = await getDocs(
        query(
          collection(database, COL),
          where('club_id', '==', clubId),
          where('status', 'in', ['published', 'draft']),
          orderBy('created_at', 'desc'),
          limit(max),
        ),
      );
      return snap.docs.map((d) => mapListing(d.id, d.data() as Record<string, unknown>));
    } catch {
      const snap = await getDocs(
        query(collection(database, COL), where('club_id', '==', clubId), limit(max)),
      );
      return snap.docs
        .map((d) => mapListing(d.id, d.data() as Record<string, unknown>))
        .filter((l) => l.status === 'published' || l.status === 'draft')
        .sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
    }
  },

  async create(input: {
    club_id: string;
    author_uid: string;
    author_is_minor: boolean;
    guardian_uid?: string | null;
    kind: EquipmentListingKind;
    title: string;
    description: string;
    category: string;
    size?: string;
    condition: EquipmentCondition;
    price_cents: number | null;
    publish?: boolean;
  }): Promise<ClubEquipmentListing> {
    const now = new Date();
    const local: ClubEquipmentListing = {
      id: `local_${Date.now()}`,
      club_id: input.club_id,
      kind: input.kind,
      title: input.title.trim(),
      description: input.description.trim(),
      category: input.category,
      size: input.size,
      condition: input.condition,
      price_cents: input.price_cents,
      photo_urls: [],
      author_uid: input.author_uid,
      author_is_minor: input.author_is_minor,
      guardian_uid: input.guardian_uid ?? null,
      visibility: 'club_members',
      created_at: now,
      updated_at: now,
      status: input.publish ? 'published' : 'draft',
    };
    if (!isFirebaseConfigured()) return local;
    const database = getDb();
    if (!database) return local;
    const ref = await addDoc(collection(database, COL), {
      club_id: local.club_id,
      kind: local.kind,
      title: local.title,
      description: local.description,
      category: local.category,
      size: local.size ?? null,
      condition: local.condition,
      price_cents: local.price_cents,
      photo_urls: [],
      author_uid: local.author_uid,
      author_is_minor: local.author_is_minor,
      guardian_uid: local.guardian_uid,
      visibility: 'club_members',
      club_validated_at: null,
      status: local.status,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    });
    return { ...local, id: ref.id };
  },

  async report(id: string): Promise<void> {
    if (!isFirebaseConfigured()) return;
    const database = getDb();
    if (!database) return;
    await updateDoc(doc(database, COL, id), {
      status: 'reported',
      updated_at: serverTimestamp(),
    });
  },

  async remove(id: string): Promise<void> {
    if (!isFirebaseConfigured()) return;
    const database = getDb();
    if (!database) return;
    await updateDoc(doc(database, COL, id), {
      status: 'removed',
      updated_at: serverTimestamp(),
    });
  },

  async validateByClub(id: string): Promise<void> {
    if (!isFirebaseConfigured()) return;
    const database = getDb();
    if (!database) return;
    await updateDoc(doc(database, COL, id), {
      club_validated_at: serverTimestamp(),
      status: 'published',
      updated_at: serverTimestamp(),
    });
  },

  async markAsSold(id: string, buyerUid?: string): Promise<void> {
    if (!isFirebaseConfigured()) return;
    const database = getDb();
    if (!database) return;
    await updateDoc(doc(database, COL, id), {
      status: 'sold',
      buyer_uid: buyerUid ?? null,
      sold_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    });
  },

  async markAsGiven(id: string, receiverUid?: string): Promise<void> {
    if (!isFirebaseConfigured()) return;
    const database = getDb();
    if (!database) return;
    await updateDoc(doc(database, COL, id), {
      status: 'given',
      buyer_uid: receiverUid ?? null,
      sold_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    });
  },

  async update(
    id: string,
    fields: Partial<Pick<ClubEquipmentListing, 'title' | 'description' | 'category' | 'size' | 'condition' | 'price_cents' | 'kind'>>,
  ): Promise<void> {
    if (!isFirebaseConfigured()) return;
    const database = getDb();
    if (!database) return;
    const payload: Record<string, unknown> = { updated_at: serverTimestamp() };
    if (fields.title !== undefined) payload.title = fields.title.trim();
    if (fields.description !== undefined) payload.description = fields.description.trim();
    if (fields.category !== undefined) payload.category = fields.category;
    if (fields.size !== undefined) payload.size = fields.size || null;
    if (fields.condition !== undefined) payload.condition = fields.condition;
    if (fields.price_cents !== undefined) payload.price_cents = fields.price_cents;
    if (fields.kind !== undefined) payload.kind = fields.kind;
    await updateDoc(doc(database, COL, id), payload);
  },
};
