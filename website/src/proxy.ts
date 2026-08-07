import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  BETA_ACCESS_REDIRECT_PARAM,
  BETA_ACCESS_REDIRECT_VALUE,
} from "@/lib/betaAccess";
import {
  ADMIN_HOME_PATH,
  ADMIN_LOGIN_PATH,
  ADMIN_SESSION_COOKIE,
  hasAdminSessionCookieValue,
} from "@/lib/adminSessionConstants";
import {
  applySecurityHeaders,
  NO_REFERRER_HEADER,
} from "@/lib/securityHeaders";

function withSecurityHeaders(response: NextResponse): NextResponse {
  applySecurityHeaders(response);
  return response;
}

function hasAdminCookie(request: NextRequest): boolean {
  return hasAdminSessionCookieValue(
    request.cookies.get(ADMIN_SESSION_COOKIE)?.value,
  );
}

/** Protège /admin/* (minicode) et gère les jetons bêta /beta. */
export function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  if (pathname.startsWith("/admin")) {
    const isLogin = pathname === ADMIN_LOGIN_PATH;
    const authed = hasAdminCookie(request);

    if (isLogin && authed) {
      const url = request.nextUrl.clone();
      url.pathname = ADMIN_HOME_PATH;
      url.search = "";
      return withSecurityHeaders(NextResponse.redirect(url));
    }

    if (!isLogin && !authed) {
      const url = request.nextUrl.clone();
      url.pathname = ADMIN_LOGIN_PATH;
      url.search = "";
      return withSecurityHeaders(NextResponse.redirect(url));
    }

    return withSecurityHeaders(NextResponse.next());
  }

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
  matcher: ["/beta/:path*", "/admin", "/admin/:path*"],
};
