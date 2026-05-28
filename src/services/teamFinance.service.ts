import {
  addDoc,
  collection,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { getDb } from '../lib/firebase';
import { isFirebaseConfigured } from '../config/firebase';
import type {
  TeamPaymentRequest,
  TeamPaymentStatus,
  CreateTeamPaymentRequestInput,
} from '../models/TeamFinance';
import { callFunction } from '../lib/firebaseFunctions';

const COL = 'team_payment_requests';

function toDate(value: unknown): Date {
  if (
    value &&
    typeof value === 'object' &&
    'toDate' in value &&
    typeof (value as { toDate: () => Date }).toDate === 'function'
  ) {
    return (value as { toDate: () => Date }).toDate();
  }
  if (typeof value === 'string' || typeof value === 'number') return new Date(value);
  return new Date();
}

function mapPayment(id: string, data: Record<string, unknown>): TeamPaymentRequest {
  return {
    id,
    club_id: String(data.club_id ?? ''),
    label: String(data.label ?? ''),
    amount_eur: Number(data.amount_eur ?? 0),
    due_at: toDate(data.due_at),
    member_uid: String(data.member_uid ?? ''),
    member_name: String(data.member_name ?? ''),
    status: (data.status as TeamPaymentStatus) ?? 'pending',
    payment_method: data.payment_method as TeamPaymentRequest['payment_method'],
    stripe_checkout_session_id: data.stripe_checkout_session_id as string | undefined,
    paid_at: data.paid_at ? toDate(data.paid_at) : undefined,
    created_by_uid: String(data.created_by_uid ?? ''),
    created_at: toDate(data.created_at),
    updated_at: toDate(data.updated_at),
  };
}

export const teamFinanceService = {
  async listByClub(clubId: string, max = 80): Promise<TeamPaymentRequest[]> {
    if (!clubId || !isFirebaseConfigured()) return [];
    const database = getDb();
    if (!database) return [];

    try {
      const q = query(
        collection(database, COL),
        where('club_id', '==', clubId),
        orderBy('due_at', 'asc'),
        limit(max)
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => mapPayment(d.id, d.data() as Record<string, unknown>));
    } catch {
      const qFallback = query(
        collection(database, COL),
        where('club_id', '==', clubId),
        limit(max)
      );
      const snap = await getDocs(qFallback);
      return snap.docs
        .map((d) => mapPayment(d.id, d.data() as Record<string, unknown>))
        .sort((a, b) => a.due_at.getTime() - b.due_at.getTime());
    }
  },

  async listByMember(memberUid: string, max = 40): Promise<TeamPaymentRequest[]> {
    if (!memberUid || !isFirebaseConfigured()) return [];
    const database = getDb();
    if (!database) return [];

    try {
      const q = query(
        collection(database, COL),
        where('member_uid', '==', memberUid),
        orderBy('due_at', 'desc'),
        limit(max)
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => mapPayment(d.id, d.data() as Record<string, unknown>));
    } catch {
      const snap = await getDocs(
        query(collection(database, COL), where('member_uid', '==', memberUid), limit(max))
      );
      return snap.docs
        .map((d) => mapPayment(d.id, d.data() as Record<string, unknown>))
        .sort((a, b) => b.due_at.getTime() - a.due_at.getTime());
    }
  },

  async createBulkForClub(
    clubId: string,
    members: { uid: string; name: string }[],
    options: {
      label: string;
      amount_eur: number;
      due_at: Date;
      created_by_uid: string;
    }
  ): Promise<number> {
    let n = 0;
    for (const m of members) {
      await this.create({
        club_id: clubId,
        label: options.label,
        amount_eur: options.amount_eur,
        due_at: options.due_at,
        member_uid: m.uid,
        member_name: m.name,
        created_by_uid: options.created_by_uid,
      });
      n += 1;
    }
    return n;
  },

  async create(input: CreateTeamPaymentRequestInput): Promise<string> {
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');

    const ref = await addDoc(collection(database, COL), {
      club_id: input.club_id,
      label: input.label.trim(),
      amount_eur: input.amount_eur,
      due_at: Timestamp.fromDate(input.due_at),
      member_uid: input.member_uid,
      member_name: input.member_name.trim(),
      status: 'pending',
      created_by_uid: input.created_by_uid,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    });
    return ref.id;
  },

  async setStatus(
    requestId: string,
    status: TeamPaymentStatus,
    paidAt?: Date
  ): Promise<void> {
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');
    await updateDoc(doc(database, COL, requestId), {
      status,
      paid_at: status === 'paid' ? Timestamp.fromDate(paidAt ?? new Date()) : null,
      updated_at: serverTimestamp(),
    });
  },

  async markOverdueByClub(clubId: string): Promise<number> {
    const list = await this.listByClub(clubId, 200);
    const now = Date.now();
    const overdue = list.filter(
      (p) => p.status === 'pending' && p.due_at.getTime() < now
    );
    for (const p of overdue) {
      await this.setStatus(p.id, 'late');
    }
    return overdue.length;
  },

  async startOnlinePayment(requestId: string): Promise<{ url: string }> {
    return callFunction<{ requestId: string }, { url: string }>(
      'createPaymentCheckoutSession',
      { requestId }
    );
  },

  toCsv(rows: TeamPaymentRequest[]): string {
    const header = [
      'member_name',
      'label',
      'amount_eur',
      'status',
      'due_at',
      'paid_at',
    ].join(',');
    const lines = rows.map((r) =>
      [
        JSON.stringify(r.member_name),
        JSON.stringify(r.label),
        r.amount_eur,
        r.status,
        r.due_at.toISOString(),
        r.paid_at ? r.paid_at.toISOString() : '',
      ].join(',')
    );
    return [header, ...lines].join('\n');
  },
};
