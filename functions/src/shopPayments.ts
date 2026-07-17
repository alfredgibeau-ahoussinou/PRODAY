import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import Stripe from 'stripe';
import { configStr } from './runtimeConfig';
import { sendFcmToUser } from './messaging';
import { SHOP_STRIPE_PRODUCTS } from './shopStripeCatalog';

const db = admin.firestore();

function getStripe(): Stripe | null {
  const secret = configStr('stripe', 'secret_key', ['STRIPE_SECRET_KEY']) ?? '';
  if (!secret) return null;
  return new Stripe(secret, { apiVersion: '2025-02-24.acacia' });
}

type CartLineInput = { productId: string; qty: number };

/** Crée une session Stripe Checkout pour le panier boutique */
export const createShopCheckoutSession = functions.https.onCall(async (data, context) => {
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

  const { lines, productLine } = data as {
    lines: CartLineInput[];
    productLine?: string;
  };

  if (!Array.isArray(lines) || lines.length === 0) {
    throw new functions.https.HttpsError('invalid-argument', 'Panier vide');
  }

  const normalized: CartLineInput[] = [];
  for (const line of lines) {
    const productId = String(line.productId ?? '').trim();
    const qty = Math.floor(Number(line.qty ?? 0));
    if (!productId || qty <= 0 || qty > 20) {
      throw new functions.https.HttpsError('invalid-argument', 'Ligne panier invalide');
    }
    normalized.push({ productId, qty });
  }

  const stripeLines: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
  let totalCents = 0;
  const orderLines: { product_id: string; name: string; qty: number; unit_eur: number }[] = [];

  for (const { productId, qty } of normalized) {
    const product = SHOP_STRIPE_PRODUCTS[productId];
    if (!product) {
      throw new functions.https.HttpsError('invalid-argument', `Produit inconnu : ${productId}`);
    }
    totalCents += product.priceCents * qty;
    orderLines.push({
      product_id: productId,
      name: product.name,
      qty,
      unit_eur: product.priceCents / 100,
    });
    stripeLines.push({
      price_data: {
        currency: 'eur',
        product_data: { name: product.name.slice(0, 120) },
        unit_amount: product.priceCents,
      },
      quantity: qty,
    });
  }

  if (totalCents <= 0) {
    throw new functions.https.HttpsError('invalid-argument', 'Montant invalide');
  }

  const orderRef = db.collection('shop_orders').doc();
  const buyerUid = context.auth.uid;

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: stripeLines,
    metadata: {
      type: 'shop_order',
      orderId: orderRef.id,
      buyerUid,
      productLine: String(productLine ?? 'man'),
    },
    success_url: `proday://shop?status=success&orderId=${orderRef.id}`,
    cancel_url: `proday://shop?status=cancel&orderId=${orderRef.id}`,
  });

  if (!session.url) {
    throw new functions.https.HttpsError('internal', 'URL Stripe indisponible');
  }

  await orderRef.set({
    buyer_uid: buyerUid,
    product_line: String(productLine ?? 'man'),
    lines: orderLines,
    total_eur: totalCents / 100,
    status: 'pending',
    stripe_checkout_session_id: session.id,
    created_at: admin.firestore.FieldValue.serverTimestamp(),
    updated_at: admin.firestore.FieldValue.serverTimestamp(),
  });

  return { url: session.url, sessionId: session.id, orderId: orderRef.id };
});

/** Traite un checkout boutique complété (appelé depuis stripeWebhook) */
export async function handleShopCheckoutCompleted(
  session: Stripe.Checkout.Session
): Promise<void> {
  if (session.metadata?.type !== 'shop_order') return;

  const orderId = session.metadata?.orderId;
  if (!orderId) return;

  const ref = db.doc(`shop_orders/${orderId}`);
  const snap = await ref.get();
  if (!snap.exists || snap.data()?.status === 'paid') return;

  await ref.update({
    status: 'paid',
    stripe_payment_intent: session.payment_intent ?? null,
    paid_at: admin.firestore.FieldValue.serverTimestamp(),
    updated_at: admin.firestore.FieldValue.serverTimestamp(),
  });

  const buyerUid = session.metadata?.buyerUid;
  if (buyerUid) {
    await sendFcmToUser(buyerUid, {
      title: 'Commande confirmée',
      body: 'Votre paiement ProDay Shop a bien été enregistré. Merci !',
      data: { type: 'shop_order_paid', orderId },
    });
  }
}
