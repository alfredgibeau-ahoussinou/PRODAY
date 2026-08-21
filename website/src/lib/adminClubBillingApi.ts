/** Client serveur → Cloud Function `websiteClubBillingAdmin` (secret partagé). */

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

export type ClubBillingAction =
  | "upsert_price"
  | "get_price"
  | "list_prices"
  | "create_invoice"
  | "get_invoice"
  | "list_invoices"
  | "refresh_invoice";

export type ClubBillingRequestBody = {
  action: ClubBillingAction;
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

const DEFAULT_URL =
  "https://europe-west1-proday-155b0.cloudfunctions.net/websiteClubBillingAdmin";

function getConfig(): { url: string; secret: string } | null {
  const url =
    process.env.CLUB_BILLING_ADMIN_FUNCTION_URL?.trim() || DEFAULT_URL;
  const secret = process.env.BETA_WEBSITE_ADMIN_SECRET?.trim();
  if (!secret) return null;
  return { url, secret };
}

export async function callClubBillingAdmin(
  body: ClubBillingRequestBody,
): Promise<{ status: number; data: Record<string, unknown> }> {
  const config = getConfig();
  if (!config) {
    return {
      status: 503,
      data: {
        error:
          "Billing club non configuré. Définissez BETA_WEBSITE_ADMIN_SECRET et déployez websiteClubBillingAdmin.",
      },
    };
  }

  try {
    const upstream = await fetch(config.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Admin-Secret": config.secret,
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    const data = (await upstream.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;
    return { status: upstream.status, data };
  } catch {
    return {
      status: 502,
      data: { error: "Service billing club indisponible" },
    };
  }
}

export async function upsertClubBillingPrice(input: {
  clubId: string;
  offerId: string;
  amountEur?: number;
  amountCents?: number;
  label?: string;
  livesCount?: number | null;
  notes?: string | null;
  currency?: string;
}): Promise<{
  ok: boolean;
  status: number;
  price?: ClubBillingPrice;
  error?: string;
}> {
  const { status, data } = await callClubBillingAdmin({
    action: "upsert_price",
    ...input,
  });
  if (status < 200 || status >= 300 || data.error) {
    return {
      ok: false,
      status,
      error: String(data.error ?? "Impossible d’enregistrer le prix"),
    };
  }
  return {
    ok: true,
    status,
    price: data.price as ClubBillingPrice | undefined,
  };
}

export async function getClubBillingPrice(
  clubId: string,
  offerId: string,
): Promise<{
  ok: boolean;
  status: number;
  price: ClubBillingPrice | null;
  error?: string;
}> {
  const { status, data } = await callClubBillingAdmin({
    action: "get_price",
    clubId,
    offerId,
  });
  if (status < 200 || status >= 300 || data.error) {
    return {
      ok: false,
      status,
      price: null,
      error: String(data.error ?? "Lecture impossible"),
    };
  }
  return {
    ok: true,
    status,
    price: (data.price as ClubBillingPrice | null | undefined) ?? null,
  };
}

export async function listClubBillingPrices(clubId: string): Promise<{
  ok: boolean;
  status: number;
  prices: ClubBillingPrice[];
  error?: string;
}> {
  const { status, data } = await callClubBillingAdmin({
    action: "list_prices",
    clubId,
  });
  if (status < 200 || status >= 300 || data.error) {
    return {
      ok: false,
      status,
      prices: [],
      error: String(data.error ?? "Lecture impossible"),
    };
  }
  return {
    ok: true,
    status,
    prices: Array.isArray(data.prices) ? (data.prices as ClubBillingPrice[]) : [],
  };
}

export async function createClubStripeInvoice(input: {
  clubId: string;
  offerId: string;
  customerEmail: string;
  clubName?: string;
  amountEur?: number;
  amountCents?: number;
  label?: string;
  livesCount?: number | null;
  daysUntilDue?: number;
  sendInvoice?: boolean;
  description?: string;
}): Promise<{
  ok: boolean;
  status: number;
  invoice?: ClubBillingInvoice;
  error?: string;
}> {
  const { status, data } = await callClubBillingAdmin({
    action: "create_invoice",
    ...input,
  });
  if (status < 200 || status >= 300 || data.error) {
    return {
      ok: false,
      status,
      error: String(data.error ?? "Création facture impossible"),
    };
  }
  return {
    ok: true,
    status,
    invoice: data.invoice as ClubBillingInvoice | undefined,
  };
}

export async function getClubStripeInvoice(opts: {
  invoiceId?: string;
  stripeInvoiceId?: string;
}): Promise<{
  ok: boolean;
  status: number;
  invoice: ClubBillingInvoice | null;
  error?: string;
}> {
  const { status, data } = await callClubBillingAdmin({
    action: "get_invoice",
    ...opts,
  });
  if (status < 200 || status >= 300 || data.error) {
    return {
      ok: false,
      status,
      invoice: null,
      error: String(data.error ?? "Lecture impossible"),
    };
  }
  return {
    ok: true,
    status,
    invoice: (data.invoice as ClubBillingInvoice | null | undefined) ?? null,
  };
}

export async function listClubStripeInvoices(clubId?: string): Promise<{
  ok: boolean;
  status: number;
  invoices: ClubBillingInvoice[];
  error?: string;
}> {
  const { status, data } = await callClubBillingAdmin({
    action: "list_invoices",
    ...(clubId ? { clubId } : {}),
  });
  if (status < 200 || status >= 300 || data.error) {
    return {
      ok: false,
      status,
      invoices: [],
      error: String(data.error ?? "Lecture impossible"),
    };
  }
  return {
    ok: true,
    status,
    invoices: Array.isArray(data.invoices)
      ? (data.invoices as ClubBillingInvoice[])
      : [],
  };
}

export async function refreshClubStripeInvoice(opts: {
  invoiceId?: string;
  stripeInvoiceId?: string;
}): Promise<{
  ok: boolean;
  status: number;
  invoice?: ClubBillingInvoice;
  error?: string;
}> {
  const { status, data } = await callClubBillingAdmin({
    action: "refresh_invoice",
    ...opts,
  });
  if (status < 200 || status >= 300 || data.error) {
    return {
      ok: false,
      status,
      error: String(data.error ?? "Refresh impossible"),
    };
  }
  return {
    ok: true,
    status,
    invoice: data.invoice as ClubBillingInvoice | undefined,
  };
}

/** Presets d’offres (miroir CF) — pour UI Control Center. */
export const CLUB_BILLING_OFFER_OPTIONS = [
  { id: "club_live_duo", label: "Forfait 2 lives (Veo)" },
  { id: "club_premium", label: "Tout inclus" },
  { id: "club_video_pro", label: "Pro + Veo all-inclusive" },
  { id: "video_veo_pack", label: "Pack Pro + Veo (mensuel indicatif)" },
  { id: "veo_lives_custom", label: "Lives Veo (custom)" },
] as const;
