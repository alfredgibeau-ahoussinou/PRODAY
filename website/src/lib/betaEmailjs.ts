import emailjs from "@emailjs/nodejs";
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
  const site = (params.siteUrl ?? "https://proday.app").replace(/\/$/, "");

  return {
    email: params.email,
    to_email: params.email,
    user_email: params.email,
    member_role: BETA_MEMBER_ROLE,
    profile_label: params.roleLabel,
    role_label: BETA_MEMBER_ROLE,
    site_url: site,
    beta_url: `${site}/beta`,
    subject: "Vous êtes beta-testeur ProDay",
  };
}

/** Envoi via EmailJS (clés serveur — ne jamais exposer côté client). */
export async function sendBetaWelcomeEmailViaEmailJs(
  config: EmailJsBetaConfig,
  params: BetaWelcomeEmailParams
): Promise<void> {
  const templateParams = buildBetaEmailJsTemplateParams(params);

  await emailjs.send(config.serviceId, config.templateId, templateParams, {
    publicKey: config.publicKey,
    privateKey: config.privateKey,
  });
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
