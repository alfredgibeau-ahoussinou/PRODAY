import { addDoc, collection, getDocs, limit, orderBy, query, serverTimestamp } from 'firebase/firestore';
import { getDb } from '../lib/firebase';
import { isFirebaseConfigured } from '../config/firebase';

export type AdminAuditAction =
  | 'reel_submitted'
  | 'reel_approved'
  | 'reel_rejected'
  | 'reel_deleted'
  | 'user_verified'
  | 'user_rejected'
  | 'user_deleted'
  | 'user_created'
  | 'user_updated'
  | 'club_verified'
  | 'club_deleted'
  | 'message_deleted'
  | 'thread_deleted'
  | 'weekly_response_deleted'
  | 'payment_marked_paid'
  | 'snapshot_recorded'
  | 'platform_config_updated'
  | 'beta_approved'
  | 'beta_rejected'
  | 'beta_deleted'
  | 'sponsor_quote_sent'
  | 'sponsor_quote_email'
  | 'sponsor_quote_note'
  | 'sponsor_quote_docs_requested'
  | 'sponsor_quote_rejected'
  | 'subscription_granted'
  | 'subscription_revoked'
  | 'subscription_changed'
  | 'subscription_extended'
  | 'club_quote_quoted'
  | 'club_quote_status'
  | 'club_commercial_amount_set'
  | 'club_stripe_invoice_sent'
  | 'other';

export interface AdminAuditEntry {
  id: string;
  action: AdminAuditAction;
  actor_uid: string;
  actor_email?: string;
  target_type: string;
  target_id: string;
  summary: string;
  created_at: Date;
}

const COL = 'admin_audit_log';

function toDate(v: unknown): Date {
  if (v && typeof v === 'object' && 'toDate' in v) {
    return (v as { toDate: () => Date }).toDate();
  }
  return new Date();
}

export const adminAuditService = {
  async log(input: {
    action: AdminAuditAction;
    actor_uid: string;
    actor_email?: string;
    target_type: string;
    target_id: string;
    summary: string;
  }): Promise<void> {
    if (!isFirebaseConfigured()) return;
    const database = getDb();
    if (!database) return;
    try {
      await addDoc(collection(database, COL), {
        ...input,
        created_at: serverTimestamp(),
      });
    } catch {
      /* journal optionnel */
    }
  },

  async listRecent(max = 80): Promise<AdminAuditEntry[]> {
    if (!isFirebaseConfigured()) return [];
    const database = getDb();
    if (!database) return [];
    try {
      const snap = await getDocs(
        query(collection(database, COL), orderBy('created_at', 'desc'), limit(max)),
      );
      return snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          action: String(data.action ?? 'other') as AdminAuditAction,
          actor_uid: String(data.actor_uid ?? ''),
          actor_email: data.actor_email ? String(data.actor_email) : undefined,
          target_type: String(data.target_type ?? ''),
          target_id: String(data.target_id ?? ''),
          summary: String(data.summary ?? ''),
          created_at: toDate(data.created_at),
        };
      });
    } catch {
      return [];
    }
  },
};
