import { NextResponse } from "next/server";
import { fetchBetaWaitlistAdmin } from "@/lib/adminBetaApi";
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

/** Liste waitlist bêta — session admin requise. */
export async function GET(request: Request) {
  if (!isSameOriginBrowserRequest(request)) {
    return jsonResponse({ error: "Origine non autorisée" }, { status: 403 });
  }

  if (!(await getAdminSessionFromCookies())) {
    return jsonResponse({ error: "Session requise" }, { status: 401 });
  }

  const rate = checkRateLimit(
    `admin-beta-list:${getClientIp(request)}`,
    60,
    60_000,
  );
  if (!rate.allowed) {
    return jsonResponse(
      { error: "Trop de requêtes. Réessayez plus tard." },
      { status: 429 },
    );
  }

  const result = await fetchBetaWaitlistAdmin();
  if (!result.ok) {
    return jsonResponse(
      { error: result.error ?? "Erreur" },
      { status: result.status || 502 },
    );
  }

  return jsonResponse({
    ok: true,
    entries: result.entries,
    counts: result.counts,
  });
}
