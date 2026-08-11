import * as admin from 'firebase-admin';

const COL = 'beta_feedback';
const MAX_MESSAGE = 4000;
const LIST_CAP = 100;

export type BetaFeedbackCategory = 'bug' | 'idea' | 'ux' | 'other';

function toIso(value: unknown): string | null {
  if (value && typeof value === 'object' && 'toDate' in value) {
    try {
      return (value as { toDate: () => Date }).toDate().toISOString();
    } catch {
      return null;
    }
  }
  if (typeof value === 'string' && value.trim()) return value;
  return null;
}

export async function submitBetaFeedback(
  db: admin.firestore.Firestore,
  input: {
    email: string;
    roleLabel: string;
    category: BetaFeedbackCategory;
    message: string;
  },
): Promise<{ id: string }> {
  const email = input.email.trim().toLowerCase();
  const message = input.message.trim().slice(0, MAX_MESSAGE);
  if (!email || !message) {
    throw new Error('email et message requis');
  }
  const category: BetaFeedbackCategory =
    input.category === 'bug' ||
    input.category === 'idea' ||
    input.category === 'ux' ||
    input.category === 'other'
      ? input.category
      : 'other';

  const ref = await db.collection(COL).add({
    email,
    role_label: input.roleLabel.trim().slice(0, 80),
    category,
    message,
    status: 'open',
    created_at: admin.firestore.FieldValue.serverTimestamp(),
    updated_at: admin.firestore.FieldValue.serverTimestamp(),
  });
  return { id: ref.id };
}

export async function listBetaFeedback(db: admin.firestore.Firestore) {
  let snap: admin.firestore.QuerySnapshot;
  try {
    snap = await db
      .collection(COL)
      .orderBy('created_at', 'desc')
      .limit(LIST_CAP)
      .get();
  } catch {
    snap = await db.collection(COL).limit(LIST_CAP).get();
  }

  const items = snap.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      email: String(data.email ?? ''),
      role_label: String(data.role_label ?? ''),
      category: String(data.category ?? 'other'),
      message: String(data.message ?? ''),
      status: data.status === 'resolved' ? 'resolved' : 'open',
      created_at: toIso(data.created_at),
      resolved_at: toIso(data.resolved_at),
    };
  });

  return {
    ok: true as const,
    items,
    counts: {
      all: items.length,
      open: items.filter((i) => i.status === 'open').length,
      resolved: items.filter((i) => i.status === 'resolved').length,
    },
  };
}

export async function resolveBetaFeedback(
  db: admin.firestore.Firestore,
  feedbackId: string,
): Promise<void> {
  const ref = db.collection(COL).doc(feedbackId);
  const snap = await ref.get();
  if (!snap.exists) {
    throw new Error('Retour introuvable');
  }
  await ref.update({
    status: 'resolved',
    resolved_at: admin.firestore.FieldValue.serverTimestamp(),
    updated_at: admin.firestore.FieldValue.serverTimestamp(),
    resolved_by: 'website-admin',
  });
}
