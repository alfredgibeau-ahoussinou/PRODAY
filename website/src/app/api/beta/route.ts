import { NextResponse } from "next/server";
import { BETA_ROLE_LABELS, isBetaRoleId } from "@/lib/betaWelcomeEmail";
import { resolveBetaSiteUrl } from "@/lib/betaEmailConfig";
import {
  getEmailJsBetaConfig,
  sendBetaWelcomeEmailViaEmailJs,
} from "@/lib/betaEmailjs";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type BetaPayload = { email?: string; role?: string };

/** Proxy Cloud Function ou envoi EmailJS depuis Vercel. */
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
    const data = (await upstream.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;
    return NextResponse.json(data, { status: upstream.status });
  }

  const emailJs = getEmailJsBetaConfig();
  if (!emailJs) {
    return NextResponse.json(
      {
        error:
          "Service bêta non configuré. Définissez EMAILJS_* ou BETA_WAITLIST_FUNCTION_URL.",
      },
      { status: 503 }
    );
  }

  const roleLabel = BETA_ROLE_LABELS[role];
  const siteUrl = resolveBetaSiteUrl();

  try {
    await sendBetaWelcomeEmailViaEmailJs(emailJs, {
      email,
      roleLabel,
      siteUrl,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Envoi impossible";
    console.error("[api/beta]", message);
    return NextResponse.json({ error: "Envoi email impossible" }, { status: 502 });
  }

  return NextResponse.json({ ok: true, emailSent: true, isNew: true });
}
