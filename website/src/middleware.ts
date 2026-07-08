import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  BETA_ACCESS_REDIRECT_PARAM,
  BETA_ACCESS_REDIRECT_VALUE,
} from "@/lib/betaAccess";
import {
  applySecurityHeaders,
  NO_REFERRER_HEADER,
} from "@/lib/securityHeaders";

function withSecurityHeaders(response: NextResponse): NextResponse {
  applySecurityHeaders(response);
  return response;
}

/** Redirige `?token=` vers l'API de session, puis atterrissage sur `/beta/programme`. */
export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  if (pathname === "/beta/inscription") {
    return withSecurityHeaders(NextResponse.next());
  }

  if (searchParams.get(BETA_ACCESS_REDIRECT_PARAM) === BETA_ACCESS_REDIRECT_VALUE) {
    const url = request.nextUrl.clone();
    url.searchParams.delete(BETA_ACCESS_REDIRECT_PARAM);
    return withSecurityHeaders(NextResponse.redirect(url));
  }

  const token = searchParams.get("token")?.trim();
  if (token && pathname.startsWith("/beta")) {
    const url = request.nextUrl.clone();
    url.pathname = "/api/beta/access";
    url.searchParams.set("token", token);
    const response = NextResponse.redirect(url);
    response.headers.set("Referrer-Policy", NO_REFERRER_HEADER);
    return withSecurityHeaders(response);
  }

  return withSecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: ["/beta/:path*"],
};
