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

/** Liste waitlist bêta paginée. session admin requise. */
export async function GET(request: Request) {
  const site = request.headers.get("sec-fetch-site");
  const sameSiteFetch =
    site === "same-origin" || site === "same-site" || site === "none";
  if (!isSameOriginBrowserRequest(request) && !sameSiteFetch) {
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

  const url = new URL(request.url);
  const rawSize = url.searchParams.get("pageSize");
  const cursor = url.searchParams.get("cursor")?.trim() || undefined;
  const pageSize = rawSize ? Number(rawSize) : undefined;

  const result = await fetchBetaWaitlistAdmin({
    ...(Number.isFinite(pageSize) ? { pageSize } : {}),
    ...(cursor ? { cursor } : {}),
  });
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
    truncated: result.truncated === true,
    list_cap: result.listCap,
    page_size: result.pageSize,
    next_cursor: result.nextCursor ?? null,
    has_more: result.hasMore === true,
  });
}
