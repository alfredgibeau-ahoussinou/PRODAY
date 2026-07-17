import { configStr } from './runtimeConfig';
import { buildAuthEmailJsTemplateParams } from './authEmailJsParams';
import {
  getAuthEmailJsConfig,
  isAuthEmailJsLegacyUnifiedTemplate,
  type AuthEmailJsKind,
  type EmailJsConfig,
} from './emailJsClient';
import { getBrevoConfig } from './brevoEmailClient';
import { sendTransactionalEmail } from './emailTransport';

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
  if (getBrevoConfig()) return true;
  return (
    getAuthEmailJsConfig('verification') !== null ||
    getAuthEmailJsConfig('password-reset') !== null
  );
}

export function isAuthCustomEmailEnabled(): boolean {
  const explicit = String(configStr('auth', 'enabled', ['AUTH_ENABLED']) ?? '')
    .trim()
    .toLowerCase();
  if (explicit === 'false') return false;
  if (explicit === 'true') return hasAuthEmailTransport();
  return hasAuthEmailTransport();
}

export async function sendAuthEmail(
  payload: AuthEmailPayload,
  link: string,
  options?: { displayName?: string; siteUrl?: string; kind?: AuthEmailJsKind }
): Promise<void> {
  const kind = options?.kind ?? 'verification';
  const authSiteUrl =
    configStr('auth', 'continue_url', ['AUTH_CONTINUE_URL']) ||
    configStr('beta', 'site_url', ['BETA_SITE_URL']) ||
    'https://proday75.fr';

  const emailJs = getAuthEmailJsConfig(kind);
  const emailJsFallback = emailJs
    ? {
        config: emailJs,
        templateParams: buildAuthEmailJsTemplateParams(payload, link, {
          displayName: options?.displayName,
          siteUrl: options?.siteUrl ?? authSiteUrl,
          kind,
          legacyUnifiedTemplate: isAuthEmailJsLegacyUnifiedTemplate(kind),
        }),
      }
    : undefined;

  await sendTransactionalEmail(payload, emailJsFallback);
}

/** @deprecated Utiliser sendAuthEmail — conservé pour compatibilité interne. */
export async function sendAuthEmailViaEmailJs(
  config: EmailJsAuthConfig,
  payload: AuthEmailPayload,
  link: string,
  options?: { displayName?: string; siteUrl?: string; kind?: AuthEmailJsKind }
): Promise<void> {
  await sendAuthEmail(payload, link, options);
  void config;
}
