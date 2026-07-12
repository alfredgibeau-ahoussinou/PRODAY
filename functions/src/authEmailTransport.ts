import * as functions from 'firebase-functions';

export type AuthEmailPayload = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

export type AuthEmailTransportConfig = {
  resendApiKey: string;
  fromEmail: string;
};

export type EmailJsAuthConfig = {
  serviceId: string;
  templateId: string;
  publicKey: string;
  privateKey: string;
};

export function getEmailJsAuthConfig(): EmailJsAuthConfig | null {
  const cfg = functions.config().beta ?? {};
  const serviceId = (cfg.emailjs_service_id as string | undefined)?.trim();
  const templateId = (cfg.emailjs_template_id as string | undefined)?.trim();
  const publicKey = (cfg.emailjs_public_key as string | undefined)?.trim();
  const privateKey = (cfg.emailjs_private_key as string | undefined)?.trim();
  if (!serviceId || !templateId || !publicKey || !privateKey) return null;
  return { serviceId, templateId, publicKey, privateKey };
}

export function getAuthEmailTransportConfig(): AuthEmailTransportConfig | null {
  const authCfg = functions.config().auth ?? {};
  const betaCfg = functions.config().beta ?? {};

  const resendApiKey =
    (authCfg.resend_api_key as string | undefined)?.trim() ||
    (betaCfg.resend_api_key as string | undefined)?.trim() ||
    '';
  const fromEmail =
    (authCfg.from_email as string | undefined)?.trim() ||
    (betaCfg.from_email as string | undefined)?.trim() ||
    'ProDay <contact@proday75.fr>';

  if (!resendApiKey) return null;
  return { resendApiKey, fromEmail };
}

export function isAuthCustomEmailEnabled(): boolean {
  const authCfg = functions.config().auth ?? {};
  const explicit = String(authCfg.enabled ?? '').trim().toLowerCase();
  if (explicit === 'false') return false;
  if (explicit === 'true') return getAuthEmailTransportConfig() !== null;
  return getAuthEmailTransportConfig() !== null;
}

export async function sendAuthEmailViaResend(
  config: AuthEmailTransportConfig,
  payload: AuthEmailPayload
): Promise<void> {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: config.fromEmail,
      to: [payload.to],
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
      reply_to: 'contact@proday.app',
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Resend ${res.status}: ${detail}`);
  }
}

function isResendDomainError(message: string): boolean {
  const upper = message.toUpperCase();
  return (
    upper.includes('DOMAIN IS NOT VERIFIED') ||
    upper.includes('RESEND 403') ||
    (upper.includes('RESEND') && upper.includes('403'))
  );
}

export async function sendAuthEmailViaEmailJs(
  config: EmailJsAuthConfig,
  payload: AuthEmailPayload,
  link: string
): Promise<void> {
  const siteUrl = (functions.config().beta?.site_url as string | undefined)?.trim() || 'https://proday75.fr';
  const res = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      service_id: config.serviceId,
      template_id: config.templateId,
      user_id: config.publicKey,
      accessToken: config.privateKey,
      template_params: {
        email: payload.to,
        to_email: payload.to,
        user_email: payload.to,
        subject: payload.subject,
        site_url: siteUrl,
        beta_url: link,
        member_role: 'ProDay',
        profile_label: 'Confirmation e-mail',
        role_label: 'Compte ProDay',
      },
    }),
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`EmailJS ${res.status}: ${detail}`);
  }
}

export { isResendDomainError };
