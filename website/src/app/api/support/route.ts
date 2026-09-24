import { NextResponse } from "next/server";
import { getEmailJsBetaConfig } from "@/lib/betaEmailjs";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import {
  isSameOriginBrowserRequest,
  MAX_BETA_EMAIL_LENGTH,
} from "@/lib/requestSecurity";
import { applySecurityHeaders } from "@/lib/securityHeaders";

/** Types proposés dans SupportModal.tsx — toute autre valeur est rejetée. */
const SUPPORT_TYPES = [
  "Problème de téléchargement",
  "Bug",
  "Idée",
  "Autre",
] as const;

/**
 * Email strict : local part sans point/plus sign en début-fin (≤ 64),
 * labels de domaine valides (≤ 63), au moins un point, TLD ≥ 2 lettres.
 * Plus strict que le simple `[^\s@]+@[^\s@]+\.[^\s@]+` de la waitlist :
 * refuse `a@b`, `a.@b.com`, `.a@b.com`, `a..b@c.com` (doublons vérifiés à part), etc.
 */
const EMAIL_RE =
  /^[a-z0-9](?:[a-z0-9._%+-]{0,62}[a-z0-9])?@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/i;

const MESSAGE_MAX_LENGTH = 2000;
/** Chaque appel déclenche un email réel : 3 messages / 5 min / IP. */
const RATE_LIMIT = 3;
const RATE_WINDOW_MS = 5 * 60_000;
/**
 * Anti-bot : durée minimale entre l'ouverture de la modale et l'envoi.
 * Doit rester ≤ à MIN_FILL_MS de SupportModal.tsx (valeur client), avec marge
 * de tolérance pour les horloges et la latence réseau.
 */
const MIN_FORM_FILL_MS = 2000;

const ADMIN_EMAIL = "proday.admin@gmail.com";

function jsonResponse(body: Record<string, unknown>, init?: ResponseInit) {
  const response = NextResponse.json(body, init);
  applySecurityHeaders(response);
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export async function POST(request: Request) {
  if (!isSameOriginBrowserRequest(request)) {
    return jsonResponse({ error: "Origine non autorisée" }, { status: 403 });
  }

  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return jsonResponse(
      { error: "Content-Type application/json requis" },
      { status: 415 },
    );
  }

  let body: {
    type?: unknown;
    message?: unknown;
    email?: unknown;
    website?: unknown;
    elapsedMs?: unknown;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return jsonResponse({ error: "Corps JSON invalide" }, { status: 400 });
  }

  const type = String(body.type ?? "").trim();
  const message = String(body.message ?? "")
    .trim()
    .slice(0, MESSAGE_MAX_LENGTH);
  const email = String(body.email ?? "")
    .trim()
    .toLowerCase()
    .slice(0, MAX_BETA_EMAIL_LENGTH);

  if (!(SUPPORT_TYPES as readonly string[]).includes(type)) {
    return jsonResponse({ error: "Type de demande invalide" }, { status: 400 });
  }
  if (!email) {
    return jsonResponse({ error: "Email requis" }, { status: 400 });
  }
  if (email.includes("..") || !EMAIL_RE.test(email)) {
    return jsonResponse({ error: "Email invalide" }, { status: 400 });
  }
  if (message.length < 2) {
    return jsonResponse({ error: "Message requis" }, { status: 400 });
  }

  // --- Anti-bot : rejet SILENCIEUX (faux succès) pour ne rien révéler aux robots.
  // Pas d'email envoyé, pas de quota consommé, traçable dans les logs.
  const honeypot = String(body.website ?? "").trim();
  if (honeypot) {
    console.warn(
      `[support] Bot suspecté (honeypot rempli) — IP ${getClientIp(request)}`,
    );
    return jsonResponse({ success: true });
  }
  const elapsedMs = Number(body.elapsedMs);
  if (
    Number.isFinite(elapsedMs) &&
    (elapsedMs < MIN_FORM_FILL_MS || elapsedMs > 24 * 60 * 60_000)
  ) {
    console.warn(
      `[support] Bot suspecté (envoi en ${Math.round(elapsedMs)} ms) — IP ${getClientIp(request)}`,
    );
    return jsonResponse({ success: true });
  }

  // Quota consommé uniquement par les messages valides, au moment de l'envoi
  // réel : une typo d'email ne pénalise pas l'utilisateur honnête.
  const rate = await checkRateLimit(
    `support:${getClientIp(request)}`,
    RATE_LIMIT,
    RATE_WINDOW_MS,
  );
  if (!rate.allowed) {
    return jsonResponse(
      { error: "Trop de messages envoyés. Réessayez dans quelques minutes." },
      {
        status: 429,
        headers: rate.retryAfterSec
          ? { "Retry-After": String(rate.retryAfterSec) }
          : undefined,
      },
    );
  }

  const config = getEmailJsBetaConfig();
  if (!config) {
    console.warn("EmailJS not configured, simulating success for beta");
    return jsonResponse({ success: true, warning: "simulated" });
  }

  // Le template EmailJS partagé utilise {{email}} / {{to_email}} / {{user_email}}
  // comme destinataire → tous pointent vers l'admin.
  const templateParams = {
    email: ADMIN_EMAIL,
    to_email: ADMIN_EMAIL,
    user_email: ADMIN_EMAIL,
    from_email: email, // Email de l'utilisateur (contact de réponse)
    reply_to: email,
    subject: `[Support ProDay] ${type}`,
    message: `Type: ${type}\nEmail de contact: ${email}\n\nMessage:\n${message}`,
  };

  try {
    const res = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        service_id: config.serviceId,
        template_id: config.templateId,
        user_id: config.publicKey,
        accessToken: config.privateKey,
        template_params: templateParams,
      }),
    });

    if (!res.ok) {
      const txt = await res.text();
      console.error("EmailJS Support Error:", txt);
      return jsonResponse(
        { error: "Erreur lors de l'envoi. Réessayez plus tard." },
        { status: 502 },
      );
    }
  } catch (error) {
    console.error("Support API Error:", error);
    return jsonResponse(
      { error: "Erreur lors de l'envoi. Réessayez plus tard." },
      { status: 500 },
    );
  }

  return jsonResponse({ success: true });
}
