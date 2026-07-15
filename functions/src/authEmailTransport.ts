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
  const authCfg = functions.config().auth ?? {};
  const betaCfg = functions.config().beta ?? {};

  // Ne jamais réutiliser beta.emailjs_template_id : template « bienvenue bêta », pas Auth.
  const templateId = (authCfg.emailjs_template_id as string | undefined)?.trim();
  if (!templateId) return null;

  const serviceId =
    (authCfg.emailjs_service_id as string | undefined)?.trim() ||
    (betaCfg.emailjs_service_id as string | undefined)?.trim();
  const publicKey =
    (authCfg.emailjs_public_key as string | undefined)?.trim() ||
    (betaCfg.emailjs_public_key as string | undefined)?.trim();
  const privateKey =
    (authCfg.emailjs_private_key as string | undefined)?.trim() ||
    (betaCfg.emailjs_private_key as string | undefined)?.trim();

  if (!serviceId || !publicKey || !privateKey) return null;
  return { serviceId, templateId, publicKey, privateKey };
}

export function buildAuthEmailJsTemplateParams(
  payload: AuthEmailPayload,
  link: string,
  options?: { displayName?: string; siteUrl?: string }
): Record<string, string> {
  const siteUrl = (options?.siteUrl ?? 'https://proday75.fr').replace(/\/$/, '');
  return {
    email: payload.to,
    to_email: payload.to,
    user_email: payload.to,
    subject: payload.subject,
    site_url: siteUrl,
    action_link: link,
    verification_url: link,
    message_text: payload.text,
    display_name: options?.displayName?.trim() || '',
  };
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
  link: string,
  options?: { displayName?: string; siteUrl?: string }
): Promise<void> {
  const authSiteUrl =
    (functions.config().auth?.continue_url as string | undefined)?.trim() ||
    (functions.config().beta?.site_url as string | undefined)?.trim() ||
    'https://proday75.fr';
  const res = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      service_id: config.serviceId,
      template_id: config.templateId,
      user_id: config.publicKey,
      accessToken: config.privateKey,
      template_params: buildAuthEmailJsTemplateParams(payload, link, {
        displayName: options?.displayName,
        siteUrl: options?.siteUrl ?? authSiteUrl,
      }),
    }),
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`EmailJS ${res.status}: ${detail}`);
  }
}

export { isResendDomainError };
