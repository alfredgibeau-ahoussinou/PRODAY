import { NextResponse } from "next/server";
import { SPONSOR_PARTNER_CONTACT_EMAIL } from "@/lib/content";
import { getEmailJsBetaConfig } from "@/lib/betaEmailjs";
import type { SponsorSignupPayload } from "@/lib/sponsorContent";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import {
  isProdayMobileClientRequest,
  isSameOriginBrowserRequest,
  MAX_BETA_EMAIL_LENGTH,
} from "@/lib/requestSecurity";
import { applySecurityHeaders } from "@/lib/securityHeaders";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 60_000;

const MAX_STRING = 200;
const MAX_ARRAY = 12;
const MAX_MESSAGE = 2000;

function jsonResponse(body: Record<string, unknown>, init?: ResponseInit) {
  const response = NextResponse.json(body, init);
  applySecurityHeaders(response);
  response.headers.set("Cache-Control", "no-store");
  return response;
}

function trimStr(value: unknown, max = MAX_STRING): string {
  return String(value ?? "")
    .trim()
    .slice(0, max);
}


const PACKAGE_TIERS = ["starter", "territorial", "national", "custom"] as const;
type PackageTier = (typeof PACKAGE_TIERS)[number];

function parsePackageTier(value: unknown): PackageTier {
  const raw = trimStr(value, 32).toLowerCase();
  return (PACKAGE_TIERS as readonly string[]).includes(raw) ? (raw as PackageTier) : "custom";
}

function trimArray(value: unknown, max = MAX_ARRAY): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((v) => typeof v === "string")
    .map((v) => v.trim().slice(0, MAX_STRING))
    .filter(Boolean)
    .slice(0, max);
}

function formatSponsorSummary(payload: SponsorSignupPayload): string {
  const lines = [
    "── Nouvelle inscription sponsor ProDay ──",
    "",
    `Marque : ${payload.companyName}`,
    `Secteur : ${payload.sector}`,
    `Contact : ${payload.contactName}`,
    `Email : ${payload.email}`,
    `Téléphone : ${payload.phone || "—"}`,
    `Budget : ${payload.budget}`,
    "",
    `Objectifs : ${payload.goals.join(", ")}`,
    `Public cible : ${payload.audience.join(", ")}`,
    `Régions : ${payload.regions.join(", ")}`,
    `Sports : ${payload.sports.join(", ")}`,
  ];
  if (payload.logoFileName) lines.push(`Logo : ${payload.logoFileName}`);
  if (payload.message) lines.push("", `Message : ${payload.message}`);
  lines.push("", "Source : proday.fr/sponsor");
  return lines.join("\n");
}

async function submitSponsorQuoteRequest(
  payload: SponsorSignupPayload,
): Promise<{ ok: boolean; status?: number; error?: string }> {
  const functionUrl = process.env.SPONSOR_QUOTE_FUNCTION_URL?.trim();
  if (!functionUrl) {
    return { ok: false, error: "Service devis non configuré" };
  }

  const upstream = await fetch(functionUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      companyName: payload.companyName,
      contactEmail: payload.email,
      contactName: payload.contactName,
      phone: payload.phone,
      budget: payload.budget,
      goals: payload.goals,
      audience: payload.audience,
      regions: payload.regions,
      sports: payload.sports,
      message: payload.message,
      packageTier: payload.packageTier ?? "custom",
      sector: payload.sector,
      source: "website",
    }),
  });

  if (!upstream.ok) {
    const data = (await upstream.json().catch(() => ({}))) as { error?: string };
    return { ok: false, status: upstream.status, error: data.error ?? "Enregistrement devis impossible" };
  }

  return { ok: true };
}

async function submitBetaWaitlist(email: string): Promise<{ ok: boolean; status?: number; error?: string }> {
  const functionUrl = process.env.BETA_WAITLIST_FUNCTION_URL?.trim();
  if (!functionUrl) {
    return { ok: false, error: "Service bêta non configuré" };
  }

  const upstream = await fetch(functionUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, role: "sponsor" }),
  });

  if (!upstream.ok) {
    const data = (await upstream.json().catch(() => ({}))) as { error?: string };
    return { ok: false, status: upstream.status, error: data.error ?? "Inscription bêta impossible" };
  }

  return { ok: true };
}

async function notifyPartnersTeam(payload: SponsorSignupPayload): Promise<void> {
  const config = getEmailJsBetaConfig();
  if (!config) return;

  const templateId =
    process.env.EMAILJS_SPONSOR_TEMPLATE_ID?.trim() || config.templateId;
  const summary = formatSponsorSummary(payload);

  await fetch("https://api.emailjs.com/api/v1.0/email/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      service_id: config.serviceId,
      template_id: templateId,
      user_id: config.publicKey,
      accessToken: config.privateKey,
      template_params: {
        email: SPONSOR_PARTNER_CONTACT_EMAIL,
        to_email: SPONSOR_PARTNER_CONTACT_EMAIL,
        user_email: payload.email,
        reply_to: payload.email,
        subject: `[ProDay Sponsor] ${payload.companyName} · ${payload.sector}`,
        message: summary,
        company_name: payload.companyName,
        contact_name: payload.contactName,
        profile_label: "Inscription sponsor",
        role_label: payload.sector,
      },
    }),
  }).catch(() => undefined);
}

export async function POST(request: Request) {
  if (!isSameOriginBrowserRequest(request) && !isProdayMobileClientRequest(request)) {
    return jsonResponse({ error: "Origine non autorisée" }, { status: 403 });
  }

  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return jsonResponse({ error: "Content-Type application/json requis" }, { status: 415 });
  }

  const rate = checkRateLimit(
    `sponsor-signup:${getClientIp(request)}`,
    RATE_LIMIT,
    RATE_WINDOW_MS,
  );
  if (!rate.allowed) {
    return jsonResponse(
      { error: "Trop de tentatives. Réessayez dans quelques minutes." },
      {
        status: 429,
        headers: rate.retryAfterSec ? { "Retry-After": String(rate.retryAfterSec) } : undefined,
      },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return jsonResponse({ error: "Corps JSON invalide" }, { status: 400 });
  }

  const payload: SponsorSignupPayload = {
    companyName: trimStr(body.companyName),
    sector: trimStr(body.sector),
    contactName: trimStr(body.contactName),
    budget: trimStr(body.budget),
    goals: trimArray(body.goals),
    audience: trimArray(body.audience),
    regions: trimArray(body.regions),
    sports: trimArray(body.sports),
    email: trimStr(body.email, MAX_BETA_EMAIL_LENGTH).toLowerCase(),
    phone: trimStr(body.phone, 32),
    logoFileName: body.logoFileName ? trimStr(body.logoFileName, 128) : undefined,
    message: body.message ? trimStr(body.message, MAX_MESSAGE) : undefined,
    packageTier: parsePackageTier(body.packageTier ?? body.package_tier),
  };

  if (!payload.companyName || !payload.sector || !payload.contactName) {
    return jsonResponse({ error: "Informations entreprise incomplètes" }, { status: 400 });
  }
  if (!payload.budget || payload.goals.length === 0 || payload.audience.length === 0) {
    return jsonResponse({ error: "Informations campagne incomplètes" }, { status: 400 });
  }
  if (payload.regions.length === 0 || payload.sports.length === 0) {
    return jsonResponse({ error: "Ciblage incomplet" }, { status: 400 });
  }
  if (!EMAIL_RE.test(payload.email)) {
    return jsonResponse({ error: "Email invalide" }, { status: 400 });
  }

  const beta = await submitBetaWaitlist(payload.email);
  if (!beta.ok && beta.status !== 503) {
    return jsonResponse(
      { error: beta.error ?? "Inscription impossible" },
      { status: beta.status ?? 502 },
    );
  }

  const quote = await submitSponsorQuoteRequest(payload);
  if (!quote.ok && quote.status !== 503) {
    return jsonResponse(
      { error: quote.error ?? "Enregistrement devis impossible" },
      { status: quote.status ?? 502 },
    );
  }

  await notifyPartnersTeam(payload);

  return jsonResponse({
    ok: true,
    message:
      "Demande enregistrée. L'équipe partenaires ProDay vous recontacte sous 48 h ouvrées.",
    betaRegistered: beta.ok,
  });
}
