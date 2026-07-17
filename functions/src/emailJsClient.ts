import { configStr, getConfigSection } from './runtimeConfig';

export type EmailJsConfig = {
  serviceId: string;
  templateId: string;
  publicKey: string;
  privateKey: string;
};

export type EmailJsNamespace = 'auth' | 'beta' | 'appointment';
export type AuthEmailJsKind = 'verification' | 'password-reset';

const EMAILJS_API_URL = 'https://api.emailjs.com/api/v1.0/email/send';

/** Clés partagées (service + public/private) — définies une fois sous `beta.*`. */
export function getSharedEmailJsKeys(): {
  serviceId?: string;
  publicKey?: string;
  privateKey?: string;
} {
  return {
    serviceId: configStr('beta', 'emailjs_service_id', ['BETA_EMAILJS_SERVICE_ID']),
    publicKey: configStr('beta', 'emailjs_public_key', ['BETA_EMAILJS_PUBLIC_KEY']),
    privateKey: configStr('beta', 'emailjs_private_key', ['BETA_EMAILJS_PRIVATE_KEY']),
  };
}

/**
 * Résout la config EmailJS d'un namespace (auth, beta, appointment).
 * Chaque flux a son propre `emailjs_template_id` ; service/clés héritent de `beta.*` si omis.
 */
export function getEmailJsConfig(namespace: EmailJsNamespace): EmailJsConfig | null {
  const cfg = getConfigSection(namespace);
  const shared = getSharedEmailJsKeys();

  const templateId = cfg.emailjs_template_id?.trim();
  if (!templateId) return null;

  const serviceId = cfg.emailjs_service_id?.trim() || shared.serviceId;
  const publicKey = cfg.emailjs_public_key?.trim() || shared.publicKey;
  const privateKey = cfg.emailjs_private_key?.trim() || shared.privateKey;

  if (!serviceId || !publicKey || !privateKey) return null;
  return { serviceId, templateId, publicKey, privateKey };
}

/**
 * Config EmailJS Auth par type d'e-mail (vérification vs reset).
 * Préfère auth.emailjs_verification_template_id / auth.emailjs_password_reset_template_id ;
 * repli sur auth.emailjs_template_id (template unifié legacy).
 */
export function getAuthEmailJsConfig(kind: AuthEmailJsKind): EmailJsConfig | null {
  const authCfg = getConfigSection('auth');
  const shared = getSharedEmailJsKeys();

  const kindTemplateKey =
    kind === 'verification'
      ? 'emailjs_verification_template_id'
      : 'emailjs_password_reset_template_id';
  const templateId =
    authCfg[kindTemplateKey]?.trim() || authCfg.emailjs_template_id?.trim();
  if (!templateId) return null;

  const serviceId = authCfg.emailjs_service_id?.trim() || shared.serviceId;
  const publicKey = authCfg.emailjs_public_key?.trim() || shared.publicKey;
  const privateKey = authCfg.emailjs_private_key?.trim() || shared.privateKey;

  if (!serviceId || !publicKey || !privateKey) return null;
  return { serviceId, templateId, publicKey, privateKey };
}

export function isAuthEmailJsLegacyUnifiedTemplate(kind: AuthEmailJsKind): boolean {
  const authCfg = getConfigSection('auth');
  const kindTemplateKey =
    kind === 'verification'
      ? 'emailjs_verification_template_id'
      : 'emailjs_password_reset_template_id';
  return !authCfg[kindTemplateKey]?.trim() && Boolean(authCfg.emailjs_template_id?.trim());
}

/** Envoi serveur EmailJS (Cloud Functions — API non-navigateur activée). */
export async function sendEmailViaEmailJs(
  config: EmailJsConfig,
  templateParams: Record<string, string>
): Promise<void> {
  const res = await fetch(EMAILJS_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
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
