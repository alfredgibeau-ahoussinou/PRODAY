import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import {
  assertAdminBillingAccess,
  jsonBilling,
  jsonBillingError,
} from "@/lib/adminBillingAuth";
import {
  createClubStripeInvoice,
  getClubStripeInvoice,
  listClubStripeInvoices,
  refreshClubStripeInvoice,
} from "@/lib/adminClubBillingApi";

/**
 * GET ?invoiceId= | ?stripeInvoiceId= | ?clubId= (liste)
 * POST create invoice { clubId, offerId, customerEmail, amountEur?, … }
 * POST refresh { refresh: true, invoiceId? | stripeInvoiceId? }
 */
export async function GET(request: Request) {
  const denied = await assertAdminBillingAccess(request);
  if (denied) return denied;

  const rate = await checkRateLimit(
    `admin-billing-invoice-get:${getClientIp(request)}`,
    60,
    60_000,
  );
  if (!rate.allowed) {
    return jsonBillingError("Trop de requêtes. Réessayez plus tard.", 429);
  }

  const url = new URL(request.url);
  const invoiceId = String(url.searchParams.get("invoiceId") ?? "").trim();
  const stripeInvoiceId = String(
    url.searchParams.get("stripeInvoiceId") ?? "",
  ).trim();
  const clubId = String(url.searchParams.get("clubId") ?? "").trim();

  if (invoiceId || stripeInvoiceId) {
    const result = await getClubStripeInvoice({ invoiceId, stripeInvoiceId });
    if (!result.ok) {
      return jsonBillingError(result.error ?? "Erreur", result.status || 502);
    }
    return jsonBilling({ ok: true, invoice: result.invoice });
  }

  const listed = await listClubStripeInvoices(clubId || undefined);
  if (!listed.ok) {
    return jsonBillingError(listed.error ?? "Erreur", listed.status || 502);
  }
  return jsonBilling({ ok: true, invoices: listed.invoices });
}

export async function POST(request: Request) {
  const denied = await assertAdminBillingAccess(request);
  if (denied) return denied;

  const rate = await checkRateLimit(
    `admin-billing-invoice-post:${getClientIp(request)}`,
    20,
    60_000,
  );
  if (!rate.allowed) {
    return jsonBillingError("Trop de requêtes. Réessayez plus tard.", 429);
  }

  let body: {
    refresh?: boolean;
    invoiceId?: string;
    stripeInvoiceId?: string;
    clubId?: string;
    offerId?: string;
    customerEmail?: string;
    clubName?: string;
    amountEur?: number;
    amountCents?: number;
    label?: string;
    livesCount?: number | null;
    daysUntilDue?: number;
    sendInvoice?: boolean;
    description?: string;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return jsonBillingError("Corps JSON invalide", 400);
  }

  if (body.refresh === true) {
    const result = await refreshClubStripeInvoice({
      invoiceId: body.invoiceId,
      stripeInvoiceId: body.stripeInvoiceId,
    });
    if (!result.ok) {
      return jsonBillingError(result.error ?? "Erreur", result.status || 502);
    }
    return jsonBilling({ ok: true, invoice: result.invoice });
  }

  const clubId = String(body.clubId ?? "").trim();
  const offerId = String(body.offerId ?? "").trim();
  const customerEmail = String(body.customerEmail ?? "").trim();
  if (!clubId || !offerId || !customerEmail) {
    return jsonBillingError(
      "clubId, offerId et customerEmail requis",
      400,
    );
  }

  const result = await createClubStripeInvoice({
    clubId,
    offerId,
    customerEmail,
    clubName: body.clubName,
    amountEur: body.amountEur,
    amountCents: body.amountCents,
    label: body.label,
    livesCount: body.livesCount,
    daysUntilDue: body.daysUntilDue,
    sendInvoice: body.sendInvoice,
    description: body.description,
  });
  if (!result.ok) {
    return jsonBillingError(result.error ?? "Erreur", result.status || 502);
  }
  return jsonBilling({ ok: true, invoice: result.invoice });
}
