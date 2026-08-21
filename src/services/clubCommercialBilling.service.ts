import { callFunction, getCallableErrorMessage } from '../lib/firebaseFunctions';
import {
  getClubLivePack,
  type ClubLivePackId,
  normalizeClubCommercialAmountEur,
} from '../content/clubLivePacks';
import { adminAuditService } from './adminAudit.service';
import { doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { getDb } from '../lib/firebase';

const BILLING_FN = 'adminClubBilling';
const BILLING_REGION = 'europe-west1';

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
    throw new Error(getCallableErrorMessage(e));
  }
}

/** Miroir sur `clubs/{id}` pour listes admin (Finances / fiche). */
async function mirrorClubCommercial(input: {
  clubId: string;
  offerId: ClubLivePackId;
  amountEur: number;
  note?: string | null;
  invoice?: ClubBillingInvoice | null;
}): Promise<void> {
  const database = getDb();
  if (!database) return;
  const patch: Record<string, unknown> = {
    commercial_offer_id: input.offerId,
    commercial_amount_eur: input.amountEur,
    commercial_amount_note: input.note?.trim() || null,
    commercial_amount_updated_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  };
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
  }): Promise<{ price: ClubBillingPrice }> {
    const amount = normalizeClubCommercialAmountEur(input.amountEur);
    if (amount == null) {
      throw new Error('Montant invalide (0,01 € – 500 000 €).');
    }
    const pack = getClubLivePack(input.offerId);
    const res = await callBilling<{ ok: boolean; price: ClubBillingPrice }>('upsert_price', {
      clubId: input.clubId,
      offerId: input.offerId,
      amountEur: amount,
      label: pack.label,
      notes: input.note,
      livesCount: pack.livesCount ?? null,
    });

    await mirrorClubCommercial({
      clubId: input.clubId,
      offerId: input.offerId,
      amountEur: amount,
      note: input.note,
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
    return { price: res.price };
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
    const res = await callBilling<{ ok: boolean; invoice: ClubBillingInvoice }>('create_invoice', {
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

    const amountEur =
      input.amountEur ??
      (res.invoice ? res.invoice.amount_due_cents / 100 : 0);

    await mirrorClubCommercial({
      clubId: input.clubId,
      offerId: input.offerId,
      amountEur,
      invoice: res.invoice,
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
