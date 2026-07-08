import { NextResponse } from "next/server";
import {
  BETA_ACCESS_COOKIE,
  BETA_ACCESS_COOKIE_MAX_AGE,
  BETA_LANDING_PATH,
  buildBetaInternalRedirectUrl,
  validateBetaAccessToken,
} from "@/lib/betaAccess";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

const RATE_LIMIT = 30;
const RATE_WINDOW_MS = 60_000;

function setBetaSessionCookie(response: NextResponse, token: string) {
  response.cookies.set(BETA_ACCESS_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: BETA_ACCESS_COOKIE_MAX_AGE,
    path: "/beta",
  });
}

/** Valide un jeton bêta, pose le cookie httpOnly et redirige vers le programme. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token")?.trim();
  const jsonOnly = url.searchParams.get("format") === "json";

  const rate = checkRateLimit(
    `beta-access:${getClientIp(request)}`,
    RATE_LIMIT,
    RATE_WINDOW_MS,
  );
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Trop de tentatives. Réessayez plus tard." },
      {
        status: 429,
        headers: rate.retryAfterSec
          ? { "Retry-After": String(rate.retryAfterSec) }
          : undefined,
      },
    );
  }

  if (!token) {
    return NextResponse.json({ error: "Token requis" }, { status: 400 });
  }

  const session = await validateBetaAccessToken(token);
  if (!session) {
    if (jsonOnly) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }
    return NextResponse.redirect(buildBetaInternalRedirectUrl(request, "/beta"));
  }

  const response = jsonOnly
    ? NextResponse.json({ ok: true, ...session })
    : NextResponse.redirect(buildBetaInternalRedirectUrl(request, BETA_LANDING_PATH));

  setBetaSessionCookie(response, token);
  return response;
}
