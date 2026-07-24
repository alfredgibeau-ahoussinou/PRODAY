import { NextResponse } from "next/server";
import {
  ADMIN_HOME_PATH,
  ADMIN_SESSION_COOKIE,
  ADMIN_SESSION_MAX_AGE,
  adminSessionCookieOptions,
  createAdminSessionToken,
  isAdminPinConfigured,
  verifyAdminPin,
} from "@/lib/adminSession";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { isSameOriginBrowserRequest } from "@/lib/requestSecurity";
import { applySecurityHeaders } from "@/lib/securityHeaders";

const PIN_RATE_LIMIT = 5;
const PIN_RATE_WINDOW_MS = 15 * 60_000;

function jsonResponse(body: Record<string, unknown>, init?: ResponseInit) {
  const response = NextResponse.json(body, init);
  applySecurityHeaders(response);
  response.headers.set("Cache-Control", "no-store");
  return response;
}

/** Connexion admin fondateurs. minicode (PIN) → cookie httpOnly 7 jours. */
export async function POST(request: Request) {
  if (!isSameOriginBrowserRequest(request)) {
    return jsonResponse({ error: "Origine non autorisée" }, { status: 403 });
  }

  if (!isAdminPinConfigured()) {
    return jsonResponse(
      {
        error:
          "Minicode non configuré. Définissez BETA_ADMIN_PIN (ou ADMIN_MINICODE).",
      },
      { status: 503 },
    );
  }

  const rate = checkRateLimit(
    `admin-pin:${getClientIp(request)}`,
    PIN_RATE_LIMIT,
    PIN_RATE_WINDOW_MS,
  );
  if (!rate.allowed) {
    return jsonResponse(
      { error: "Trop de tentatives. Réessayez dans quelques minutes." },
      {
        status: 429,
        headers: rate.retryAfterSec
          ? { "Retry-After": String(rate.retryAfterSec) }
          : undefined,
      },
    );
  }

  let body: { pin?: string };
  try {
    body = (await request.json()) as { pin?: string };
  } catch {
    return jsonResponse({ error: "Corps JSON invalide" }, { status: 400 });
  }

  const pin = String(body.pin ?? "").trim();
  if (!pin || pin.length > 32) {
    return jsonResponse({ error: "Minicode invalide" }, { status: 400 });
  }

  if (!verifyAdminPin(pin)) {
    return jsonResponse({ error: "Minicode incorrect" }, { status: 401 });
  }

  const token = createAdminSessionToken();
  if (!token) {
    return jsonResponse(
      {
        error:
          "Secret de session manquant. Définissez BETA_ADMIN_SESSION_SECRET (≥ 16 car.).",
      },
      { status: 503 },
    );
  }

  const response = jsonResponse({ ok: true, redirect: ADMIN_HOME_PATH });
  response.cookies.set(
    ADMIN_SESSION_COOKIE,
    token,
    adminSessionCookieOptions(ADMIN_SESSION_MAX_AGE),
  );
  return response;
}
