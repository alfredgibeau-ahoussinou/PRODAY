import { NextResponse } from "next/server";
import { getAdminSessionFromCookies } from "@/lib/adminSession";
import {
  isProdayMobileClientRequest,
  isSameOriginBrowserRequest,
} from "@/lib/requestSecurity";
import { applySecurityHeaders } from "@/lib/securityHeaders";

/** Session PIN web OU clé mobile app (x-proday-mobile-key). */
export async function assertAdminBillingAccess(
  request: Request,
): Promise<Response | null> {
  const isMobile = isProdayMobileClientRequest(request);
  if (!isMobile && !isSameOriginBrowserRequest(request)) {
    return jsonBillingError("Origine non autorisée", 403);
  }

  if (isMobile) return null;

  if (!(await getAdminSessionFromCookies())) {
    return jsonBillingError("Session requise", 401);
  }
  return null;
}

export function jsonBilling(
  body: Record<string, unknown>,
  init?: ResponseInit,
): NextResponse {
  const response = NextResponse.json(body, init);
  applySecurityHeaders(response);
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export function jsonBillingError(error: string, status: number): NextResponse {
  return jsonBilling({ error }, { status });
}
