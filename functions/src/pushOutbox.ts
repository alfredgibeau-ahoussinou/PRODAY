import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { sendPushToUser } from './messaging';

/**
 * File d’attente push générique (joueurs + staff) —
 * le client écrit `push_outbox/{id}` ; on envoie puis on marque `sent_at`.
 */
export const onPushOutboxCreated = functions.firestore
  .document('push_outbox/{outboxId}')
  .onCreate(async (snap) => {
    const data = snap.data();
    const uid = String(data.recipient_uid ?? '').trim();
    if (!uid) return;

    const title = String(data.title ?? 'ProDay').slice(0, 80);
    const body = String(data.body ?? '').slice(0, 180);
    const rawData = (data.data ?? {}) as Record<string, unknown>;
    const dataPayload: Record<string, string> = {};
    for (const [k, v] of Object.entries(rawData)) {
      if (v != null) dataPayload[k] = String(v);
    }

    const ok = await sendPushToUser(uid, {
      title,
      body,
      data: { type: 'push_outbox', outboxId: snap.id, ...dataPayload },
    });

    try {
      await snap.ref.update({
        sent_at: admin.firestore.FieldValue.serverTimestamp(),
        sent_ok: ok,
      });
    } catch (e) {
      console.warn('[push_outbox] mark sent failed', e);
    }
  });
