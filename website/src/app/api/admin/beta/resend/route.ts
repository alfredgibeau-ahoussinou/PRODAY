import { NextResponse } from "next/server";
import { resendBetaWaitlistAdmin } from "@/lib/adminBetaApi";
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

/** Renvoie l'email de bienvenue bêta — session admin requise. */
export async function POST(request: Request) {
  if (!isSameOriginBrowserRequest(request)) {
    return jsonResponse({ error: "Origine non autorisée" }, { status: 403 });
  }

  if (!(await getAdminSessionFromCookies())) {
    return jsonResponse({ error: "Session requise" }, { status: 401 });
  }

  const rate = checkRateLimit(
    `admin-beta-resend:${getClientIp(request)}`,
    20,
    60_000,
  );
  if (!rate.allowed) {
    return jsonResponse(
      { error: "Trop de requêtes. Réessayez plus tard." },
      { status: 429 },
    );
  }

  let body: { id?: string };
  try {
    body = (await request.json()) as { id?: string };
  } catch {
    return jsonResponse({ error: "Corps JSON invalide" }, { status: 400 });
  }

  const id = String(body.id ?? "").trim();
  if (!id) {
    return jsonResponse({ error: "id requis" }, { status: 400 });
  }

  const result = await resendBetaWaitlistAdmin(id);
  if (!result.ok) {
    return jsonResponse(
      { error: result.error ?? "Renvoi impossible" },
      { status: result.status || 502 },
    );
  }

  return jsonResponse({
    ok: true,
    emailSent: result.emailSent,
    emailError: result.emailError,
  });
}
