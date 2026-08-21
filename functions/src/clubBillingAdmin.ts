/**
 * Facturation club (prix custom + Stripe Invoices) — admin site / app.
 * Secrets Stripe uniquement ici (STRIPE_SECRET_KEY). Pas de faux paiements.
 */
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { timingSafeEqual } from 'crypto';
import Stripe from 'stripe';
import { configStr } from './runtimeConfig';
import { writeWebsiteAdminAudit } from './websiteAdminAudit';
import {
  createClubStripeInvoiceCore,
  LIVE_PACK_LABELS,
  setClubCommercialAmountCore,
} from './clubStripeInvoice';

const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'https://proday75.fr',
  'https://www.proday75.fr',
  'https://proday.app',
  'https://www.proday.app',
  'https://proday75.netlify.app',
];

const PRICES_COL = 'club_billing_prices';
const INVOICES_COL = 'club_stripe_invoices';
const CUSTOMERS_COL = 'club_billing_customers';

/** Offres connues — alignées app (`clubLivePacks`) + aliases site. */
export const CLUB_BILLING_OFFER_PRESETS: Record<
  string,
  { label: string; defaultAmountCents?: number; livesCount?: number; canonical?: string }
> = {
  club_premium: { label: LIVE_PACK_LABELS.club_premium },
  club_video_pro: { label: LIVE_PACK_LABELS.club_video_pro },
  club_live_duo: { label: LIVE_PACK_LABELS.club_live_duo, livesCount: 2 },
  veo_lives_2: {
    label: LIVE_PACK_LABELS.club_live_duo,
    livesCount: 2,
    canonical: 'club_live_duo',
  },
  veo_lives_custom: { label: 'Lives Veo (custom)' },
  video_veo_pack: { label: 'Pack ProDay Pro + Veo', defaultAmountCents: 14900 },
};

export type ClubBillingAction =
  | 'upsert_price'
  | 'get_price'
  | 'list_prices'
  | 'create_invoice'
  | 'get_invoice'
  | 'list_invoices'
  | 'refresh_invoice';

export type ClubBillingPriceDoc = {
  id: string;
  club_id: string;
  offer_id: string;
  label: string;
  amount_cents: number;
  currency: string;
  lives_count: number | null;
  notes: string | null;
  updated_at: string | null;
};

export type ClubBillingInvoiceDoc = {
  id: string;
  club_id: string;
  offer_id: string;
  label: string;
  amount_due_cents: number;
  currency: string;
  status: string;
  stripe_invoice_id: string;
  stripe_customer_id: string;
  customer_email: string;
  hosted_invoice_url: string | null;
  invoice_pdf: string | null;
  lives_count: number | null;
  created_at: string | null;
  updated_at: string | null;
  paid_at: string | null;
};

function getStripe(): Stripe | null {
  const secret = configStr('stripe', 'secret_key', ['STRIPE_SECRET_KEY']) ?? '';
  if (!secret) return null;
  return new Stripe(secret, { apiVersion: '2025-02-24.acacia' });
}

function getConfiguredSecret(): string | null {
  return (
    configStr('beta', 'website_admin_secret', [
      'BETA_WEBSITE_ADMIN_SECRET',
      'BETA_ADMIN_API_SECRET',
    ]) ?? null
  );
}

function secretsMatch(provided: string, expected: string): boolean {
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length === 0 || a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

function extractProvidedSecret(req: functions.https.Request): string {
  const headerSecret = String(req.get('X-Admin-Secret') ?? '').trim();
  if (headerSecret) return headerSecret;
  const auth = String(req.get('Authorization') ?? '').trim();
  if (auth.toLowerCase().startsWith('bearer ')) return auth.slice(7).trim();
  return '';
}

function assertWebsiteAdmin(req: functions.https.Request): void {
  const expected = getConfiguredSecret();
  if (!expected) {
    throw new functions.https.HttpsError(
      'failed-precondition',
      'Secret admin site non configuré (BETA_WEBSITE_ADMIN_SECRET)',
    );
  }
  if (!secretsMatch(extractProvidedSecret(req), expected)) {
    throw new functions.https.HttpsError('permission-denied', 'Secret invalide');
  }
}

function setCors(req: functions.https.Request, res: functions.Response): boolean {
  const origin = req.get('Origin') ?? '';
  if (
    origin &&
    (ALLOWED_ORIGINS.includes(origin) || origin.endsWith('.netlify.app'))
  ) {
    res.set('Access-Control-Allow-Origin', origin);
  }
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Admin-Secret');
  return req.method === 'OPTIONS';
}

function toIso(value: unknown): string | null {
  if (value && typeof value === 'object' && 'toDate' in value) {
    try {
      return (value as { toDate: () => Date }).toDate().toISOString();
    } catch {
      return null;
    }
  }
  if (typeof value === 'string' && value.trim()) return value;
  return null;
}

function priceDocId(clubId: string, offerId: string): string {
  return `${clubId}__${offerId}`.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 700);
}

function normalizeOfferId(raw: string): string {
  const id = String(raw ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '_')
    .slice(0, 80);
  const preset = CLUB_BILLING_OFFER_PRESETS[id];
  return preset?.canonical ?? id;
}

function mapPrice(
  id: string,
  data: admin.firestore.DocumentData,
): ClubBillingPriceDoc {
  return {
    id,
    club_id: String(data.club_id ?? ''),
    offer_id: String(data.offer_id ?? ''),
    label: String(data.label ?? ''),
    amount_cents: Number(data.amount_cents ?? 0),
    currency: String(data.currency ?? 'eur'),
    lives_count:
      typeof data.lives_count === 'number' && Number.isFinite(data.lives_count)
        ? data.lives_count
        : null,
    notes: data.notes != null ? String(data.notes) : null,
    updated_at: toIso(data.updated_at),
  };
}

function mapInvoice(
  id: string,
  data: admin.firestore.DocumentData,
): ClubBillingInvoiceDoc {
  return {
    id,
    club_id: String(data.club_id ?? ''),
    offer_id: String(data.offer_id ?? ''),
    label: String(data.label ?? ''),
    amount_due_cents: Number(data.amount_due_cents ?? data.amount_cents ?? 0),
    currency: String(data.currency ?? 'eur'),
    status: String(data.status ?? 'unknown'),
    stripe_invoice_id: String(data.stripe_invoice_id ?? ''),
    stripe_customer_id: String(data.stripe_customer_id ?? ''),
    customer_email: String(data.customer_email ?? ''),
    hosted_invoice_url: data.hosted_invoice_url
      ? String(data.hosted_invoice_url)
      : null,
    invoice_pdf: data.invoice_pdf ? String(data.invoice_pdf) : null,
    lives_count:
      typeof data.lives_count === 'number' && Number.isFinite(data.lives_count)
        ? data.lives_count
        : null,
    created_at: toIso(data.created_at),
    updated_at: toIso(data.updated_at),
    paid_at: toIso(data.paid_at),
  };
}

async function ensureClubStripeCustomer(
  db: admin.firestore.Firestore,
  stripe: Stripe,
  clubId: string,
  email: string,
  clubName?: string | null,
): Promise<string> {
  const ref = db.collection(CUSTOMERS_COL).doc(clubId);
  const snap = await ref.get();
  const existing = String(snap.data()?.stripe_customer_id ?? '').trim();
  if (existing) {
    if (email) {
      try {
        await stripe.customers.update(existing, {
          email,
          ...(clubName ? { name: clubName.slice(0, 120) } : {}),
        });
      } catch (e) {
        console.warn('[clubBilling] customer update', e);
      }
    }
    return existing;
  }

  const customer = await stripe.customers.create({
    email: email || undefined,
    name: clubName?.slice(0, 120) || undefined,
    metadata: { proday_club_id: clubId, source: 'club_billing_admin' },
  });
  await ref.set(
    {
      club_id: clubId,
      stripe_customer_id: customer.id,
      email: email || null,
      name: clubName ?? null,
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
      created_at: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
  return customer.id;
}

type ActionBody = {
  action?: ClubBillingAction;
  clubId?: string;
  offerId?: string;
  label?: string;
  amountCents?: number;
  amountEur?: number;
  currency?: string;
  livesCount?: number | null;
  notes?: string | null;
  customerEmail?: string;
  clubName?: string;
  daysUntilDue?: number;
  sendInvoice?: boolean;
  invoiceId?: string;
  stripeInvoiceId?: string;
  description?: string;
};

async function upsertPrice(
  db: admin.firestore.Firestore,
  body: ActionBody,
): Promise<{ ok: true; price: ClubBillingPriceDoc; club?: Record<string, unknown> }> {
  const clubId = String(body.clubId ?? '').trim();
  const offerId = normalizeOfferId(String(body.offerId ?? ''));
  if (!clubId || !offerId) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'clubId et offerId requis',
    );
  }

  let amountCents =
    typeof body.amountCents === 'number' && Number.isFinite(body.amountCents)
      ? Math.round(body.amountCents)
      : typeof body.amountEur === 'number' && Number.isFinite(body.amountEur)
        ? Math.round(body.amountEur * 100)
        : NaN;
  if (!Number.isFinite(amountCents) || amountCents <= 0) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Montant invalide (amountCents ou amountEur > 0)',
    );
  }
  if (amountCents > 50_000_000) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Montant trop élevé',
    );
  }

  const amountEur = Math.round(amountCents) / 100;
  const notes =
    body.notes != null && String(body.notes).trim()
      ? String(body.notes).trim().slice(0, 1000)
      : null;

  // Contrat app : si `clubs/{id}` existe → commercial_* (source de vérité mobile).
  const clubRef = db.doc(`clubs/${clubId}`);
  const clubSnap = await clubRef.get();
  if (clubSnap.exists) {
    const result = await setClubCommercialAmountCore({
      clubId,
      amountEur,
      offerId,
      note: notes,
      actorUid: 'website-admin',
    });
    const preset = CLUB_BILLING_OFFER_PRESETS[result.offerId];
    const price: ClubBillingPriceDoc = {
      id: priceDocId(clubId, result.offerId),
      club_id: clubId,
      offer_id: result.offerId,
      label: String(body.label ?? '').trim() || preset?.label || result.offerId,
      amount_cents: Math.round(result.amountEur * 100),
      currency: 'eur',
      lives_count:
        typeof body.livesCount === 'number'
          ? Math.floor(body.livesCount)
          : preset?.livesCount ?? null,
      notes,
      updated_at: new Date().toISOString(),
    };
    // Miroir collection prix pour listes admin site.
    await db.collection(PRICES_COL).doc(price.id).set(
      {
        ...price,
        updated_at: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
    return { ok: true, price, club: result };
  }

  const preset = CLUB_BILLING_OFFER_PRESETS[offerId];
  const label =
    String(body.label ?? '').trim() ||
    preset?.label ||
    `Offre ${offerId}`;
  const currency = String(body.currency ?? 'eur').trim().toLowerCase() || 'eur';
  const livesCount =
    typeof body.livesCount === 'number' && Number.isFinite(body.livesCount)
      ? Math.max(0, Math.floor(body.livesCount))
      : preset?.livesCount ?? null;

  const id = priceDocId(clubId, offerId);
  const ref = db.collection(PRICES_COL).doc(id);
  await ref.set(
    {
      club_id: clubId,
      offer_id: offerId,
      label: label.slice(0, 200),
      amount_cents: amountCents,
      currency,
      lives_count: livesCount,
      notes,
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true },
  );

  const snap = await ref.get();
  const price = mapPrice(id, snap.data() ?? {});
  await writeWebsiteAdminAudit(db, {
    action: 'other',
    target_type: 'club_billing_price',
    target_id: id,
    summary: `Prix club ${clubId} / ${offerId} → ${(amountCents / 100).toFixed(2)} ${currency.toUpperCase()}`,
    meta: { club_id: clubId, offer_id: offerId, amount_cents: amountCents },
  });
  return { ok: true, price };
}

async function getPrice(
  db: admin.firestore.Firestore,
  body: ActionBody,
): Promise<{ ok: true; price: ClubBillingPriceDoc | null }> {
  const clubId = String(body.clubId ?? '').trim();
  const offerId = normalizeOfferId(String(body.offerId ?? ''));
  if (!clubId || !offerId) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'clubId et offerId requis',
    );
  }
  const snap = await db.collection(PRICES_COL).doc(priceDocId(clubId, offerId)).get();
  if (!snap.exists) return { ok: true, price: null };
  return { ok: true, price: mapPrice(snap.id, snap.data()!) };
}

async function listPrices(
  db: admin.firestore.Firestore,
  body: ActionBody,
): Promise<{ ok: true; prices: ClubBillingPriceDoc[] }> {
  const clubId = String(body.clubId ?? '').trim();
  if (!clubId) {
    throw new functions.https.HttpsError('invalid-argument', 'clubId requis');
  }
  const snap = await db
    .collection(PRICES_COL)
    .where('club_id', '==', clubId)
    .limit(50)
    .get();
  return {
    ok: true,
    prices: snap.docs.map((d) => mapPrice(d.id, d.data())),
  };
}

async function createAndSendInvoice(
  db: admin.firestore.Firestore,
  stripe: Stripe,
  body: ActionBody,
): Promise<{ ok: true; invoice: ClubBillingInvoiceDoc }> {
  const clubId = String(body.clubId ?? '').trim();
  const offerId = normalizeOfferId(String(body.offerId ?? 'custom'));
  const customerEmail = String(body.customerEmail ?? '')
    .trim()
    .toLowerCase();
  if (!clubId) {
    throw new functions.https.HttpsError('invalid-argument', 'clubId requis');
  }
  if (!customerEmail || !customerEmail.includes('@')) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'customerEmail valide requis',
    );
  }

  let amountCents =
    typeof body.amountCents === 'number' && Number.isFinite(body.amountCents)
      ? Math.round(body.amountCents)
      : typeof body.amountEur === 'number' && Number.isFinite(body.amountEur)
        ? Math.round(body.amountEur * 100)
        : NaN;

  let label = String(body.label ?? '').trim();
  let livesCount =
    typeof body.livesCount === 'number' && Number.isFinite(body.livesCount)
      ? Math.max(0, Math.floor(body.livesCount))
      : null;

  if (!Number.isFinite(amountCents) || amountCents <= 0) {
    const stored = await db
      .collection(PRICES_COL)
      .doc(priceDocId(clubId, offerId))
      .get();
    if (stored.exists) {
      const data = stored.data()!;
      amountCents = Number(data.amount_cents ?? 0);
      if (!label) label = String(data.label ?? '');
      if (livesCount == null && typeof data.lives_count === 'number') {
        livesCount = data.lives_count;
      }
    }
  }

  const preset = CLUB_BILLING_OFFER_PRESETS[offerId];
  if ((!Number.isFinite(amountCents) || amountCents <= 0) && preset?.defaultAmountCents) {
    amountCents = preset.defaultAmountCents;
  }
  if (!Number.isFinite(amountCents) || amountCents <= 0) {
    throw new functions.https.HttpsError(
      'failed-precondition',
      'Aucun montant : upsert_price d’abord ou passer amountCents / amountEur',
    );
  }
  if (!label) label = preset?.label || `Facture ProDay — ${offerId}`;
  if (livesCount == null && preset?.livesCount != null) {
    livesCount = preset.livesCount;
  }

  const currency = String(body.currency ?? 'eur').trim().toLowerCase() || 'eur';
  const daysUntilDue = Math.min(
    90,
    Math.max(1, Math.floor(Number(body.daysUntilDue ?? 14) || 14)),
  );
  const sendInvoice = body.sendInvoice !== false;
  const description =
    String(body.description ?? '').trim() ||
    (livesCount != null
      ? `${label} — ${livesCount} live${livesCount > 1 ? 's' : ''}`
      : label);

  const customerId = await ensureClubStripeCustomer(
    db,
    stripe,
    clubId,
    customerEmail,
    body.clubName,
  );

  await stripe.invoiceItems.create({
    customer: customerId,
    currency,
    amount: amountCents,
    description: description.slice(0, 500),
    metadata: {
      type: 'club_billing',
      club_id: clubId,
      offer_id: offerId,
      ...(livesCount != null ? { lives_count: String(livesCount) } : {}),
    },
  });

  const invoice = await stripe.invoices.create({
    customer: customerId,
    collection_method: 'send_invoice',
    days_until_due: daysUntilDue,
    auto_advance: true,
    metadata: {
      type: 'club_billing',
      club_id: clubId,
      offer_id: offerId,
      ...(livesCount != null ? { lives_count: String(livesCount) } : {}),
    },
    custom_fields: livesCount != null
      ? [{ name: 'Lives', value: String(livesCount) }]
      : undefined,
  });

  const finalized = await stripe.invoices.finalizeInvoice(invoice.id);
  let finalInvoice = finalized;
  if (sendInvoice) {
    finalInvoice = await stripe.invoices.sendInvoice(finalized.id);
  }

  const docRef = db.collection(INVOICES_COL).doc();
  const payload = {
    club_id: clubId,
    offer_id: offerId,
    label: label.slice(0, 200),
    amount_cents: amountCents,
    amount_due_cents: finalInvoice.amount_due ?? amountCents,
    currency,
    status: String(finalInvoice.status ?? 'open'),
    stripe_invoice_id: finalInvoice.id,
    stripe_customer_id: customerId,
    customer_email: customerEmail,
    hosted_invoice_url: finalInvoice.hosted_invoice_url ?? null,
    invoice_pdf: finalInvoice.invoice_pdf ?? null,
    lives_count: livesCount,
    days_until_due: daysUntilDue,
    sent: sendInvoice,
    created_at: admin.firestore.FieldValue.serverTimestamp(),
    updated_at: admin.firestore.FieldValue.serverTimestamp(),
    paid_at: null,
  };
  await docRef.set(payload);

  await writeWebsiteAdminAudit(db, {
    action: 'other',
    target_type: 'club_stripe_invoice',
    target_id: docRef.id,
    summary: `Invoice Stripe ${finalInvoice.id} club ${clubId} (${(amountCents / 100).toFixed(2)} ${currency.toUpperCase()})`,
    meta: {
      club_id: clubId,
      offer_id: offerId,
      stripe_invoice_id: finalInvoice.id,
      sent: sendInvoice,
    },
  });

  return {
    ok: true,
    invoice: mapInvoice(docRef.id, {
      ...payload,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }),
  };
}

async function getInvoice(
  db: admin.firestore.Firestore,
  body: ActionBody,
): Promise<{ ok: true; invoice: ClubBillingInvoiceDoc | null }> {
  const invoiceId = String(body.invoiceId ?? '').trim();
  const stripeInvoiceId = String(body.stripeInvoiceId ?? '').trim();
  if (invoiceId) {
    const snap = await db.collection(INVOICES_COL).doc(invoiceId).get();
    if (!snap.exists) return { ok: true, invoice: null };
    return { ok: true, invoice: mapInvoice(snap.id, snap.data()!) };
  }
  if (stripeInvoiceId) {
    const snap = await db
      .collection(INVOICES_COL)
      .where('stripe_invoice_id', '==', stripeInvoiceId)
      .limit(1)
      .get();
    if (snap.empty) return { ok: true, invoice: null };
    const doc = snap.docs[0];
    return { ok: true, invoice: mapInvoice(doc.id, doc.data()) };
  }
  throw new functions.https.HttpsError(
    'invalid-argument',
    'invoiceId ou stripeInvoiceId requis',
  );
}

async function listInvoices(
  db: admin.firestore.Firestore,
  body: ActionBody,
): Promise<{ ok: true; invoices: ClubBillingInvoiceDoc[] }> {
  const clubId = String(body.clubId ?? '').trim();
  let query: admin.firestore.Query = db.collection(INVOICES_COL);
  if (clubId) {
    query = query.where('club_id', '==', clubId);
  }
  const snap = await query.limit(50).get();
  const invoices = snap.docs
    .map((d) => mapInvoice(d.id, d.data()))
    .sort((a, b) => String(b.created_at ?? '').localeCompare(String(a.created_at ?? '')));
  return { ok: true, invoices };
}

async function refreshInvoice(
  db: admin.firestore.Firestore,
  stripe: Stripe,
  body: ActionBody,
): Promise<{ ok: true; invoice: ClubBillingInvoiceDoc }> {
  const local = await getInvoice(db, body);
  if (!local.invoice?.stripe_invoice_id) {
    throw new functions.https.HttpsError('not-found', 'Facture introuvable');
  }
  const remote = await stripe.invoices.retrieve(local.invoice.stripe_invoice_id);
  const ref = db.collection(INVOICES_COL).doc(local.invoice.id);
  const patch: Record<string, unknown> = {
    status: String(remote.status ?? local.invoice.status),
    amount_due_cents: remote.amount_due ?? local.invoice.amount_due_cents,
    hosted_invoice_url: remote.hosted_invoice_url ?? null,
    invoice_pdf: remote.invoice_pdf ?? null,
    updated_at: admin.firestore.FieldValue.serverTimestamp(),
  };
  if (remote.status === 'paid') {
    patch.paid_at = admin.firestore.FieldValue.serverTimestamp();
  }
  await ref.set(patch, { merge: true });
  const snap = await ref.get();
  return { ok: true, invoice: mapInvoice(snap.id, snap.data()!) };
}

export async function handleClubBillingAction(
  db: admin.firestore.Firestore,
  body: ActionBody,
): Promise<Record<string, unknown>> {
  const action = String(body.action ?? '').trim() as ClubBillingAction;
  if (!action) {
    throw new functions.https.HttpsError('invalid-argument', 'action requise');
  }

  if (action === 'upsert_price') return upsertPrice(db, body);
  if (action === 'get_price') return getPrice(db, body);
  if (action === 'list_prices') return listPrices(db, body);
  if (action === 'get_invoice') return getInvoice(db, body);
  if (action === 'list_invoices') return listInvoices(db, body);

  const stripe = getStripe();
  if (!stripe) {
    throw new functions.https.HttpsError(
      'failed-precondition',
      'Stripe non configuré (STRIPE_SECRET_KEY)',
    );
  }
  if (action === 'create_invoice') return createAndSendInvoice(db, stripe, body);
  if (action === 'refresh_invoice') return refreshInvoice(db, stripe, body);

  throw new functions.https.HttpsError('invalid-argument', `Action inconnue: ${action}`);
}

/** Sync Firestore depuis webhook Stripe invoice.* */
export async function syncClubInvoiceFromStripeEvent(
  db: admin.firestore.Firestore,
  invoice: Stripe.Invoice,
): Promise<void> {
  if (invoice.metadata?.type !== 'club_billing') return;
  const stripeId = invoice.id;
  const snap = await db
    .collection(INVOICES_COL)
    .where('stripe_invoice_id', '==', stripeId)
    .limit(1)
    .get();
  if (snap.empty) return;
  const ref = snap.docs[0].ref;
  const patch: Record<string, unknown> = {
    status: String(invoice.status ?? 'unknown'),
    amount_due_cents: invoice.amount_due ?? 0,
    hosted_invoice_url: invoice.hosted_invoice_url ?? null,
    invoice_pdf: invoice.invoice_pdf ?? null,
    updated_at: admin.firestore.FieldValue.serverTimestamp(),
  };
  if (invoice.status === 'paid') {
    patch.paid_at = admin.firestore.FieldValue.serverTimestamp();
  }
  await ref.set(patch, { merge: true });
}

export function createWebsiteClubBillingAdminHandler(db: admin.firestore.Firestore) {
  return async (req: functions.https.Request, res: functions.Response) => {
    if (setCors(req, res)) {
      res.status(204).send('');
      return;
    }
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method Not Allowed' });
      return;
    }
    try {
      assertWebsiteAdmin(req);
      const body = (req.body ?? {}) as ActionBody;
      const result = await handleClubBillingAction(db, body);
      res.status(200).json(result);
    } catch (e) {
      if (e instanceof functions.https.HttpsError) {
        const code = e.code;
        const status =
          code === 'permission-denied'
            ? 403
            : code === 'invalid-argument'
              ? 400
              : code === 'not-found'
                ? 404
                : code === 'failed-precondition'
                  ? 503
                  : 400;
        res.status(status).json({ error: e.message, code });
        return;
      }
      console.error('[websiteClubBillingAdmin]', e);
      res.status(500).json({ error: 'Erreur interne' });
    }
  };
}

/** Callable Firebase — admin claim (app mobile Control Center). */
export function createAdminClubBillingCallable(db: admin.firestore.Firestore) {
  return async (
    data: ActionBody,
    context: functions.https.CallableContext,
  ): Promise<Record<string, unknown>> => {
    if (!context.auth?.uid) {
      throw new functions.https.HttpsError('unauthenticated', 'Connexion requise');
    }
    if (!context.auth.token?.admin) {
      throw new functions.https.HttpsError('permission-denied', 'Admin only');
    }
    return handleClubBillingAction(db, data ?? {});
  };
}
