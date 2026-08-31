import {
  callFunction,
  getCallableErrorMessage,
} from '../lib/firebaseFunctions';
import {
  getClubLivePack,
  type ClubLivePackId,
  normalizeClubCommercialAmountEur,
} from '../content/clubLivePacks';
import { adminAuditService } from './adminAudit.service';
import { doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { getDb } from '../lib/firebase';
import { getErrorCode } from '../utils/errors';

const BILLING_FN = 'adminClubBilling';
const BILLING_REGION = 'europe-west1';

const BILLING_DEPLOY_HINT =
  'Déployez : firebase deploy --only functions:adminClubBilling (région europe-west1).';

const INVOICE_FN_MISSING =
  `Impossible d’envoyer la facture Stripe : Cloud Function « ${BILLING_FN} » absente ou non déployée. ${BILLING_DEPLOY_HINT} Le montant peut être enregistré sans Stripe.`;

export type ClubBillingPrice = {
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

export type ClubBillingInvoice = {
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

type BillingAction =
  | 'upsert_price'
  | 'get_price'
  | 'list_prices'
  | 'create_invoice'
  | 'get_invoice'
  | 'list_invoices'
  | 'refresh_invoice';

export type SetClubCommercialAmountResult = {
  price: ClubBillingPrice;
  /** `firestore_only` = CF absente ; montant écrit sur `clubs/{id}` uniquement. */
  source: 'callable' | 'firestore_only';
};

function isBareNotFoundText(msg: string): boolean {
  const n = msg.trim().toLowerCase();
  return (
    n === 'not-found' ||
    n === 'not_found' ||
    n === 'functions/not-found' ||
    n === 'not found' ||
    n.includes('cloud function introuvable') ||
    n.includes('adminclubbilling')
  );
}

/** Callable absente / région / déploiement — pas une erreur métier (club manquant, etc.). */
export function isBillingFunctionMissing(error: unknown): boolean {
  const msg =
    error && typeof error === 'object' && 'message' in error
      ? String((error as { message: string }).message)
      : '';
  const code = getErrorCode(error);

  // Erreur métier renvoyée par la CF (HttpsError not-found « Club introuvable », etc.).
  if (
    code === 'functions/not-found' &&
    msg &&
    !isBareNotFoundText(msg) &&
    !/déploy|cloud function introuvable|adminclubbilling/i.test(msg)
  ) {
    return false;
  }

  if (code === 'functions/not-found') return true;
  if (isBareNotFoundText(msg)) return true;

  // Indisponibilité infra (hors not-found métier déjà filtré).
  if (
    code === 'functions/unavailable' ||
    code === 'functions/deadline-exceeded' ||
    code === 'functions/internal' ||
    code === 'functions/unknown'
  ) {
    return true;
  }

  return false;
}

function mapBillingError(error: unknown, action: BillingAction): string {
  if (isBillingFunctionMissing(error)) {
    if (action === 'create_invoice') return INVOICE_FN_MISSING;
    return `Facturation club indisponible (« ${BILLING_FN} »). ${BILLING_DEPLOY_HINT}`;
  }
  const msg =
    error instanceof Error && error.message.trim()
      ? error.message.trim()
      : getCallableErrorMessage(error);
  if (/customerEmail|e-mail|email/i.test(msg) && /requis|invalide|missing/i.test(msg)) {
    return 'E-mail facturation manquant ou invalide. Indiquez un e-mail club (owner ou billing).';
  }
  return msg || 'Action facturation impossible. Réessayez.';
}

async function callBilling<T extends Record<string, unknown>>(
  action: BillingAction,
  body: Record<string, unknown>,
): Promise<T> {
  try {
    return await callFunction<Record<string, unknown>, T>(
      BILLING_FN,
      { action, ...body },
      BILLING_REGION,
    );
  } catch (e) {
    throw Object.assign(new Error(mapBillingError(e, action)), {
      code: getErrorCode(e) || (e as { code?: string })?.code,
      cause: e,
    });
  }
}

function localPriceDoc(input: {
  clubId: string;
  offerId: ClubLivePackId;
  amountEur: number;
  note?: string | null;
}): ClubBillingPrice {
  const pack = getClubLivePack(input.offerId);
  return {
    id: `${input.clubId}_${input.offerId}`,
    club_id: input.clubId,
    offer_id: input.offerId,
    label: pack.label,
    amount_cents: Math.round(input.amountEur * 100),
    currency: 'eur',
    lives_count: pack.livesCount ?? null,
    notes: input.note?.trim() || null,
    updated_at: new Date().toISOString(),
  };
}

/** Miroir sur `clubs/{id}` pour listes admin (Finances / fiche). */
async function mirrorClubCommercial(input: {
  clubId: string;
  offerId: ClubLivePackId;
  amountEur: number;
  note?: string | null;
  invoice?: ClubBillingInvoice | null;
  actorUid?: string;
}): Promise<void> {
  const database = getDb();
  if (!database) {
    throw new Error('Firestore indisponible — impossible d’enregistrer le montant.');
  }
  const patch: Record<string, unknown> = {
    commercial_offer_id: input.offerId,
    commercial_amount_eur: input.amountEur,
    commercial_amount_note: input.note?.trim() || null,
    commercial_amount_updated_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  };
  if (input.actorUid) {
    patch.commercial_amount_updated_by = input.actorUid;
  }
  if (input.invoice) {
    patch.stripe_invoice_id = input.invoice.stripe_invoice_id;
    patch.stripe_invoice_status = input.invoice.status;
    patch.stripe_invoice_hosted_url = input.invoice.hosted_invoice_url;
    patch.stripe_invoice_pdf = input.invoice.invoice_pdf;
    patch.stripe_invoice_amount_eur = input.invoice.amount_due_cents / 100;
    patch.stripe_customer_id = input.invoice.stripe_customer_id;
    if (input.invoice.status === 'open' || input.invoice.status === 'paid') {
      patch.stripe_invoice_sent_at = serverTimestamp();
    }
  }
  await updateDoc(doc(database, 'clubs', input.clubId), patch);
}

/**
 * Facturation commerciale club — même source que le Control Center web
 * (`adminClubBilling` / `websiteClubBillingAdmin`). Pas de secret Stripe client.
 */
export const clubCommercialBillingService = {
  async listPrices(clubId: string): Promise<ClubBillingPrice[]> {
    const res = await callBilling<{ ok: boolean; prices: ClubBillingPrice[] }>('list_prices', {
      clubId,
    });
    return res.prices ?? [];
  },

  async listInvoices(clubId: string): Promise<ClubBillingInvoice[]> {
    const res = await callBilling<{ ok: boolean; invoices: ClubBillingInvoice[] }>(
      'list_invoices',
      { clubId },
    );
    return res.invoices ?? [];
  },

  async getPrice(clubId: string, offerId: ClubLivePackId): Promise<ClubBillingPrice | null> {
    const res = await callBilling<{ ok: boolean; price: ClubBillingPrice | null }>('get_price', {
      clubId,
      offerId,
    });
    return res.price ?? null;
  },

  async setAmount(input: {
    clubId: string;
    amountEur: number;
    offerId: ClubLivePackId;
    note?: string;
    adminUid?: string;
    adminEmail?: string;
  }): Promise<SetClubCommercialAmountResult> {
    const amount = normalizeClubCommercialAmountEur(input.amountEur);
    if (amount == null) {
      throw new Error('Montant invalide (0,01 € – 500 000 €).');
    }
    const pack = getClubLivePack(input.offerId);
    const note = input.note;

    try {
      const res = await callBilling<{ ok: boolean; price: ClubBillingPrice }>('upsert_price', {
        clubId: input.clubId,
        offerId: input.offerId,
        amountEur: amount,
        label: pack.label,
        notes: note,
        livesCount: pack.livesCount ?? null,
      });

      await mirrorClubCommercial({
        clubId: input.clubId,
        offerId: input.offerId,
        amountEur: amount,
        note,
        actorUid: input.adminUid,
      });

      if (input.adminUid) {
        await adminAuditService.log({
          action: 'club_commercial_amount_set',
          actor_uid: input.adminUid,
          actor_email: input.adminEmail,
          target_type: 'club',
          target_id: input.clubId,
          summary: `Montant club ${amount} € · ${input.offerId}`,
        });
      }
      return { price: res.price, source: 'callable' };
    } catch (e) {
      if (!isBillingFunctionMissing(e)) {
        throw e instanceof Error ? e : new Error(mapBillingError(e, 'upsert_price'));
      }

      // CF absente : enregistrer quand même commercial_* (pas de Stripe).
      await mirrorClubCommercial({
        clubId: input.clubId,
        offerId: input.offerId,
        amountEur: amount,
        note,
        actorUid: input.adminUid,
      });

      if (input.adminUid) {
        await adminAuditService.log({
          action: 'club_commercial_amount_set',
          actor_uid: input.adminUid,
          actor_email: input.adminEmail,
          target_type: 'club',
          target_id: input.clubId,
          summary: `Montant club ${amount} € · ${input.offerId} (Firestore only — CF absente)`,
        });
      }

      return {
        price: localPriceDoc({
          clubId: input.clubId,
          offerId: input.offerId,
          amountEur: amount,
          note,
        }),
        source: 'firestore_only',
      };
    }
  },

  async createAndSendInvoice(input: {
    clubId: string;
    amountEur?: number;
    offerId: ClubLivePackId;
    customerEmail: string;
    clubName?: string;
    description?: string;
    daysUntilDue?: number;
    send?: boolean;
    adminUid?: string;
    adminEmail?: string;
  }): Promise<{ invoice: ClubBillingInvoice }> {
    const email = input.customerEmail.trim().toLowerCase();
    if (!email.includes('@')) {
      throw new Error('E-mail destinataire invalide.');
    }
    if (input.amountEur != null) {
      const amount = normalizeClubCommercialAmountEur(input.amountEur);
      if (amount == null) {
        throw new Error('Montant invalide (0,01 € – 500 000 €).');
      }
    }
    const pack = getClubLivePack(input.offerId);

    let res: { ok: boolean; invoice: ClubBillingInvoice };
    try {
      res = await callBilling<{ ok: boolean; invoice: ClubBillingInvoice }>('create_invoice', {
        clubId: input.clubId,
        offerId: input.offerId,
        amountEur: input.amountEur,
        customerEmail: email,
        clubName: input.clubName,
        label: pack.label,
        description: input.description,
        daysUntilDue: input.daysUntilDue ?? 30,
        sendInvoice: input.send !== false,
        livesCount: pack.livesCount ?? null,
      });
    } catch (e) {
      if (isBillingFunctionMissing(e)) {
        throw new Error(INVOICE_FN_MISSING);
      }
      throw e instanceof Error ? e : new Error(mapBillingError(e, 'create_invoice'));
    }

    const amountEur =
      input.amountEur ?? (res.invoice ? res.invoice.amount_due_cents / 100 : 0);

    await mirrorClubCommercial({
      clubId: input.clubId,
      offerId: input.offerId,
      amountEur,
      invoice: res.invoice,
      actorUid: input.adminUid,
    });

    // Miroir billing_email
    if (email) {
      try {
        const database = getDb();
        if (database) {
          await updateDoc(doc(database, 'clubs', input.clubId), {
            billing_email: email,
            updated_at: serverTimestamp(),
          });
        }
      } catch {
        /* best-effort */
      }
    }

    if (input.adminUid) {
      await adminAuditService.log({
        action: 'club_stripe_invoice_sent',
        actor_uid: input.adminUid,
        actor_email: input.adminEmail,
        target_type: 'club',
        target_id: input.clubId,
        summary: `Facture Stripe ${res.invoice.stripe_invoice_id} · ${amountEur} € · ${res.invoice.status}`,
      });
    }
    return { invoice: res.invoice };
  },
};
