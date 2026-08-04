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
 * Checkout Stripe pour frais d'inscription tournoi (plateforme ProDay, pas Connect).
 */
export const createTournamentCheckoutSession = functions.https.onCall(async (data, context) => {
  if (!context.auth?.uid) {
    throw new functions.https.HttpsError('unauthenticated', 'Connexion requise');
  }

  const stripe = getStripe();
  if (!stripe) {
    throw new functions.https.HttpsError(
      'failed-precondition',
      'Stripe non configuré. Définissez stripe.secret_key.'
    );
  }

  const tournamentId = String((data as { tournamentId?: string }).tournamentId ?? '').trim();
  const registrationId = String((data as { registrationId?: string }).registrationId ?? '').trim();
  if (!tournamentId || !registrationId) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'tournamentId et registrationId requis'
    );
  }

  const tournamentRef = db.doc(`tournaments/${tournamentId}`);
  const snap = await tournamentRef.get();
  if (!snap.exists) {
    throw new functions.https.HttpsError('not-found', 'Tournoi introuvable');
  }

  const tournament = snap.data()!;
  const feeCents = Math.floor(Number(tournament.entry_fee_cents ?? 0));
  if (feeCents <= 0) {
    throw new functions.https.HttpsError('failed-precondition', 'Ce tournoi est gratuit');
  }

  const registrations = Array.isArray(tournament.registrations) ? tournament.registrations : [];
  const regIndex = registrations.findIndex(
    (r: { id?: string }) => String(r.id ?? '') === registrationId
  );
  if (regIndex < 0) {
    throw new functions.https.HttpsError('not-found', 'Inscription introuvable');
  }

  const registration = registrations[regIndex] as {
    id: string;
    captain_uid?: string;
    paid?: boolean;
    club_name?: string;
  };

  if (registration.paid === true) {
    throw new functions.https.HttpsError('already-exists', 'Inscription déjà payée');
  }

  const callerUid = context.auth.uid;
  const isCaptain = registration.captain_uid === callerUid;
  const isOrganizer = String(tournament.organizer_uid ?? '') === callerUid;
  if (!isCaptain && !isOrganizer) {
    throw new functions.https.HttpsError('permission-denied', 'Seul le capitaine peut payer');
  }

  const title = String(tournament.title ?? 'Tournoi ProDay').slice(0, 100);
  const clubName = String(registration.club_name ?? 'Équipe').slice(0, 60);

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'eur',
          product_data: {
            name: `Inscription · ${title}`.slice(0, 120),
            description: `Équipe ${clubName}`,
          },
          unit_amount: feeCents,
        },
        quantity: 1,
      },
    ],
    metadata: {
      type: 'tournament_registration',
      tournamentId,
      registrationId,
      captainUid: String(registration.captain_uid ?? callerUid),
    },
    success_url: `proday://tournament?status=success&tournamentId=${tournamentId}`,
    cancel_url: `proday://tournament?status=cancel&tournamentId=${tournamentId}`,
  });

  if (!session.url) {
    throw new functions.https.HttpsError('internal', 'URL Stripe indisponible');
  }

  const nextRegs = registrations.map((r: Record<string, unknown>, i: number) =>
    i === regIndex
      ? { ...r, stripe_checkout_session_id: session.id }
      : r
  );
  await tournamentRef.update({
    registrations: nextRegs,
    updated_at: admin.firestore.FieldValue.serverTimestamp(),
  });

  return { url: session.url, sessionId: session.id, tournamentId, registrationId };
});

/** Marque l'inscription payée après Checkout (appelé depuis stripeWebhook). */
export async function handleTournamentCheckoutCompleted(
  session: Stripe.Checkout.Session
): Promise<void> {
  if (session.metadata?.type !== 'tournament_registration') return;

  const tournamentId = session.metadata?.tournamentId;
  const registrationId = session.metadata?.registrationId;
  if (!tournamentId || !registrationId) return;

  const ref = db.doc(`tournaments/${tournamentId}`);
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) return;
    const data = snap.data()!;
    const registrations = Array.isArray(data.registrations) ? [...data.registrations] : [];
    const idx = registrations.findIndex(
      (r: { id?: string }) => String(r.id ?? '') === registrationId
    );
    if (idx < 0) return;
    const current = registrations[idx] as { paid?: boolean };
    if (current.paid === true) return;

    registrations[idx] = {
      ...current,
      paid: true,
      stripe_checkout_session_id: session.id,
      paid_at: new Date().toISOString(),
    };

    tx.update(ref, {
      registrations,
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
    });
  });

  const captainUid = session.metadata?.captainUid;
  if (captainUid) {
    await sendFcmToUser(captainUid, {
      title: 'Inscription tournoi payée',
      body: 'Votre paiement a bien été enregistré. Bonne compétition !',
      data: {
        type: 'tournament_registration_paid',
        tournamentId,
        registrationId,
      },
    });
  }
}
