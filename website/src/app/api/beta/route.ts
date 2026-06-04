import { NextResponse } from "next/server";
import {
  BETA_ROLE_LABELS,
  buildBetaWelcomeEmail,
  isBetaRoleId,
  sendBetaWelcomeEmailViaResend,
} from "@/lib/betaWelcomeEmail";
import { resolveBetaFromEmail, resolveBetaSiteUrl } from "@/lib/betaEmailConfig";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type BetaPayload = { email?: string; role?: string };

/** Proxy Cloud Function ou envoi Resend direct (dev / Vercel). */
export async function POST(request: Request) {
  let body: BetaPayload;
  try {
    body = (await request.json()) as BetaPayload;
  } catch {
    return NextResponse.json({ error: "Corps JSON invalide" }, { status: 400 });
  }

  const email = String(body.email ?? "")
    .trim()
    .toLowerCase();
  const role = String(body.role ?? "player").trim();

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Email invalide" }, { status: 400 });
  }
  if (!isBetaRoleId(role)) {
    return NextResponse.json({ error: "Rôle invalide" }, { status: 400 });
  }

  const functionUrl = process.env.BETA_WAITLIST_FUNCTION_URL?.trim();
  if (functionUrl) {
    const upstream = await fetch(functionUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, role }),
    });
    const data = (await upstream.json().catch(() => ({}))) as Record<string, unknown>;
    return NextResponse.json(data, { status: upstream.status });
  }

  const resendKey = process.env.RESEND_API_KEY?.trim();
  if (!resendKey) {
    return NextResponse.json(
      {
        error:
          "Service bêta non configuré. Définissez BETA_WAITLIST_FUNCTION_URL ou RESEND_API_KEY.",
      },
      { status: 503 }
    );
  }

  const roleLabel = BETA_ROLE_LABELS[role];
  let from: string;
  try {
    from = resolveBetaFromEmail();
  } catch (e) {
    const message = e instanceof Error ? e.message : "Configuration email invalide";
    console.error("[api/beta]", message);
    return NextResponse.json({ error: message }, { status: 503 });
  }
  const siteUrl = resolveBetaSiteUrl();

  const { subject, html, text } = buildBetaWelcomeEmail({
    email,
    roleLabel,
    siteUrl,
  });

  try {
    await sendBetaWelcomeEmailViaResend({
      apiKey: resendKey,
      from,
      to: email,
      subject,
      html,
      text,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Envoi impossible";
    console.error("[api/beta]", message);
    return NextResponse.json({ error: "Envoi email impossible" }, { status: 502 });
  }

  return NextResponse.json({ ok: true, emailSent: true, isNew: true });
}
