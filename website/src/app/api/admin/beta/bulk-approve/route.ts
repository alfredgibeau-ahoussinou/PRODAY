import { NextResponse } from "next/server";
import { bulkApproveBetaWaitlistAdmin } from "@/lib/adminBetaApi";
import { getAdminSessionFromCookies } from "@/lib/adminSession";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { isSameOriginBrowserRequest } from "@/lib/requestSecurity";
import { applySecurityHeaders } from "@/lib/securityHeaders";

function jsonResponse(body: Record<string, unknown>, init?: ResponseInit) {
  const response = NextResponse.json(body, init);
  applySecurityHeaders(response);
  response.headers.set("Cache-Control", "no-store");
  return response;
}

/** Approuve plusieurs inscriptions bêta. session admin requise. */
export async function POST(request: Request) {
  if (!isSameOriginBrowserRequest(request)) {
    return jsonResponse({ error: "Origine non autorisée" }, { status: 403 });
  }

  if (!(await getAdminSessionFromCookies())) {
    return jsonResponse({ error: "Session requise" }, { status: 401 });
  }

  const rate = await checkRateLimit(
    `admin-beta-bulk-approve:${getClientIp(request)}`,
    10,
    60_000,
  );
  if (!rate.allowed) {
    return jsonResponse(
      { error: "Trop de requêtes. Réessayez plus tard." },
      { status: 429 },
    );
  }

  let body: { ids?: string[]; admin_note?: string; adminNote?: string };
  try {
    body = (await request.json()) as {
      ids?: string[];
      admin_note?: string;
      adminNote?: string;
    };
  } catch {
    return jsonResponse({ error: "Corps JSON invalide" }, { status: 400 });
  }

  const ids = Array.isArray(body.ids)
    ? body.ids.map((id) => String(id ?? "").trim()).filter(Boolean)
    : [];
  if (ids.length === 0) {
    return jsonResponse({ error: "ids requis" }, { status: 400 });
  }

  const note = String(body.admin_note ?? body.adminNote ?? "").trim();
  const result = await bulkApproveBetaWaitlistAdmin(ids, note || undefined);
  if (!result.ok) {
    return jsonResponse(
      { error: result.error ?? "Approbation groupée impossible" },
      { status: result.status || 502 },
    );
  }

  return jsonResponse({
    ok: true,
    approved: result.approved,
    failed: result.failed,
    results: result.results,
  });
}
