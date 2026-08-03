import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { planIdForIapSku, isKnownIapSku } from './iapSkus';
import { claimAgentLaunchSeatInTransaction } from './agentLaunchSeats';
import { processReferralOnSubscribe } from './referral';

const db = admin.firestore();

type ActivatePayload = {
  planId?: string;
  productId?: string;
  platform?: string;
  transactionId?: string;
  purchaseToken?: string;
};

/**
 * Active l’abonnement Pro après achat store (RevenueCat ou expo-iap).
 * Renouvellements / annulations / expirations : webhook `revenueCatWebhook`.
 * Stripe Billing n’est pas utilisé pour les abonnements récurrents.
 */
export const activateStoreSubscription = functions.https.onCall(
  async (data: ActivatePayload, context) => {
    if (!context.auth?.uid) {
      throw new functions.https.HttpsError('unauthenticated', 'Connexion requise');
    }

    const planId = String(data.planId ?? '').trim();
    const productId = String(data.productId ?? '').trim();
    const platform = String(data.platform ?? '').trim();
    const transactionId = String(data.transactionId ?? '').trim();

    if (!planId || !productId || !platform || !transactionId) {
      throw new functions.https.HttpsError('invalid-argument', 'Données achat incomplètes');
    }

    if (!isKnownIapSku(productId)) {
      throw new functions.https.HttpsError('invalid-argument', 'Produit store inconnu');
    }

    const skuPlan = planIdForIapSku(productId);
    if (!skuPlan || skuPlan !== planId) {
      throw new functions.https.HttpsError('invalid-argument', 'Plan et produit incohérents');
    }

    const uid = context.auth.uid;
    const purchaseKey = `${platform}_${transactionId}`;
    const purchaseRef = db.collection('subscription_purchases').doc(purchaseKey);
    const existing = await purchaseRef.get();
    if (existing.exists && existing.data()?.uid === uid) {
      try {
        await processReferralOnSubscribe(uid);
      } catch (e) {
        console.warn('[activateStoreSubscription] referral retry:', e);
      }
      return { ok: true, message: 'Abonnement déjà actif sur ce compte.' };
    }
    if (existing.exists && existing.data()?.uid !== uid) {
      throw new functions.https.HttpsError(
        'already-exists',
        'Cette transaction est déjà liée à un autre compte.'
      );
    }

    const periodEnd = new Date();
    if (productId.includes('yearly')) {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    } else {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    }

    await db.runTransaction(async (tx) => {
      tx.set(purchaseRef, {
        uid,
        plan_id: planId,
        product_id: productId,
        platform,
        transaction_id: transactionId,
        purchase_token: data.purchaseToken ?? null,
        created_at: admin.firestore.FieldValue.serverTimestamp(),
      });
      tx.update(db.doc(`users/${uid}`), {
        subscription_tier: 'pro',
        subscription_plan_id: planId,
        subscription_status: 'active',
        subscription_period_end: periodEnd.toISOString(),
        updated_at: admin.firestore.FieldValue.serverTimestamp(),
      });
    });

    let launch: Awaited<ReturnType<typeof claimAgentLaunchSeatInTransaction>> | null = null;
    if (planId === 'agent_elite') {
      try {
        launch = await claimAgentLaunchSeatInTransaction(uid);
      } catch (e) {
        console.warn('[activateStoreSubscription] agent launch seat:', e);
      }
    }

    let referralReward: Awaited<ReturnType<typeof processReferralOnSubscribe>> | null = null;
    try {
      referralReward = await processReferralOnSubscribe(uid);
    } catch (e) {
      console.warn('[activateStoreSubscription] referral:', e);
    }

    return {
      ok: true,
      message: 'Abonnement activé. Profitez de vos avantages Pro.',
      agentLaunch: launch,
      referral: referralReward,
    };
  }
);
