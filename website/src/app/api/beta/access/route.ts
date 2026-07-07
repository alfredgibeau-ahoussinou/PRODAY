import { NextResponse } from "next/server";
import {
  BETA_ACCESS_COOKIE,
  BETA_ACCESS_COOKIE_MAX_AGE,
  validateBetaAccessToken,
} from "@/lib/betaAccess";

/** Valide un jeton bêta et pose le cookie de session (httpOnly). */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token")?.trim();

  if (!token) {
    return NextResponse.json({ error: "Token requis" }, { status: 400 });
  }

  const session = await validateBetaAccessToken(token);
  if (!session) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const response = NextResponse.json({ ok: true, ...session });
  response.cookies.set(BETA_ACCESS_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: BETA_ACCESS_COOKIE_MAX_AGE,
    path: "/beta",
  });
  return response;
}
