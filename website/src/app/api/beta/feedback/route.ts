import { NextResponse } from "next/server";
import { submitBetaFeedbackAdmin } from "@/lib/adminBetaApi";
import { getBetaSession } from "@/lib/getBetaSession";
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

  const session = await getBetaSession();
  if (!session) {
    return jsonResponse({ error: "Session bêta requise" }, { status: 401 });
  }

  const rate = await checkRateLimit(
    `beta-feedback:${getClientIp(request)}:${session.email}`,
    8,
    60 * 60_000,
  );
  if (!rate.allowed) {
    return jsonResponse(
      { error: "Trop de retours. Réessaie plus tard." },
      { status: 429 },
    );
  }

  const body = (await request.json().catch(() => ({}))) as {
    category?: string;
    message?: string;
  };
  const message = String(body.message ?? "").trim();
  if (message.length < 8) {
    return jsonResponse(
      { error: "Message trop court (8 caractères min.)" },
      { status: 400 },
    );
  }

  const result = await submitBetaFeedbackAdmin({
    email: session.email,
    role_label: session.roleLabel,
    category: String(body.category ?? "other"),
    message,
  });

  if (!result.ok) {
    return jsonResponse(
      { error: result.error ?? "Envoi impossible" },
      { status: result.status || 502 },
    );
  }

  return jsonResponse({ ok: true, id: result.id });
}
