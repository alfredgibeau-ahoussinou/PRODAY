import * as functions from 'firebase-functions';
import { buildAuthEmailJsTemplateParams } from './authEmailJsParams';
import {
  getAuthEmailJsConfig,
  isAuthEmailJsLegacyUnifiedTemplate,
  isResendFallbackEnabled,
  sendEmailViaEmailJs,
  type AuthEmailJsKind,
  type EmailJsConfig,
} from './emailJsClient';

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

export type EmailJsAuthConfig = EmailJsConfig;

export function getEmailJsAuthConfig(kind: AuthEmailJsKind): EmailJsAuthConfig | null {
  return getAuthEmailJsConfig(kind);
}

export { buildAuthEmailJsTemplateParams } from './authEmailJsParams';

export function getAuthEmailTransportConfig(): AuthEmailTransportConfig | null {
  if (!isResendFallbackEnabled('auth')) return null;

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

export function hasAuthEmailTransport(): boolean {
  return (
    getEmailJsAuthConfig('verification') !== null ||
    getEmailJsAuthConfig('password-reset') !== null ||
    getAuthEmailTransportConfig() !== null
  );
}

export function isAuthCustomEmailEnabled(): boolean {
  const authCfg = functions.config().auth ?? {};
  const explicit = String(authCfg.enabled ?? '').trim().toLowerCase();
  if (explicit === 'false') return false;
  if (explicit === 'true') return hasAuthEmailTransport();
  return hasAuthEmailTransport();
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
  options?: { displayName?: string; siteUrl?: string; kind?: AuthEmailJsKind }
): Promise<void> {
  const kind = options?.kind ?? 'verification';
  const authSiteUrl =
    (functions.config().auth?.continue_url as string | undefined)?.trim() ||
    (functions.config().beta?.site_url as string | undefined)?.trim() ||
    'https://proday75.fr';

  await sendEmailViaEmailJs(
    config,
    buildAuthEmailJsTemplateParams(payload, link, {
      displayName: options?.displayName,
      siteUrl: options?.siteUrl ?? authSiteUrl,
      kind,
      legacyUnifiedTemplate: isAuthEmailJsLegacyUnifiedTemplate(kind),
    })
  );
}

export { isResendDomainError };
