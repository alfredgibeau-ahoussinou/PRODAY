import { NextResponse } from "next/server";
import { applySecurityHeaders } from "@/lib/securityHeaders";

/** Soft sink for optional client event queue — visit tracking uses /api/analytics/visit. */
export async function POST() {
  const response = new NextResponse(null, { status: 204 });
  applySecurityHeaders(response);
  return response;
}
