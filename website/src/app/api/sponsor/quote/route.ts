import { NextResponse } from "next/server";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import {
  isProdayMobileClientRequest,
  isSameOriginBrowserRequest,
} from "@/lib/requestSecurity";
import { applySecurityHeaders } from "@/lib/securityHeaders";

const RATE_LIMIT = 8;
const RATE_WINDOW_MS = 60_000;

function jsonResponse(body: Record<string, unknown>, init?: ResponseInit) {
  const response = NextResponse.json(body, init);
  applySecurityHeaders(response);
  response.headers.set("Cache-Control", "no-store");
  return response;
}

async function submitQuoteToFunction(
  payload: Record<string, unknown>,
): Promise<{ ok: boolean; status?: number; error?: string; requestId?: string }> {
  const functionUrl = process.env.SPONSOR_QUOTE_FUNCTION_URL?.trim();
  if (!functionUrl) {
    return { ok: false, error: "Service devis non configuré" };
  }

  const upstream = await fetch(functionUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = (await upstream.json().catch(() => ({}))) as {
    error?: string;
    requestId?: string;
  };

  if (!upstream.ok) {
    return { ok: false, status: upstream.status, error: data.error ?? "Enregistrement impossible" };
  }

  return { ok: true, requestId: data.requestId };
}

export async function POST(request: Request) {
  if (!isSameOriginBrowserRequest(request) && !isProdayMobileClientRequest(request)) {
    return jsonResponse({ error: "Origine non autorisée" }, { status: 403 });
  }

  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return jsonResponse({ error: "Content-Type application/json requis" }, { status: 415 });
  }

  const rate = checkRateLimit(
    `sponsor-quote:${getClientIp(request)}`,
    RATE_LIMIT,
    RATE_WINDOW_MS,
  );
  if (!rate.allowed) {
    return jsonResponse(
      { error: "Trop de tentatives. Réessayez dans quelques minutes." },
      {
        status: 429,
        headers: rate.retryAfterSec ? { "Retry-After": String(rate.retryAfterSec) } : undefined,
      },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return jsonResponse({ error: "Corps JSON invalide" }, { status: 400 });
  }

  const quote = await submitQuoteToFunction({ ...body, source: body.source ?? "website" });
  if (!quote.ok) {
    return jsonResponse(
      { error: quote.error ?? "Enregistrement impossible" },
      { status: quote.status ?? 502 },
    );
  }

  return jsonResponse({
    ok: true,
    requestId: quote.requestId,
    message: "Demande de devis enregistrée. Notre équipe vous recontacte sous 48 h ouvrées.",
  });
}
