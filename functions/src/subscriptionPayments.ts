import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import Stripe from 'stripe';
import { configStr } from './runtimeConfig';
import { sendFcmToUser } from './messaging';
import { claimAgentLaunchSeatInTransaction } from './agentLaunchSeats';
import { processReferralOnSubscribe } from './referral';
import {
  isStripeQuoteOnlyPlan,
  isStripeSubPlanId,
  SUBSCRIPTION_STRIPE_CATALOG,
  type StripeBillingCycle,
  type StripeSubPlanId,
} from './subscriptionStripeCatalog';

const db = admin.firestore();

function getStripe(): Stripe | null {
  const secret = configStr('stripe', 'secret_key', ['STRIPE_SECRET_KEY']) ?? '';
  if (!secret) return null;
  return new Stripe(secret, { apiVersion: '2025-02-24.acacia' });
}

async function ensureStripeCustomer(
  stripe: Stripe,
  uid: string,
  email?: string | null
): Promise<string> {
  const userRef = db.doc(`users/${uid}`);
  const snap = await userRef.get();
  const existing = String(snap.data()?.stripe_customer_id ?? '').trim();
  if (existing) return existing;

  const customer = await stripe.customers.create({
    email: email || undefined,
    metadata: { firebase_uid: uid },
  });
  await userRef.set(
    {
      stripe_customer_id: customer.id,
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
  return customer.id;
}

async function activateProFromStripe(params: {
  uid: string;
  planId: StripeSubPlanId;
  billing: StripeBillingCycle;
  subscriptionId: string;
  customerId?: string | null;
  periodEndIso?: string | null;
}): Promise<void> {
  const periodEnd =
    params.periodEndIso ??
    (() => {
      const d = new Date();
      if (params.billing === 'yearly') d.setFullYear(d.getFullYear() + 1);
      else d.setMonth(d.getMonth() + 1);
      return d.toISOString();
    })();

  const purchaseKey = `stripe_${params.subscriptionId}`;
  const purchaseRef = db.collection('subscription_purchases').doc(purchaseKey);

  await db.runTransaction(async (tx) => {
    const existing = await tx.get(purchaseRef);
    if (existing.exists && existing.data()?.uid === params.uid) {
      tx.update(db.doc(`users/${params.uid}`), {
        subscription_tier: 'pro',
        subscription_plan_id: params.planId,
        subscription_status: 'active',
        subscription_period_end: periodEnd,
        subscription_billing: params.billing,
        stripe_subscription_id: params.subscriptionId,
        ...(params.customerId ? { stripe_customer_id: params.customerId } : {}),
        updated_at: admin.firestore.FieldValue.serverTimestamp(),
      });
      return;
    }
    if (existing.exists && existing.data()?.uid !== params.uid) {
      throw new Error('Subscription already linked to another account');
    }

    tx.set(purchaseRef, {
      uid: params.uid,
      plan_id: params.planId,
      product_id: `stripe_${params.planId}_${params.billing}`,
      platform: 'stripe',
      transaction_id: params.subscriptionId,
      source: 'stripe_checkout',
      created_at: admin.firestore.FieldValue.serverTimestamp(),
    });
    tx.update(db.doc(`users/${params.uid}`), {
      subscription_tier: 'pro',
      subscription_plan_id: params.planId,
      subscription_status: 'active',
      subscription_period_end: periodEnd,
      subscription_billing: params.billing,
      stripe_subscription_id: params.subscriptionId,
      ...(params.customerId ? { stripe_customer_id: params.customerId } : {}),
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
    });
  });

  if (params.planId === 'agent_elite') {
    try {
      await claimAgentLaunchSeatInTransaction(params.uid);
    } catch (e) {
      console.warn('[subscriptionPayments] agent launch seat:', e);
    }
  }
  try {
    await processReferralOnSubscribe(params.uid);
  } catch (e) {
    console.warn('[subscriptionPayments] referral:', e);
  }
}

/** Crée une session Stripe Checkout (abonnement récurrent Pro). */
export const createSubscriptionCheckoutSession = functions.https.onCall(
  async (data, context) => {
    if (!context.auth?.uid) {
      throw new functions.https.HttpsError('unauthenticated', 'Connexion requise');
    }

    const stripe = getStripe();
    if (!stripe) {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'Stripe non configuré. Définissez STRIPE_SECRET_KEY.'
      );
    }

    const planIdRaw = String((data as { planId?: string }).planId ?? '').trim();
    const billingRaw = String((data as { billing?: string }).billing ?? 'monthly').trim();
    const billing: StripeBillingCycle = billingRaw === 'yearly' ? 'yearly' : 'monthly';

    if (!isStripeSubPlanId(planIdRaw)) {
      throw new functions.https.HttpsError('invalid-argument', 'Plan inconnu');
    }
    const planId: StripeSubPlanId = planIdRaw;
    if (isStripeQuoteOnlyPlan(planId)) {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'Cette formule est sur devis (à partir de 3 € / adhérent). Utilisez la demande de devis club.'
      );
    }
    const catalog = SUBSCRIPTION_STRIPE_CATALOG[planId];
    const unitAmount = billing === 'yearly' ? catalog.yearlyCents : catalog.monthlyCents;
    if (unitAmount == null || unitAmount <= 0) {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'Prix catalogue indisponible pour ce plan'
      );
    }
    const interval = billing === 'yearly' ? 'year' : 'month';
    const uid = context.auth.uid;
    const email =
      typeof context.auth.token.email === 'string' ? context.auth.token.email : null;

    const customerId = await ensureStripeCustomer(stripe, uid, email);

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      client_reference_id: uid,
      line_items: [
        {
          price_data: {
            currency: 'eur',
            unit_amount: unitAmount,
            recurring: { interval },
            product_data: {
              name: catalog.label.slice(0, 120),
              metadata: { plan_id: planId, billing },
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        type: 'pro_subscription',
        planId,
        billing,
        uid,
      },
      subscription_data: {
        metadata: {
          type: 'pro_subscription',
          planId,
          billing,
          uid,
        },
      },
      success_url: `proday://subscription?status=success&planId=${planId}`,
      cancel_url: `proday://subscription?status=cancel&planId=${planId}`,
    });

    if (!session.url) {
      throw new functions.https.HttpsError('internal', 'URL Stripe indisponible');
    }

    return { url: session.url, sessionId: session.id };
  }
);

/** Portail client Stripe — gérer / annuler / moyen de paiement. */
export const createBillingPortalSession = functions.https.onCall(async (_data, context) => {
  if (!context.auth?.uid) {
    throw new functions.https.HttpsError('unauthenticated', 'Connexion requise');
  }

  const stripe = getStripe();
  if (!stripe) {
    throw new functions.https.HttpsError(
      'failed-precondition',
      'Stripe non configuré. Définissez STRIPE_SECRET_KEY.'
    );
  }

  const uid = context.auth.uid;
  const snap = await db.doc(`users/${uid}`).get();
  const customerId = String(snap.data()?.stripe_customer_id ?? '').trim();
  if (!customerId) {
    throw new functions.https.HttpsError(
      'failed-precondition',
      'Aucun client Stripe lié à ce compte.'
    );
  }

  const portal = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: 'proday://subscription?status=manage',
  });

  if (!portal.url) {
    throw new functions.https.HttpsError('internal', 'URL portail Stripe indisponible');
  }

  return { url: portal.url };
});

export async function handleProSubscriptionCheckoutCompleted(
  session: Stripe.Checkout.Session
): Promise<void> {
  if (session.metadata?.type !== 'pro_subscription') return;
  if (session.mode !== 'subscription') return;

  const uid = String(session.metadata.uid ?? session.client_reference_id ?? '').trim();
  const planIdRaw = String(session.metadata.planId ?? '').trim();
  const billing: StripeBillingCycle =
    session.metadata.billing === 'yearly' ? 'yearly' : 'monthly';

  if (!uid || !isStripeSubPlanId(planIdRaw)) {
    console.error('[subscriptionPayments] checkout metadata incomplete', session.id);
    return;
  }

  const subscriptionId =
    typeof session.subscription === 'string'
      ? session.subscription
      : session.subscription?.id;
  if (!subscriptionId) {
    console.error('[subscriptionPayments] missing subscription on session', session.id);
    return;
  }

  const customerId =
    typeof session.customer === 'string' ? session.customer : session.customer?.id ?? null;

  let periodEndIso: string | null = null;
  const stripe = getStripe();
  if (stripe) {
    try {
      const sub = await stripe.subscriptions.retrieve(subscriptionId);
      if (sub.current_period_end) {
        periodEndIso = new Date(sub.current_period_end * 1000).toISOString();
      }
    } catch (e) {
      console.warn('[subscriptionPayments] retrieve subscription:', e);
    }
  }

  await activateProFromStripe({
    uid,
    planId: planIdRaw,
    billing,
    subscriptionId,
    customerId,
    periodEndIso,
  });

  await sendFcmToUser(uid, {
    title: 'Abonnement Pro activé',
    body: 'Votre paiement Stripe a bien été enregistré. Profitez de vos avantages Pro.',
    data: { type: 'pro_subscription_paid', planId: planIdRaw },
  });
}

export async function handleStripeSubscriptionLifecycle(
  subscription: Stripe.Subscription
): Promise<void> {
  const meta = subscription.metadata ?? {};
  if (meta.type !== 'pro_subscription') return;

  const uid = String(meta.uid ?? '').trim();
  const planIdRaw = String(meta.planId ?? '').trim();
  if (!uid) return;

  const periodEnd = subscription.current_period_end
    ? new Date(subscription.current_period_end * 1000).toISOString()
    : null;
  const status = subscription.status;

  if (status === 'active' || status === 'trialing') {
    if (!isStripeSubPlanId(planIdRaw)) return;
    await db.doc(`users/${uid}`).set(
      {
        subscription_tier: 'pro',
        subscription_plan_id: planIdRaw,
        subscription_status: 'active',
        ...(periodEnd ? { subscription_period_end: periodEnd } : {}),
        stripe_subscription_id: subscription.id,
        updated_at: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    return;
  }

  if (status === 'past_due' || status === 'unpaid') {
    await db.doc(`users/${uid}`).set(
      {
        subscription_status: 'past_due',
        updated_at: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    return;
  }

  if (status === 'canceled' || status === 'incomplete_expired') {
    await db.doc(`users/${uid}`).set(
      {
        subscription_tier: 'free',
        subscription_status: 'canceled',
        updated_at: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  }
}
