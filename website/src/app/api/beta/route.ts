import { NextResponse } from "next/server";
import { isBetaRoleId } from "@/lib/betaWelcomeEmail";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type BetaPayload = { email?: string; role?: string };

const RATE_LIMIT = 10;
const RATE_WINDOW_MS = 60_000;

/** Proxy vers la Cloud Function `submitBetaWaitlist` (inscription en attente de validation admin). */
export async function POST(request: Request) {
  const rate = checkRateLimit(
    `beta-waitlist:${getClientIp(request)}`,
    RATE_LIMIT,
    RATE_WINDOW_MS,
  );
  if (!rate.allowed) {
    return NextResponse.json(
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
    return NextResponse.json({ error: "Corps JSON invalide" }, { status: 400 });
  }

  const email = String(body.email ?? "")
    .trim()
    .toLowerCase();
  const role = String(body.role ?? "player").trim();

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Email invalide" }, { status: 400 });
  }
  if (!isBetaRoleId(role)) {
    return NextResponse.json({ error: "Rôle invalide" }, { status: 400 });
  }

  const functionUrl = process.env.BETA_WAITLIST_FUNCTION_URL?.trim();
  if (!functionUrl) {
    return NextResponse.json(
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
    body: JSON.stringify({ email, role }),
  });
  const data = (await upstream.json().catch(() => ({}))) as Record<
    string,
    unknown
  >;
  return NextResponse.json(data, { status: upstream.status });
}
