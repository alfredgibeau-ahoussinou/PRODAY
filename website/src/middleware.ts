import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  BETA_ACCESS_REDIRECT_PARAM,
  BETA_ACCESS_REDIRECT_VALUE,
} from "@/lib/betaAccess";

/** Redirige `?token=` vers l'API de session, puis atterrissage sur `/beta/programme`. */
export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  if (pathname === "/beta/inscription") {
    return NextResponse.next();
  }

  if (searchParams.get(BETA_ACCESS_REDIRECT_PARAM) === BETA_ACCESS_REDIRECT_VALUE) {
    const url = request.nextUrl.clone();
    url.searchParams.delete(BETA_ACCESS_REDIRECT_PARAM);
    return NextResponse.redirect(url);
  }

  const token = searchParams.get("token")?.trim();
  if (token && pathname.startsWith("/beta")) {
    const url = request.nextUrl.clone();
    url.pathname = "/api/beta/access";
    url.searchParams.set("token", token);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/beta/:path*"],
};
