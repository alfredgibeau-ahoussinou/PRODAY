/**
 * Demande de push distant (Expo / FCM via Cloud Functions).
 * Le client écrit `push_outbox` ; `onPushOutboxCreated` envoie le push.
 * Pour l’inbox staff (retards, etc.) préférer `staffNotificationsService`.
 */
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { getDb } from '../lib/firebase';
import { isFirebaseConfigured } from '../config/firebase';

export const notificationService = {
  async sendPush(
    uid: string,
    _fcmToken: string | undefined,
    payload: { title: string; body: string; data?: Record<string, string> },
  ): Promise<void> {
    const recipient = uid?.trim();
    if (!recipient || recipient === 'broadcast') {
      if (__DEV__) {
        console.warn(
          '[push] destinataire manquant (broadcast non supporté côté client) —',
          payload.title,
        );
      }
      return;
    }
    if (!isFirebaseConfigured()) return;
    const database = getDb();
    if (!database) return;

    try {
      await addDoc(collection(database, 'push_outbox'), {
        recipient_uid: recipient,
        title: payload.title.slice(0, 80),
        body: payload.body.slice(0, 180),
        data: payload.data ?? {},
        created_at: serverTimestamp(),
      });
    } catch (e) {
      if (__DEV__) {
        console.warn('[push] outbox write failed:', e);
      }
    }
  },

  /** Envoie le même message à plusieurs uids (best-effort). */
  async sendPushToMany(
    uids: string[],
    payload: { title: string; body: string; data?: Record<string, string> },
  ): Promise<number> {
    const unique = [...new Set(uids.map((u) => u.trim()).filter(Boolean))];
    let n = 0;
    for (const uid of unique) {
      await this.sendPush(uid, undefined, payload);
      n += 1;
    }
    return n;
  },
};
