import * as functions from 'firebase-functions';
import { admin } from './firebaseAdmin';

const db = admin.firestore();
const SPONSOR_DISCOVERY_MESSAGES = 10;
const MAX_BODY = 2000;

function currentUsagePeriod(date = new Date()): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

function sponsorMessagingUnlimited(data: FirebaseFirestore.DocumentData): boolean {
  if (data.role !== 'sponsor') return false;
  return (
    data.subscription_tier === 'pro' ||
    data.sponsor_tier === 'territorial' ||
    data.sponsor_tier === 'national'
  );
}

/**
 * Envoi message sponsor → club avec quota Découverte atomique (anti-bypass client).
 */
export const sendSponsorClubMessage = functions
  .region('europe-west1')
  .https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Connexion requise.');
    }

    const threadId = String(data?.threadId ?? '').trim();
    const receiverUid = String(data?.receiverUid ?? '').trim();
    const body = String(data?.body ?? '').trim();

    if (!threadId || !receiverUid) {
      throw new functions.https.HttpsError('invalid-argument', 'Conversation invalide.');
    }
    if (!body || body.length > MAX_BODY) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        `Message vide ou trop long (max ${MAX_BODY}).`,
      );
    }

    const uid = context.auth.uid;
    const userRef = db.doc(`users/${uid}`);
    const threadRef = db.doc(`message_threads/${threadId}`);
    const usagePeriod = currentUsagePeriod();
    const usageRef = db.doc(`users/${uid}/subscription_usage/${usagePeriod}`);

    await db.runTransaction(async (tx) => {
      const [userSnap, threadSnap, usageSnap] = await Promise.all([
        tx.get(userRef),
        tx.get(threadRef),
        tx.get(usageRef),
      ]);

      if (!userSnap.exists) {
        throw new functions.https.HttpsError('not-found', 'Profil introuvable.');
      }
      const user = userSnap.data()!;
      if (user.role !== 'sponsor') {
        throw new functions.https.HttpsError(
          'permission-denied',
          'Réservé aux comptes Sponsor.',
        );
      }
      if (user.sponsor_approved !== true || user.verification_status !== 'verified') {
        throw new functions.https.HttpsError(
          'failed-precondition',
          'Marque non validée — messagerie clubs indisponible.',
        );
      }

      if (!threadSnap.exists) {
        throw new functions.https.HttpsError('not-found', 'Conversation introuvable.');
      }
      const thread = threadSnap.data()!;
      const participants = (thread.participant_ids as string[]) ?? [];
      if (!participants.includes(uid) || !participants.includes(receiverUid)) {
        throw new functions.https.HttpsError(
          'permission-denied',
          'Vous n’êtes pas participant de cette conversation.',
        );
      }

      const unlimited = sponsorMessagingUnlimited(user);
      if (!unlimited) {
        const current = Number(usageSnap.data()?.sponsor_club_messages ?? 0);
        if (current >= SPONSOR_DISCOVERY_MESSAGES) {
          throw new functions.https.HttpsError(
            'resource-exhausted',
            `Limite gratuite : ${SPONSOR_DISCOVERY_MESSAGES} messages clubs par mois.`,
          );
        }
        tx.set(
          usageRef,
          {
            period: usagePeriod,
            sponsor_club_messages: current + 1,
            updated_at: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true },
        );
      }

      const msgRef = db.collection('messages').doc();
      tx.set(msgRef, {
        thread_id: threadId,
        sender_id: uid,
        receiver_id: receiverUid,
        body,
        created_at: admin.firestore.FieldValue.serverTimestamp(),
      });

      tx.update(threadRef, {
        last_message: body,
        updated_at: admin.firestore.FieldValue.serverTimestamp(),
        unread_by: admin.firestore.FieldValue.arrayUnion(receiverUid),
      });
    });

    return { ok: true };
  });
