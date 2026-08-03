/**
 * RevenueCat webhooks → Firestore subscription_* fields.
 *
 * Setup (dashboard RevenueCat → Project → Integrations → Webhooks):
 *   URL: https://REGION-PROJECT.cloudfunctions.net/revenueCatWebhook
 *   Authorization header: same value as REVENUECAT_WEBHOOK_AUTH (Bearer optional)
 *
 * Env (functions):
 *   REVENUECAT_WEBHOOK_AUTH — shared secret checked on Authorization / X-RevenueCat-Signature
 *
 * Stripe Billing is intentionally unused for Pro; Stripe Checkout remains for shop + cotisations.
 */
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { planIdForIapSku, isKnownIapSku } from './iapSkus';
import { claimAgentLaunchSeatInTransaction } from './agentLaunchSeats';
import { processReferralOnSubscribe } from './referral';
import { configStr } from './runtimeConfig';

const db = admin.firestore();

type RcEventType =
  | 'INITIAL_PURCHASE'
  | 'RENEWAL'
  | 'PRODUCT_CHANGE'
  | 'CANCELLATION'
  | 'UNCANCELLATION'
  | 'EXPIRATION'
  | 'BILLING_ISSUE'
  | 'SUBSCRIBER_ALIAS'
  | 'TRANSFER'
  | 'NON_RENEWING_PURCHASE'
  | 'SUBSCRIPTION_PAUSED'
  | 'TEMPORARY_ENTITLEMENT_GRANT'
  | 'TEST'
  | string;

type RcEvent = {
  type?: RcEventType;
  id?: string;
  app_user_id?: string;
  original_app_user_id?: string;
  product_id?: string;
  new_product_id?: string;
  expiration_at_ms?: number | null;
  purchased_at_ms?: number | null;
  store?: string;
  environment?: string;
  cancel_reason?: string;
  expiration_reason?: string;
};

type RcWebhookBody = {
  api_version?: string;
  event?: RcEvent;
};

function readAuthHeader(req: functions.https.Request): string {
  const raw = String(req.get('Authorization') ?? req.get('authorization') ?? '').trim();
  if (raw.toLowerCase().startsWith('bearer ')) {
    return raw.slice(7).trim();
  }
  return raw;
}

function expectedAuth(): string {
  return (
    configStr('revenuecat', 'webhook_auth', [
      'REVENUECAT_WEBHOOK_AUTH',
      'REVENUECAT_WEBHOOK_SECRET',
    ]) ?? ''
  );
}

function resolveUid(event: RcEvent): string | null {
  const candidates = [event.app_user_id, event.original_app_user_id]
    .map((v) => String(v ?? '').trim())
    .filter(Boolean);
  // Prefer non-anonymous RC ids (Firebase uid)
  for (const id of candidates) {
    if (!id.startsWith('$RCAnonymousID:')) return id;
  }
  return candidates[0] ?? null;
}

function periodEndIso(event: RcEvent, productId: string): string {
  if (event.expiration_at_ms && Number.isFinite(event.expiration_at_ms)) {
    return new Date(event.expiration_at_ms).toISOString();
  }
  const end = new Date();
  if (productId.includes('yearly')) {
    end.setFullYear(end.getFullYear() + 1);
  } else {
    end.setMonth(end.getMonth() + 1);
  }
  return end.toISOString();
}

async function grantPro(uid: string, planId: string, productId: string, event: RcEvent) {
  const purchaseKey = `rc_${event.id ?? `${uid}_${productId}_${event.purchased_at_ms ?? Date.now()}`}`;
  const purchaseRef = db.collection('subscription_purchases').doc(purchaseKey);

  await db.runTransaction(async (tx) => {
    tx.set(
      purchaseRef,
      {
        uid,
        plan_id: planId,
        product_id: productId,
        platform: String(event.store ?? 'revenuecat').toLowerCase(),
        transaction_id: String(event.id ?? purchaseKey),
        source: 'revenuecat_webhook',
        event_type: event.type ?? null,
        created_at: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    tx.set(
      db.doc(`users/${uid}`),
      {
        subscription_tier: 'pro',
        subscription_plan_id: planId,
        subscription_status: 'active',
        subscription_period_end: periodEndIso(event, productId),
        updated_at: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  });

  if (planId === 'agent_elite' && event.type === 'INITIAL_PURCHASE') {
    try {
      await claimAgentLaunchSeatInTransaction(uid);
    } catch (e) {
      console.warn('[revenueCatWebhook] agent launch seat:', e);
    }
  }

  if (event.type === 'INITIAL_PURCHASE' || event.type === 'RENEWAL') {
    try {
      await processReferralOnSubscribe(uid);
    } catch (e) {
      console.warn('[revenueCatWebhook] referral:', e);
    }
  }
}

async function markCanceled(uid: string, event: RcEvent, productId: string) {
  await db.doc(`users/${uid}`).set(
    {
      subscription_status: 'canceled',
      subscription_period_end: periodEndIso(event, productId),
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
}

async function markPastDue(uid: string) {
  await db.doc(`users/${uid}`).set(
    {
      subscription_status: 'past_due',
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
}

async function revokePro(uid: string) {
  await db.doc(`users/${uid}`).set(
    {
      subscription_tier: 'free',
      subscription_status: 'canceled',
      subscription_period_end: admin.firestore.FieldValue.delete(),
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
}

export const revenueCatWebhook = functions.https.onRequest(async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  const expected = expectedAuth();
  if (!expected) {
    console.error('[revenueCatWebhook] REVENUECAT_WEBHOOK_AUTH missing');
    res.status(503).send('Webhook not configured');
    return;
  }

  const provided = readAuthHeader(req);
  if (!provided || provided !== expected) {
    res.status(401).send('Unauthorized');
    return;
  }

  const body = (req.body ?? {}) as RcWebhookBody;
  const event = body.event ?? {};
  const type = String(event.type ?? '');

  if (type === 'TEST') {
    res.status(200).json({ ok: true, message: 'test received' });
    return;
  }

  const uid = resolveUid(event);
  if (!uid) {
    res.status(200).json({ ok: true, skipped: 'no_app_user_id' });
    return;
  }

  const productId = String(event.new_product_id || event.product_id || '').trim();
  const planId = productId && isKnownIapSku(productId) ? planIdForIapSku(productId) : null;

  try {
    switch (type) {
      case 'INITIAL_PURCHASE':
      case 'RENEWAL':
      case 'UNCANCELLATION':
      case 'PRODUCT_CHANGE':
      case 'NON_RENEWING_PURCHASE': {
        if (!planId || !productId) {
          console.warn('[revenueCatWebhook] unknown product', productId, type);
          res.status(200).json({ ok: true, skipped: 'unknown_product' });
          return;
        }
        await grantPro(uid, planId, productId, event);
        break;
      }
      case 'CANCELLATION':
      case 'SUBSCRIPTION_PAUSED': {
        if (productId) {
          await markCanceled(uid, event, productId);
        } else {
          await db.doc(`users/${uid}`).set(
            {
              subscription_status: 'canceled',
              updated_at: admin.firestore.FieldValue.serverTimestamp(),
            },
            { merge: true }
          );
        }
        break;
      }
      case 'BILLING_ISSUE': {
        await markPastDue(uid);
        break;
      }
      case 'EXPIRATION': {
        await revokePro(uid);
        break;
      }
      default:
        console.info('[revenueCatWebhook] ignored event', type);
    }

    res.status(200).json({ ok: true });
  } catch (e) {
    console.error('[revenueCatWebhook]', e);
    res.status(500).json({ ok: false });
  }
});
