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
import { adminAuditService } from './adminAudit.service';

export type ClubQuoteRequestInput = {
  club_name: string;
  owner_name: string;
  role?: string;
  members?: string;
  teams?: string;
  coaches?: string;
  categories?: string;
  needs?: string;
  video_gear?: string;
  phone?: string;
  email: string;
  requester_uid?: string;
  offer_hint?: 'club_premium' | 'club_video_pro';
};

export type ClubQuoteStatus =
  | 'pending'
  | 'quoted'
  | 'accepted'
  | 'refused'
  | 'negotiating'
  | 'archived';

export type ClubQuoteRequest = {
  id: string;
  club_name: string;
  owner_name: string;
  role?: string;
  members?: string;
  teams?: string;
  coaches?: string;
  categories?: string;
  needs?: string;
  video_gear?: string;
  phone?: string;
  email: string;
  requester_uid?: string;
  offer_hint?: 'club_premium' | 'club_video_pro';
  status: ClubQuoteStatus;
  source?: string;
  price_per_member_eur?: number;
  members_count?: number;
  discount_pct?: number;
  options_note?: string;
  quoted_total_eur?: number;
  admin_note?: string;
  created_at?: Date;
  updated_at?: Date;
  quoted_at?: Date;
};

function parseTs(value: unknown): Date | undefined {
  if (!value) return undefined;
  if (value instanceof Date) return value;
  if (typeof value === 'object' && value !== null && 'toDate' in value) {
    return (value as { toDate: () => Date }).toDate();
  }
  return undefined;
}

function fromFirestore(id: string, data: Record<string, unknown>): ClubQuoteRequest {
  return {
    id,
    club_name: String(data.club_name ?? ''),
    owner_name: String(data.owner_name ?? ''),
    role: data.role ? String(data.role) : undefined,
    members: data.members ? String(data.members) : undefined,
    teams: data.teams ? String(data.teams) : undefined,
    coaches: data.coaches ? String(data.coaches) : undefined,
    categories: data.categories ? String(data.categories) : undefined,
    needs: data.needs ? String(data.needs) : undefined,
    video_gear: data.video_gear ? String(data.video_gear) : undefined,
    phone: data.phone ? String(data.phone) : undefined,
    email: String(data.email ?? ''),
    requester_uid: data.requester_uid ? String(data.requester_uid) : undefined,
    offer_hint:
      data.offer_hint === 'club_video_pro' ? 'club_video_pro' : 'club_premium',
    status: (data.status as ClubQuoteStatus) || 'pending',
    source: data.source ? String(data.source) : undefined,
    price_per_member_eur:
      typeof data.price_per_member_eur === 'number'
        ? data.price_per_member_eur
        : undefined,
    members_count:
      typeof data.members_count === 'number' ? data.members_count : undefined,
    discount_pct:
      typeof data.discount_pct === 'number' ? data.discount_pct : undefined,
    options_note: data.options_note ? String(data.options_note) : undefined,
    quoted_total_eur:
      typeof data.quoted_total_eur === 'number' ? data.quoted_total_eur : undefined,
    admin_note: data.admin_note ? String(data.admin_note) : undefined,
    created_at: parseTs(data.created_at),
    updated_at: parseTs(data.updated_at),
    quoted_at: parseTs(data.quoted_at),
  };
}

export function computeClubQuoteTotal(input: {
  membersCount: number;
  pricePerMember: number;
  discountPct?: number;
  optionsEur?: number;
}): number {
  const base = Math.max(0, input.membersCount) * Math.max(0, input.pricePerMember);
  const discount = Math.min(100, Math.max(0, input.discountPct ?? 0));
  const afterDiscount = base * (1 - discount / 100);
  return Math.round((afterDiscount + Math.max(0, input.optionsEur ?? 0)) * 100) / 100;
}

/**
 * Demandes de devis Club — source unique `club_quote_requests`.
 */
export const clubQuoteService = {
  async submit(input: ClubQuoteRequestInput): Promise<string> {
    if (!isFirebaseConfigured()) {
      throw new Error('Firebase non configuré');
    }
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');

    const email = input.email.trim().toLowerCase();
    const clubName = input.club_name.trim();
    const ownerName = input.owner_name.trim();
    if (!email || !clubName || !ownerName) {
      throw new Error('Club, responsable et email sont requis.');
    }

    const ref = await addDoc(collection(database, 'club_quote_requests'), {
      club_name: clubName,
      owner_name: ownerName,
      role: input.role?.trim() || null,
      members: input.members?.trim() || null,
      teams: input.teams?.trim() || null,
      coaches: input.coaches?.trim() || null,
      categories: input.categories?.trim() || null,
      needs: input.needs?.trim() || null,
      video_gear: input.video_gear?.trim() || null,
      phone: input.phone?.trim() || null,
      email,
      requester_uid: input.requester_uid ?? null,
      offer_hint: input.offer_hint ?? 'club_premium',
      status: 'pending',
      source: 'app',
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    });
    return ref.id;
  },

  async listForAdmin(status?: ClubQuoteStatus | 'all', max = 80): Promise<ClubQuoteRequest[]> {
    if (!isFirebaseConfigured()) return [];
    const database = getDb();
    if (!database) return [];

    try {
      const col = collection(database, 'club_quote_requests');
      const q =
        status && status !== 'all'
          ? query(col, where('status', '==', status), orderBy('created_at', 'desc'), limit(max))
          : query(col, orderBy('created_at', 'desc'), limit(max));
      const snap = await getDocs(q);
      return snap.docs.map((d) => fromFirestore(d.id, d.data() as Record<string, unknown>));
    } catch {
      try {
        const snap = await getDocs(
          query(collection(database, 'club_quote_requests'), limit(max)),
        );
        const rows = snap.docs.map((d) =>
          fromFirestore(d.id, d.data() as Record<string, unknown>),
        );
        return rows
          .filter((r) => !status || status === 'all' || r.status === status)
          .sort(
            (a, b) => (b.created_at?.getTime() ?? 0) - (a.created_at?.getTime() ?? 0),
          );
      } catch {
        return [];
      }
    }
  },

  async applyQuote(
    quoteId: string,
    input: {
      pricePerMember: number;
      membersCount: number;
      discountPct?: number;
      optionsEur?: number;
      optionsNote?: string;
      adminNote?: string;
      adminUid: string;
      adminEmail?: string;
    },
  ): Promise<{ total: number }> {
    if (!isFirebaseConfigured()) throw new Error('Firebase non configuré');
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');

    const total = computeClubQuoteTotal({
      membersCount: input.membersCount,
      pricePerMember: input.pricePerMember,
      discountPct: input.discountPct,
      optionsEur: input.optionsEur,
    });

    await updateDoc(doc(database, 'club_quote_requests', quoteId), {
      status: 'quoted',
      price_per_member_eur: input.pricePerMember,
      members_count: input.membersCount,
      discount_pct: input.discountPct ?? 0,
      options_note: input.optionsNote?.trim() || null,
      quoted_total_eur: total,
      admin_note: input.adminNote?.trim() || null,
      quoted_at: serverTimestamp(),
      updated_at: serverTimestamp(),
      quoted_by: input.adminUid,
    });

    await adminAuditService.log({
      action: 'club_quote_quoted',
      actor_uid: input.adminUid,
      actor_email: input.adminEmail,
      target_type: 'club_quote_request',
      target_id: quoteId,
      summary: `Devis club ${total} € (${input.pricePerMember} €/adhérent × ${input.membersCount})`,
    });

    return { total };
  },

  async setStatus(
    quoteId: string,
    status: ClubQuoteStatus,
    adminUid: string,
    note?: string,
    adminEmail?: string,
  ): Promise<void> {
    if (!isFirebaseConfigured()) throw new Error('Firebase non configuré');
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');

    await updateDoc(doc(database, 'club_quote_requests', quoteId), {
      status,
      admin_note: note?.trim() || null,
      updated_at: serverTimestamp(),
    });

    await adminAuditService.log({
      action: 'club_quote_status',
      actor_uid: adminUid,
      actor_email: adminEmail,
      target_type: 'club_quote_request',
      target_id: quoteId,
      summary: `Statut devis → ${status}${note ? ` · ${note}` : ''}`,
    });
  },
};
