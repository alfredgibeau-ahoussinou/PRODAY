import * as functions from 'firebase-functions';
import { buildAuthEmailJsTemplateParams } from './authEmailJsParams';
import {
  getAuthEmailJsConfig,
  isAuthEmailJsLegacyUnifiedTemplate,
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

export type EmailJsAuthConfig = EmailJsConfig;

export function getEmailJsAuthConfig(kind: AuthEmailJsKind): EmailJsAuthConfig | null {
  return getAuthEmailJsConfig(kind);
}

export { buildAuthEmailJsTemplateParams } from './authEmailJsParams';

export function hasAuthEmailTransport(): boolean {
  return (
    getEmailJsAuthConfig('verification') !== null ||
    getEmailJsAuthConfig('password-reset') !== null
  );
}

export function isAuthCustomEmailEnabled(): boolean {
  const authCfg = functions.config().auth ?? {};
  const explicit = String(authCfg.enabled ?? '').trim().toLowerCase();
  if (explicit === 'false') return false;
  if (explicit === 'true') return hasAuthEmailTransport();
  return hasAuthEmailTransport();
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
