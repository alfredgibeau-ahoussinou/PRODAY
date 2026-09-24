import { NextResponse } from "next/server";
import { loadOpsStatus } from "@/lib/adminOpsStatus";
import { runEmailHealthCheck, readHistory } from "@/lib/adminOpsStore";
import { getAdminSessionFromCookies } from "@/lib/adminSession";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { isSameOriginBrowserRequest } from "@/lib/requestSecurity";
import { applySecurityHeaders } from "@/lib/securityHeaders";

function jsonResponse(body: Record<string, unknown>, init?: ResponseInit) {
  const response = NextResponse.json(body, init);
  applySecurityHeaders(response);
  response.headers.set("Cache-Control", "no-store");
  return response;
}

/** Statut Ops (santé e-mail + diffusion) — session admin requise. */
export async function GET(request: Request) {
  const site = request.headers.get("sec-fetch-site");
  const sameSiteFetch =
    site === "same-origin" || site === "same-site" || site === "none";
  if (!isSameOriginBrowserRequest(request) && !sameSiteFetch) {
    return jsonResponse({ error: "Origine non autorisée" }, { status: 403 });
  }

  if (!(await getAdminSessionFromCookies())) {
    return jsonResponse({ error: "Session requise" }, { status: 401 });
  }

  const rate = await checkRateLimit(
    `admin-ops-status:${getClientIp(request)}`,
    60,
    60_000,
  );
  if (!rate.allowed) {
    return jsonResponse(
      { error: "Trop de requêtes. Réessayez plus tard." },
      { status: 429 },
    );
  }

  const [report, history] = await Promise.all([loadOpsStatus(), readHistory()]);
  return jsonResponse({ ok: true, report, history });
}

/** Action Ops : envoi d'un email de test réel via le pipeline EmailJS. */
export async function POST(request: Request) {
  if (!isSameOriginBrowserRequest(request)) {
    return jsonResponse({ error: "Origine non autorisée" }, { status: 403 });
  }

  if (!(await getAdminSessionFromCookies())) {
    return jsonResponse({ error: "Session requise" }, { status: 401 });
  }

  const rate = await checkRateLimit(
    `admin-ops-status-action:${getClientIp(request)}`,
    5,
    60_000,
  );
  if (!rate.allowed) {
    return jsonResponse(
      { error: "Trop de requêtes. Réessayez plus tard." },
      { status: 429 },
    );
  }

  let body: { action?: string };
  try {
    body = (await request.json()) as { action?: string };
  } catch {
    return jsonResponse({ error: "Corps JSON invalide" }, { status: 400 });
  }

  if (body.action !== "test_email") {
    return jsonResponse({ error: "action invalide" }, { status: 400 });
  }

  // Vérification réelle (envoi production) + historisation — un seul chemin
  // partagé avec le scheduler quotidien.
  const result = await runEmailHealthCheck("manual");
  if (result.history.error) {
    return jsonResponse(
      {
        error: `Envoi effectué mais historisation impossible : ${result.history.error}`,
        lastTest: { ok: result.ok, at: new Date().toISOString(), hint: result.hint, log: result.log },
      },
      { status: 502 },
    );
  }

  const history = await readHistory();
  const latest = history.entries[0];
  const lastTest = latest
    ? { ok: latest.ok, at: latest.at, hint: latest.hint, log: latest.log }
    : null;

  return jsonResponse({ ok: true, lastTest, history });
}
