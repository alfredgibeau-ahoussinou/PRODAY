import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import Stripe from 'stripe';
import { configStr } from './runtimeConfig';
import { sendPushToUser } from './messaging';

const db = admin.firestore();

function getStripe(): Stripe | null {
  const secret = configStr('stripe', 'secret_key', ['STRIPE_SECRET_KEY']) ?? '';
  if (!secret) return null;
  return new Stripe(secret, { apiVersion: '2025-02-24.acacia' });
}

/**
 * Checkout Stripe one-shot pour une séance coach à l’heure (après acceptation).
 */
export const createCoachSessionCheckoutSession = functions.https.onCall(
  async (data, context) => {
    if (!context.auth?.uid) {
      throw new functions.https.HttpsError('unauthenticated', 'Connexion requise');
    }

    const stripe = getStripe();
    if (!stripe) {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'Stripe non configuré. Définissez stripe.secret_key.',
      );
    }

    const bookingId = String((data as { bookingId?: string }).bookingId ?? '').trim();
    if (!bookingId) {
      throw new functions.https.HttpsError('invalid-argument', 'bookingId requis');
    }

    const ref = db.doc(`coach_session_bookings/${bookingId}`);
    const snap = await ref.get();
    if (!snap.exists) {
      throw new functions.https.HttpsError('not-found', 'Réservation introuvable');
    }

    const booking = snap.data()!;
    if (String(booking.player_uid) !== context.auth.uid) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Seul le joueur peut payer cette séance',
      );
    }

    const status = String(booking.status ?? '');
    if (status === 'paid' || status === 'completed') {
      throw new functions.https.HttpsError('failed-precondition', 'Séance déjà payée');
    }
    if (status !== 'accepted') {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'Le coach doit d’abord accepter la demande',
      );
    }

    const priceEur = Number(booking.price_eur ?? 0);
    if (priceEur <= 0) {
      throw new functions.https.HttpsError('invalid-argument', 'Montant invalide');
    }

    const coachName = String(booking.coach_name ?? 'Coach').slice(0, 60);
    const duration = Number(booking.duration_min ?? 60);

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `Séance ProDay · ${coachName} · ${duration} min`.slice(0, 120),
            },
            unit_amount: Math.round(priceEur * 100),
          },
          quantity: 1,
        },
      ],
      metadata: {
        type: 'coach_session',
        bookingId,
        playerUid: context.auth.uid,
        coachUid: String(booking.coach_uid ?? ''),
      },
      success_url: `proday://coach-session?status=success&bookingId=${bookingId}`,
      cancel_url: `proday://coach-session?status=cancel&bookingId=${bookingId}`,
    });

    if (!session.url) {
      throw new functions.https.HttpsError('internal', 'URL Stripe indisponible');
    }

    await ref.update({
      stripe_checkout_session_id: session.id,
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { url: session.url, sessionId: session.id };
  },
);

/** Webhook helper — marque la séance payée. */
export async function handleCoachSessionCheckoutCompleted(
  session: Stripe.Checkout.Session,
): Promise<void> {
  const bookingId = String(session.metadata?.bookingId ?? '').trim();
  if (!bookingId) return;

  const ref = db.doc(`coach_session_bookings/${bookingId}`);
  const snap = await ref.get();
  if (!snap.exists) return;
  const booking = snap.data()!;
  if (String(booking.status) === 'paid' || String(booking.status) === 'completed') return;

  await ref.update({
    status: 'paid',
    payment_method: 'stripe',
    stripe_checkout_session_id: session.id,
    paid_at: admin.firestore.FieldValue.serverTimestamp(),
    updated_at: admin.firestore.FieldValue.serverTimestamp(),
  });

  const coachUid = String(booking.coach_uid ?? session.metadata?.coachUid ?? '');
  const playerName = String(booking.player_name ?? 'Un joueur');
  if (coachUid) {
    await sendPushToUser(coachUid, {
      title: 'Séance payée',
      body: `${playerName} a réglé la séance (${Number(booking.price_eur ?? 0)} €).`,
      data: { type: 'coach_session_paid', bookingId },
    });
  }
}

/**
 * Push joueur quand le coach accepte / refuse ; push coach sur demande déjà
 * couvert via staff_notifications.
 */
export const onCoachSessionBookingUpdated = functions.firestore
  .document('coach_session_bookings/{bookingId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    const prev = String(before.status ?? '');
    const next = String(after.status ?? '');
    if (prev === next) return;

    const bookingId = context.params.bookingId as string;
    const playerUid = String(after.player_uid ?? '');
    const coachName = String(after.coach_name ?? 'Coach');
    const price = Number(after.price_eur ?? 0);

    if (next === 'accepted' && playerUid) {
      await sendPushToUser(playerUid, {
        title: 'Séance acceptée',
        body: `${coachName} a accepté. Règle ${price} € pour confirmer.`,
        data: { type: 'coach_session_accepted', bookingId },
      });
    }
    if (next === 'declined' && playerUid) {
      await sendPushToUser(playerUid, {
        title: 'Séance refusée',
        body: `${coachName} ne peut pas honorer ce créneau.`,
        data: { type: 'coach_session_declined', bookingId },
      });
    }
  });
