import { NextResponse } from "next/server";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { applySecurityHeaders } from "@/lib/securityHeaders";

const DEFAULT_FUNCTION_URL =
  "https://europe-west1-proday-155b0.cloudfunctions.net/recordTrafficVisit";

const RATE_LIMIT = 30;
const RATE_WINDOW_MS = 60_000;

function jsonResponse(body: Record<string, unknown>, init?: ResponseInit) {
  const response = NextResponse.json(body, init);
  applySecurityHeaders(response);
  response.headers.set("Cache-Control", "no-store");
  return response;
}

/** Proxy léger → Cloud Function recordTrafficVisit (pageview session). */
export async function POST(request: Request) {
  const rate = checkRateLimit(
    `traffic-visit:${getClientIp(request)}`,
    RATE_LIMIT,
    RATE_WINDOW_MS,
  );
  if (!rate.allowed) {
    return jsonResponse(
      { error: "Trop de requêtes" },
      {
        status: 429,
        headers: rate.retryAfterSec
          ? { "Retry-After": String(rate.retryAfterSec) }
          : undefined,
      },
    );
  }

  let body: { source?: string };
  try {
    body = (await request.json()) as { source?: string };
  } catch {
    return jsonResponse({ error: "Corps JSON invalide" }, { status: 400 });
  }

  if (body.source !== "site") {
    return jsonResponse({ error: "source invalide" }, { status: 400 });
  }

  const functionUrl =
    process.env.TRAFFIC_VISIT_FUNCTION_URL?.trim() || DEFAULT_FUNCTION_URL;

  try {
    const upstream = await fetch(functionUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ source: "site" }),
      cache: "no-store",
    });
    const data = (await upstream.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;
    if (!upstream.ok) {
      return jsonResponse(
        { error: typeof data.error === "string" ? data.error : "Échec" },
        { status: upstream.status >= 400 ? upstream.status : 502 },
      );
    }
    return jsonResponse({ ok: true });
  } catch {
    return jsonResponse({ error: "Service indisponible" }, { status: 502 });
  }
}
