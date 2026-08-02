import { NextResponse } from "next/server";
import {
  broadcastIosPreAnnouncementAdmin,
  sendEngagementRoundAdmin,
  triggerIosLaunchAdmin,
} from "@/lib/adminBetaApi";
import { getAdminSessionFromCookies } from "@/lib/adminSession";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { isSameOriginBrowserRequest } from "@/lib/requestSecurity";
import { applySecurityHeaders } from "@/lib/securityHeaders";

type CampaignAction =
  | "broadcast_ios_pre_announcement"
  | "trigger_ios_launch"
  | "send_engagement_round";

function jsonResponse(body: Record<string, unknown>, init?: ResponseInit) {
  const response = NextResponse.json(body, init);
  applySecurityHeaders(response);
  response.headers.set("Cache-Control", "no-store");
  return response;
}

/** Actions campagne bêta iOS — session admin requise. */
export async function POST(request: Request) {
  if (!isSameOriginBrowserRequest(request)) {
    return jsonResponse({ error: "Origine non autorisée" }, { status: 403 });
  }

  if (!(await getAdminSessionFromCookies())) {
    return jsonResponse({ error: "Session requise" }, { status: 401 });
  }

  const rate = checkRateLimit(
    `admin-beta-campaign:${getClientIp(request)}`,
    10,
    60_000,
  );
  if (!rate.allowed) {
    return jsonResponse(
      { error: "Trop de requêtes. Réessayez plus tard." },
      { status: 429 },
    );
  }

  let body: { action?: CampaignAction; round?: number };
  try {
    body = (await request.json()) as { action?: CampaignAction; round?: number };
  } catch {
    return jsonResponse({ error: "Corps JSON invalide" }, { status: 400 });
  }

  const action = body.action;
  if (
    action !== "broadcast_ios_pre_announcement" &&
    action !== "trigger_ios_launch" &&
    action !== "send_engagement_round"
  ) {
    return jsonResponse({ error: "action invalide" }, { status: 400 });
  }

  let result;
  if (action === "broadcast_ios_pre_announcement") {
    result = await broadcastIosPreAnnouncementAdmin();
  } else if (action === "trigger_ios_launch") {
    result = await triggerIosLaunchAdmin();
  } else {
    result = await sendEngagementRoundAdmin(
      typeof body.round === "number" ? body.round : undefined,
    );
  }

  if (!result.ok) {
    return jsonResponse(
      { error: result.error ?? "Action impossible" },
      { status: result.status || 502 },
    );
  }

  return jsonResponse({ ok: true, ...result });
}
