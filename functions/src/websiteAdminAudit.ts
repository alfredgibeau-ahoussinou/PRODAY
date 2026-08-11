import * as admin from 'firebase-admin';

const COL = 'admin_audit_log';

export type WebsiteAdminAuditAction =
  | 'beta_approved'
  | 'beta_rejected'
  | 'beta_resend'
  | 'beta_bulk_approve'
  | 'beta_ios_pre_announcement'
  | 'beta_ios_delay_notice'
  | 'beta_ios_launch'
  | 'beta_engagement_round'
  | 'beta_feedback_submitted'
  | 'beta_feedback_resolved'
  | 'other';

/** Journal optionnel — ne bloque jamais l'action métier. */
export async function writeWebsiteAdminAudit(
  db: admin.firestore.Firestore,
  input: {
    action: WebsiteAdminAuditAction;
    target_type: string;
    target_id: string;
    summary: string;
    meta?: Record<string, unknown>;
  },
): Promise<void> {
  try {
    await db.collection(COL).add({
      action: input.action,
      actor_uid: 'website-admin',
      actor_email: 'website-admin',
      target_type: input.target_type,
      target_id: input.target_id,
      summary: input.summary,
      ...(input.meta ? { meta: input.meta } : {}),
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      source: 'website',
    });
  } catch (err) {
    console.warn('[admin_audit_log] write failed', err);
  }
}

export async function listWebsiteAdminAudit(
  db: admin.firestore.Firestore,
  max = 100,
): Promise<
  Array<{
    id: string;
    action: string;
    actor_uid: string;
    actor_email: string | null;
    target_type: string;
    target_id: string;
    summary: string;
    created_at: string | null;
  }>
> {
  let snap: admin.firestore.QuerySnapshot;
  try {
    snap = await db
      .collection(COL)
      .orderBy('created_at', 'desc')
      .limit(max)
      .get();
  } catch {
    snap = await db.collection(COL).limit(max).get();
  }

  return snap.docs.map((doc) => {
    const data = doc.data();
    let createdAt: string | null = null;
    const raw = data.created_at;
    if (raw && typeof raw === 'object' && 'toDate' in raw) {
      try {
        createdAt = (raw as { toDate: () => Date }).toDate().toISOString();
      } catch {
        createdAt = null;
      }
    } else if (typeof raw === 'string') {
      createdAt = raw;
    }
    return {
      id: doc.id,
      action: String(data.action ?? 'other'),
      actor_uid: String(data.actor_uid ?? ''),
      actor_email: data.actor_email ? String(data.actor_email) : null,
      target_type: String(data.target_type ?? ''),
      target_id: String(data.target_id ?? ''),
      summary: String(data.summary ?? ''),
      created_at: createdAt,
    };
  });
}
