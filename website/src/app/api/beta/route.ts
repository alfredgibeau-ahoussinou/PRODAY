import { NextResponse } from "next/server";
import { isBetaRoleId } from "@/lib/betaWelcomeEmail";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import {
  isSameOriginBrowserRequest,
  MAX_BETA_EMAIL_LENGTH,
} from "@/lib/requestSecurity";
import { applySecurityHeaders } from "@/lib/securityHeaders";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const WAITLIST_RESPONSE_KEYS = ["ok", "status", "message", "error"] as const;

type BetaPayload = { email?: string; role?: string; referral_code?: string };

const RATE_LIMIT = 10;
const RATE_WINDOW_MS = 60_000;

function jsonResponse(body: Record<string, unknown>, init?: ResponseInit) {
  const response = NextResponse.json(body, init);
  applySecurityHeaders(response);
  response.headers.set("Cache-Control", "no-store");
  return response;
}

/** Proxy vers la Cloud Function `submitBetaWaitlist` (inscription en attente de validation admin). */
export async function POST(request: Request) {
  if (!isSameOriginBrowserRequest(request)) {
    return jsonResponse({ error: "Origine non autorisée" }, { status: 403 });
  }

  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return jsonResponse(
      { error: "Content-Type application/json requis" },
      { status: 415 },
    );
  }

  const rate = await checkRateLimit(
    `beta-waitlist:${getClientIp(request)}`,
    RATE_LIMIT,
    RATE_WINDOW_MS,
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

  let body: BetaPayload;
  try {
    body = (await request.json()) as BetaPayload;
  } catch {
    return jsonResponse({ error: "Corps JSON invalide" }, { status: 400 });
  }

  const email = String(body.email ?? "")
    .trim()
    .toLowerCase()
    .slice(0, MAX_BETA_EMAIL_LENGTH);
  const role = String(body.role ?? "player").trim().slice(0, 32);
  const referralCode = String(body.referral_code ?? "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 12);

  if (!EMAIL_RE.test(email)) {
    return jsonResponse({ error: "Email invalide" }, { status: 400 });
  }
  if (!isBetaRoleId(role)) {
    return jsonResponse({ error: "Rôle invalide" }, { status: 400 });
  }

  const functionUrl = process.env.BETA_WAITLIST_FUNCTION_URL?.trim();
  if (!functionUrl) {
    return jsonResponse(
      {
        error:
          "Service bêta non configuré. Définissez BETA_WAITLIST_FUNCTION_URL.",
      },
      { status: 503 },
    );
  }

  const upstream = await fetch(functionUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email,
      role,
      ...(referralCode.length >= 6 ? { referral_code: referralCode } : {}),
    }),
  });
  const data = (await upstream.json().catch(() => ({}))) as Record<
    string,
    unknown
  >;
  const safe: Record<string, unknown> = {};
  for (const key of WAITLIST_RESPONSE_KEYS) {
    if (key in data) safe[key] = data[key];
  }
  return jsonResponse(safe, { status: upstream.status });
}
