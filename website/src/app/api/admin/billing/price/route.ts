import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import {
  assertAdminBillingAccess,
  jsonBilling,
  jsonBillingError,
} from "@/lib/adminBillingAuth";
import {
  getClubBillingPrice,
  listClubBillingPrices,
  upsertClubBillingPrice,
} from "@/lib/adminClubBillingApi";

/**
 * GET  ?clubId=&offerId=  → un prix
 * GET  ?clubId=           → liste prix du club
 * POST { clubId, offerId, amountEur|amountCents, label?, livesCount?, notes? }
 */
export async function GET(request: Request) {
  const denied = await assertAdminBillingAccess(request);
  if (denied) return denied;

  const rate = await checkRateLimit(
    `admin-billing-price-get:${getClientIp(request)}`,
    60,
    60_000,
  );
  if (!rate.allowed) {
    return jsonBillingError("Trop de requêtes. Réessayez plus tard.", 429);
  }

  const url = new URL(request.url);
  const clubId = String(url.searchParams.get("clubId") ?? "").trim();
  const offerId = String(url.searchParams.get("offerId") ?? "").trim();
  if (!clubId) {
    return jsonBillingError("clubId requis", 400);
  }

  if (offerId) {
    const result = await getClubBillingPrice(clubId, offerId);
    if (!result.ok) {
      return jsonBillingError(result.error ?? "Erreur", result.status || 502);
    }
    return jsonBilling({ ok: true, price: result.price });
  }

  const listed = await listClubBillingPrices(clubId);
  if (!listed.ok) {
    return jsonBillingError(listed.error ?? "Erreur", listed.status || 502);
  }
  return jsonBilling({ ok: true, prices: listed.prices });
}

export async function POST(request: Request) {
  const denied = await assertAdminBillingAccess(request);
  if (denied) return denied;

  const rate = await checkRateLimit(
    `admin-billing-price-post:${getClientIp(request)}`,
    30,
    60_000,
  );
  if (!rate.allowed) {
    return jsonBillingError("Trop de requêtes. Réessayez plus tard.", 429);
  }

  let body: {
    clubId?: string;
    offerId?: string;
    amountEur?: number;
    amountCents?: number;
    label?: string;
    livesCount?: number | null;
    notes?: string | null;
    currency?: string;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return jsonBillingError("Corps JSON invalide", 400);
  }

  const clubId = String(body.clubId ?? "").trim();
  const offerId = String(body.offerId ?? "").trim();
  if (!clubId || !offerId) {
    return jsonBillingError("clubId et offerId requis", 400);
  }

  const result = await upsertClubBillingPrice({
    clubId,
    offerId,
    amountEur: body.amountEur,
    amountCents: body.amountCents,
    label: body.label,
    livesCount: body.livesCount,
    notes: body.notes,
    currency: body.currency,
  });
  if (!result.ok) {
    return jsonBillingError(result.error ?? "Erreur", result.status || 502);
  }
  return jsonBilling({ ok: true, price: result.price });
}
