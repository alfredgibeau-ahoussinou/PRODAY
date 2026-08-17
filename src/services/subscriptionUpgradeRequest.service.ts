import {
  addDoc,
  collection,
  doc,
  getDoc,
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
import type { SubscriptionPlanId } from '../content/subscriptionPlans';
import type { User } from '../models/User';
import type {
  SubscriptionUpgradeRequest,
  SubscriptionUpgradeRequestStatus,
} from '../models/SubscriptionUpgradeRequest';

function parseTimestamp(value: unknown): Date | undefined {
  if (!value) return undefined;
  if (value instanceof Date) return value;
  if (typeof value === 'object' && value !== null && 'toDate' in value) {
    return (value as { toDate: () => Date }).toDate();
  }
  return undefined;
}

function requestFromFirestore(id: string, data: Record<string, unknown>): SubscriptionUpgradeRequest {
  return {
    id,
    user_uid: String(data.user_uid ?? ''),
    plan_id: String(data.plan_id ?? '') as SubscriptionPlanId,
    role: String(data.role ?? 'player') as User['role'],
    display_name: String(data.display_name ?? ''),
    email: String(data.email ?? ''),
    billing: data.billing === 'yearly' ? 'yearly' : 'monthly',
    status: (data.status as SubscriptionUpgradeRequestStatus) ?? 'pending',
    message: data.message ? String(data.message) : undefined,
    admin_note: data.admin_note ? String(data.admin_note) : undefined,
    created_at: parseTimestamp(data.created_at) ?? new Date(),
    approved_at: parseTimestamp(data.approved_at),
    rejected_at: parseTimestamp(data.rejected_at),
    updated_at: parseTimestamp(data.updated_at),
  };
}

function sortByCreatedDesc(requests: SubscriptionUpgradeRequest[]): SubscriptionUpgradeRequest[] {
  return [...requests].sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
}

export const subscriptionUpgradeRequestService = {
  async submitRequest(input: {
    user: User;
    planId: SubscriptionPlanId;
    billing?: 'monthly' | 'yearly';
    message?: string;
  }): Promise<{ ok: boolean; messageKey: string }> {
    if (!isFirebaseConfigured()) {
      return { ok: false, messageKey: 'subscription.betaRequest.error.firebase' };
    }
    const database = getDb();
    if (!database) {
      return { ok: false, messageKey: 'subscription.betaRequest.error.firebase' };
    }

    const uid = input.user.uid;
    if (!uid) {
      return { ok: false, messageKey: 'subscription.betaRequest.error.profile' };
    }

    try {
      const pendingQ = query(
        collection(database, 'subscription_upgrade_requests'),
        where('user_uid', '==', uid),
        where('status', '==', 'pending'),
        limit(1),
      );
      const pending = await getDocs(pendingQ);
      if (!pending.empty) {
        return { ok: true, messageKey: 'subscription.betaRequest.success.pending' };
      }
    } catch {
      // index composite absent — on tente la création
    }

    await addDoc(collection(database, 'subscription_upgrade_requests'), {
      user_uid: uid,
      plan_id: input.planId,
      role: input.user.role,
      display_name: input.user.display_name?.trim() || 'Compte ProDay',
      email: input.user.email?.trim() || '',
      billing: input.billing ?? 'monthly',
      status: 'pending',
      message: input.message?.trim() || null,
      source: 'beta',
      created_at: serverTimestamp(),
    });

    return { ok: true, messageKey: 'subscription.betaRequest.success.pending' };
  },

  async getLatestForUser(uid: string): Promise<SubscriptionUpgradeRequest | null> {
    if (!isFirebaseConfigured() || !uid) return null;
    const database = getDb();
    if (!database) return null;

    try {
      const q = query(
        collection(database, 'subscription_upgrade_requests'),
        where('user_uid', '==', uid),
        orderBy('created_at', 'desc'),
        limit(1),
      );
      const snap = await getDocs(q);
      const docSnap = snap.docs[0];
      if (!docSnap) return null;
      return requestFromFirestore(docSnap.id, docSnap.data() as Record<string, unknown>);
    } catch {
      try {
        const q = query(
          collection(database, 'subscription_upgrade_requests'),
          where('user_uid', '==', uid),
          limit(20),
        );
        const snap = await getDocs(q);
        const rows = snap.docs.map((d) =>
          requestFromFirestore(d.id, d.data() as Record<string, unknown>),
        );
        return sortByCreatedDesc(rows)[0] ?? null;
      } catch {
        return null;
      }
    }
  },

  async listPendingForAdmin(max = 50): Promise<SubscriptionUpgradeRequest[]> {
    if (!isFirebaseConfigured()) return [];
    const database = getDb();
    if (!database) return [];

    try {
      const q = query(
        collection(database, 'subscription_upgrade_requests'),
        where('status', '==', 'pending'),
        orderBy('created_at', 'desc'),
        limit(max),
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => requestFromFirestore(d.id, d.data() as Record<string, unknown>));
    } catch {
      const snap = await getDocs(collection(database, 'subscription_upgrade_requests'));
      return sortByCreatedDesc(
        snap.docs
          .map((d) => requestFromFirestore(d.id, d.data() as Record<string, unknown>))
          .filter((r) => r.status === 'pending'),
      ).slice(0, max);
    }
  },

  async updateRequestStatus(
    requestId: string,
    nextStatus: Exclude<SubscriptionUpgradeRequestStatus, 'pending'>,
    note?: string,
  ): Promise<{ ok: boolean; messageKey: string }> {
    if (!isFirebaseConfigured()) {
      return { ok: false, messageKey: 'admin.subscriptionRequest.error.firebase' };
    }
    const database = getDb();
    if (!database) {
      return { ok: false, messageKey: 'admin.subscriptionRequest.error.firebase' };
    }

    const trimmedNote = note?.trim();
    const patch: Record<string, unknown> = {
      status: nextStatus,
      updated_at: serverTimestamp(),
    };
    if (trimmedNote) patch.admin_note = trimmedNote;
    if (nextStatus === 'approved') patch.approved_at = serverTimestamp();
    if (nextStatus === 'rejected') patch.rejected_at = serverTimestamp();

    try {
      await updateDoc(doc(database, 'subscription_upgrade_requests', requestId), patch);
      return { ok: true, messageKey: `admin.subscriptionRequest.success.${nextStatus}` };
    } catch {
      return { ok: false, messageKey: 'admin.subscriptionRequest.error.update' };
    }
  },

  async getById(requestId: string): Promise<SubscriptionUpgradeRequest | null> {
    if (!isFirebaseConfigured()) return null;
    const database = getDb();
    if (!database) return null;
    const snap = await getDoc(doc(database, 'subscription_upgrade_requests', requestId));
    if (!snap.exists()) return null;
    return requestFromFirestore(snap.id, snap.data() as Record<string, unknown>);
  },
};
