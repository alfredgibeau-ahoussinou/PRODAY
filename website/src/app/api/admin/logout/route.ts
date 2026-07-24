import { NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  adminSessionCookieOptions,
} from "@/lib/adminSession";
import { isSameOriginBrowserRequest } from "@/lib/requestSecurity";
import { applySecurityHeaders } from "@/lib/securityHeaders";

function jsonResponse(body: Record<string, unknown>, init?: ResponseInit) {
  const response = NextResponse.json(body, init);
  applySecurityHeaders(response);
  response.headers.set("Cache-Control", "no-store");
  return response;
}

/** Déconnexion admin. efface le cookie de session. */
export async function POST(request: Request) {
  if (!isSameOriginBrowserRequest(request)) {
    return jsonResponse({ error: "Origine non autorisée" }, { status: 403 });
  }

  const response = jsonResponse({ ok: true });
  response.cookies.set(ADMIN_SESSION_COOKIE, "", {
    ...adminSessionCookieOptions(0),
    maxAge: 0,
  });
  return response;
}
