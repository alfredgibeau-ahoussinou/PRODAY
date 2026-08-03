import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import Stripe from 'stripe';
import { configStr } from './runtimeConfig';
import { sendFcmToUser } from './messaging';

const db = admin.firestore();

function getStripe(): Stripe | null {
  const secret = configStr('stripe', 'secret_key', ['STRIPE_SECRET_KEY']) ?? '';
  if (!secret) return null;
  return new Stripe(secret, { apiVersion: '2025-02-24.acacia' });
}

/**
 * Checkout Stripe pour une inscription Pôle Événements payante.
 * Deep links : proday://events?status=success|cancel&registrationId=...
 */
export const createEventRegistrationCheckoutSession = functions.https.onCall(
  async (data, context) => {
    if (!context.auth?.uid) {
      throw new functions.https.HttpsError('unauthenticated', 'Connexion requise');
    }

    const stripe = getStripe();
    if (!stripe) {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'Stripe non configuré. Définissez stripe.secret_key (firebase functions:config:set).',
      );
    }

    const eventId = String((data as { eventId?: string }).eventId ?? '').trim();
    const registrationId = String(
      (data as { registrationId?: string }).registrationId ?? '',
    ).trim();
    if (!eventId || !registrationId) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'eventId et registrationId requis',
      );
    }

    const regRef = db.doc(`event_registrations/${registrationId}`);
    const eventRef = db.doc(`organizer_events/${eventId}`);
    const [regSnap, eventSnap] = await Promise.all([regRef.get(), eventRef.get()]);

    if (!regSnap.exists) {
      throw new functions.https.HttpsError('not-found', 'Inscription introuvable');
    }
    if (!eventSnap.exists) {
      throw new functions.https.HttpsError('not-found', 'Événement introuvable');
    }

    const reg = regSnap.data()!;
    const event = eventSnap.data()!;

    if (reg.event_id !== eventId) {
      throw new functions.https.HttpsError('invalid-argument', 'Inscription / événement incohérents');
    }
    if (reg.user_uid !== context.auth.uid) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Cette inscription ne vous appartient pas',
      );
    }
    if (reg.status === 'paid') {
      throw new functions.https.HttpsError('failed-precondition', 'Déjà payé');
    }
    if (reg.status === 'cancelled' || reg.status === 'waitlist') {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'Inscription non éligible au paiement',
      );
    }

    const amountCents = Math.max(
      0,
      Number(reg.amount_cents ?? event.registration_price_cents ?? 0),
    );
    if (amountCents <= 0) {
      throw new functions.https.HttpsError('failed-precondition', 'Événement gratuit — pas de paiement');
    }

    const title = String(event.title ?? 'Événement ProDay').slice(0, 120);
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: { name: `Inscription · ${title}` },
            unit_amount: amountCents,
          },
          quantity: 1,
        },
      ],
      metadata: {
        type: 'event_registration',
        eventId,
        registrationId,
        buyerUid: context.auth.uid,
      },
      success_url: `proday://events?status=success&registrationId=${registrationId}&eventId=${eventId}`,
      cancel_url: `proday://events?status=cancel&registrationId=${registrationId}&eventId=${eventId}`,
    });

    if (!session.url) {
      throw new functions.https.HttpsError('internal', 'URL Stripe indisponible');
    }

    await regRef.update({
      payment_ref: session.id,
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { url: session.url, sessionId: session.id };
  },
);

/** Traite un checkout inscription événement (appelé depuis stripeWebhook). */
export async function handleEventRegistrationCheckoutCompleted(
  session: Stripe.Checkout.Session,
): Promise<void> {
  if (session.metadata?.type !== 'event_registration') return;

  const registrationId = session.metadata.registrationId;
  const buyerUid = session.metadata.buyerUid;
  if (!registrationId) return;

  const ref = db.doc(`event_registrations/${registrationId}`);
  const snap = await ref.get();
  if (!snap.exists) return;
  if (snap.data()?.status === 'paid') return;

  await ref.update({
    status: 'paid',
    payment_ref: session.id,
    updated_at: admin.firestore.FieldValue.serverTimestamp(),
  });

  if (buyerUid) {
    await sendFcmToUser(buyerUid, {
      title: 'Inscription payée',
      body: 'Votre inscription événement a bien été enregistrée.',
      data: {
        type: 'event_registration_paid',
        registrationId,
        eventId: session.metadata.eventId ?? '',
      },
    });
  }
}
