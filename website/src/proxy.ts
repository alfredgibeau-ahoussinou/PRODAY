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
} from "@/lib/adminSessionConstants";
import { hasValidAdminSessionCookie } from "@/lib/adminSessionEdge";
import {
  applySecurityHeaders,
  NO_REFERRER_HEADER,
} from "@/lib/securityHeaders";

function withSecurityHeaders(
  response: NextResponse,
  opts?: { noStore?: boolean; noIndex?: boolean },
): NextResponse {
  applySecurityHeaders(response);
  if (opts?.noStore) {
    response.headers.set("Cache-Control", "no-store, max-age=0");
    response.headers.set("Pragma", "no-cache");
  }
  if (opts?.noIndex) {
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
  }
  return response;
}

/** Protège /admin/* (session HMAC) et gère les jetons bêta /beta. */
export async function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  if (pathname.startsWith("/admin")) {
    const isLogin = pathname === ADMIN_LOGIN_PATH;
    const authed = await hasValidAdminSessionCookie(
      request.cookies.get(ADMIN_SESSION_COOKIE)?.value,
    );

    if (isLogin && authed) {
      const url = request.nextUrl.clone();
      url.pathname = ADMIN_HOME_PATH;
      url.search = "";
      return withSecurityHeaders(NextResponse.redirect(url), {
        noStore: true,
        noIndex: true,
      });
    }

    if (!isLogin && !authed) {
      const url = request.nextUrl.clone();
      url.pathname = ADMIN_LOGIN_PATH;
      url.search = "";
      return withSecurityHeaders(NextResponse.redirect(url), {
        noStore: true,
        noIndex: true,
      });
    }

    return withSecurityHeaders(NextResponse.next(), {
      noStore: true,
      noIndex: true,
    });
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
