import { NextResponse } from "next/server";
import { fetchTrafficStatsAdmin } from "@/lib/adminTrafficApi";
import { getAdminSessionFromCookies } from "@/lib/adminSession";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { applySecurityHeaders } from "@/lib/securityHeaders";

function jsonResponse(body: Record<string, unknown>, init?: ResponseInit) {
  const response = NextResponse.json(body, init);
  applySecurityHeaders(response);
  response.headers.set("Cache-Control", "no-store");
  return response;
}

/** Stats trafic : réservé à la session admin fondateurs. */
export async function GET(request: Request) {
  if (!(await getAdminSessionFromCookies())) {
    return jsonResponse({ error: "Non autorisé" }, { status: 401 });
  }

  const rate = await checkRateLimit(
    `admin-traffic:${getClientIp(request)}`,
    30,
    60_000,
  );
  if (!rate.allowed) {
    return jsonResponse({ error: "Trop de requêtes" }, { status: 429 });
  }

  const result = await fetchTrafficStatsAdmin();
  if (!result.ok) {
    return jsonResponse(
      { error: result.error ?? "Lecture impossible", ...result.data },
      { status: result.status },
    );
  }

  return jsonResponse({ ok: true, ...result.data });
}
