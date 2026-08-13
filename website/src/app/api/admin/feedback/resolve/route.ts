import { NextResponse } from "next/server";
import { resolveBetaFeedbackAdmin } from "@/lib/adminBetaApi";
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

export async function POST(request: Request) {
  if (!isSameOriginBrowserRequest(request)) {
    return jsonResponse({ error: "Origine non autorisée" }, { status: 403 });
  }
  if (!(await getAdminSessionFromCookies())) {
    return jsonResponse({ error: "Session requise" }, { status: 401 });
  }

  const rate = await checkRateLimit(
    `admin-feedback-resolve:${getClientIp(request)}`,
    40,
    60_000,
  );
  if (!rate.allowed) {
    return jsonResponse({ error: "Trop de requêtes" }, { status: 429 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    feedbackId?: string;
  };
  const feedbackId = String(body.feedbackId ?? "").trim();
  if (!feedbackId) {
    return jsonResponse({ error: "feedbackId requis" }, { status: 400 });
  }

  const result = await resolveBetaFeedbackAdmin(feedbackId);
  if (!result.ok) {
    return jsonResponse(
      { error: result.error ?? "Résolution impossible" },
      { status: result.status || 502 },
    );
  }
  return jsonResponse({ ok: true });
}
