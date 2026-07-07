import emailjs from "@emailjs/nodejs";
import { buildBetaAccessUrl } from "@/lib/betaAccess";
import type { BetaWelcomeEmailParams } from "./betaWelcomeEmail";
import { BETA_MEMBER_ROLE } from "./betaWelcomeEmail";

export type EmailJsBetaConfig = {
  serviceId: string;
  templateId: string;
  publicKey: string;
  privateKey: string;
};

export function getEmailJsBetaConfig(): EmailJsBetaConfig | null {
  const serviceId = process.env.EMAILJS_SERVICE_ID?.trim();
  const templateId = process.env.EMAILJS_TEMPLATE_ID?.trim();
  const publicKey = process.env.EMAILJS_PUBLIC_KEY?.trim();
  const privateKey = process.env.EMAILJS_PRIVATE_KEY?.trim();

  if (!serviceId || !templateId || !publicKey || !privateKey) {
    return null;
  }

  return { serviceId, templateId, publicKey, privateKey };
}

export function buildBetaEmailJsTemplateParams(
  params: BetaWelcomeEmailParams
): Record<string, string> {
  const site = (params.siteUrl ?? "https://proday75.fr").replace(/\/$/, "");

  return {
    email: params.email,
    to_email: params.email,
    user_email: params.email,
    member_role: BETA_MEMBER_ROLE,
    profile_label: params.roleLabel,
    role_label: BETA_MEMBER_ROLE,
    site_url: site,
    beta_url: buildBetaAccessUrl(site, params.accessToken),
    subject: "Vous êtes beta-testeur ProDay",
  };
}

/** Message opérateur à partir d'une erreur EmailJS (logs + réponse API). */
export function describeBetaEmailJsFailure(error: unknown): {
  log: string;
  hint?: string;
} {
  const raw =
    error instanceof Error
      ? error.message
      : typeof error === "object" && error !== null && "text" in error
        ? String((error as { text: unknown }).text)
        : "Envoi impossible";

  if (/invalid grant|gmail_api/i.test(raw)) {
    return {
      log: raw,
      hint:
        "Reconnectez le compte Gmail dans EmailJS (Email Services → Reconnect).",
    };
  }
  if (/412/.test(raw)) {
    return {
      log: raw,
      hint: "Vérifiez le service email connecté dans le dashboard EmailJS.",
    };
  }
  if (/403|401|unauthorized|forbidden/i.test(raw)) {
    return {
      log: raw,
      hint:
        "Clés EmailJS invalides ou API non-navigateur désactivée (Account → Security).",
    };
  }

  return { log: raw };
}

/** Envoi via EmailJS (clés serveur — ne jamais exposer côté client). */
export async function sendBetaWelcomeEmailViaEmailJs(
  config: EmailJsBetaConfig,
  params: BetaWelcomeEmailParams
): Promise<void> {
  const templateParams = buildBetaEmailJsTemplateParams(params);

  try {
    await emailjs.send(config.serviceId, config.templateId, templateParams, {
      publicKey: config.publicKey,
      privateKey: config.privateKey,
    });
  } catch (error) {
    const { log } = describeBetaEmailJsFailure(error);
    throw new Error(log);
  }
}

/** Même envoi via fetch (Cloud Functions, sans dépendance npm). */
export async function sendBetaWelcomeEmailViaEmailJsFetch(
  config: EmailJsBetaConfig,
  params: BetaWelcomeEmailParams
): Promise<void> {
  const templateParams = buildBetaEmailJsTemplateParams(params);

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
    const detail = await res.text();
    throw new Error(`EmailJS ${res.status}: ${detail}`);
  }
}
