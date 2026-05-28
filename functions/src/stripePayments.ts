import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import Stripe from 'stripe';
import { sendFcmToUser } from './messaging';

const db = admin.firestore();

function getStripe(): Stripe | null {
  const secret =
    functions.config().stripe?.secret_key ?? process.env.STRIPE_SECRET_KEY ?? '';
  if (!secret) return null;
  return new Stripe(secret, { apiVersion: '2025-02-24.acacia' });
}

/** Crée une session Stripe Checkout pour une cotisation membre */
export const createPaymentCheckoutSession = functions.https.onCall(async (data, context) => {
  if (!context.auth?.uid) {
    throw new functions.https.HttpsError('unauthenticated', 'Connexion requise');
  }

  const stripe = getStripe();
  if (!stripe) {
    throw new functions.https.HttpsError(
      'failed-precondition',
      'Stripe non configuré. Définissez stripe.secret_key (firebase functions:config:set).'
    );
  }

  const { requestId } = data as { requestId: string };
  if (!requestId) {
    throw new functions.https.HttpsError('invalid-argument', 'requestId requis');
  }

  const ref = db.doc(`team_payment_requests/${requestId}`);
  const snap = await ref.get();
  if (!snap.exists) {
    throw new functions.https.HttpsError('not-found', 'Cotisation introuvable');
  }

  const payment = snap.data()!;
  if (payment.member_uid !== context.auth.uid) {
    throw new functions.https.HttpsError('permission-denied', 'Cette cotisation ne vous concerne pas');
  }
  if (payment.status === 'paid') {
    throw new functions.https.HttpsError('failed-precondition', 'Cotisation déjà payée');
  }

  const amountEur = Number(payment.amount_eur ?? 0);
  if (amountEur <= 0) {
    throw new functions.https.HttpsError('invalid-argument', 'Montant invalide');
  }

  const label = String(payment.label ?? 'Cotisation ProDay');
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'eur',
          product_data: { name: label.slice(0, 120) },
          unit_amount: Math.round(amountEur * 100),
        },
        quantity: 1,
      },
    ],
    metadata: {
      requestId,
      memberUid: context.auth.uid,
      clubId: String(payment.club_id ?? ''),
    },
    success_url: `proday://payments?status=success&requestId=${requestId}`,
    cancel_url: `proday://payments?status=cancel&requestId=${requestId}`,
  });

  if (!session.url) {
    throw new functions.https.HttpsError('internal', 'URL Stripe indisponible');
  }

  await ref.update({
    stripe_checkout_session_id: session.id,
    updated_at: admin.firestore.FieldValue.serverTimestamp(),
  });

  return { url: session.url, sessionId: session.id };
});

/** Webhook Stripe — marque la cotisation payée après checkout.session.completed */
export const stripeWebhook = functions.https.onRequest(async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  const stripe = getStripe();
  const webhookSecret =
    functions.config().stripe?.webhook_secret ?? process.env.STRIPE_WEBHOOK_SECRET ?? '';

  if (!stripe || !webhookSecret) {
    console.error('[stripeWebhook] Stripe ou webhook secret manquant');
    res.status(500).send('Stripe not configured');
    return;
  }

  const sig = req.headers['stripe-signature'];
  if (!sig || typeof sig !== 'string') {
    res.status(400).send('Missing signature');
    return;
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(req.rawBody, sig, webhookSecret);
  } catch (err) {
    console.error('[stripeWebhook] signature invalid:', err);
    res.status(400).send('Webhook signature verification failed');
    return;
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const requestId = session.metadata?.requestId;
    if (requestId) {
      const ref = db.doc(`team_payment_requests/${requestId}`);
      const snap = await ref.get();
      if (snap.exists && snap.data()?.status !== 'paid') {
        await ref.update({
          status: 'paid',
          payment_method: 'stripe',
          stripe_checkout_session_id: session.id,
          paid_at: admin.firestore.FieldValue.serverTimestamp(),
          updated_at: admin.firestore.FieldValue.serverTimestamp(),
        });

        const memberUid = session.metadata?.memberUid;
        if (memberUid) {
          await sendFcmToUser(memberUid, {
            title: 'Cotisation payée',
            body: 'Votre paiement en ligne a bien été enregistré.',
            data: { type: 'team_payment_paid', requestId },
          });
        }
      }
    }
  }

  res.json({ received: true });
});
