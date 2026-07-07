import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/** Redirige `?token=` vers l'API de session avant le rendu des pages protégées. */
export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  if (pathname === "/beta/inscription") {
    return NextResponse.next();
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
