import * as functions from 'firebase-functions';

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
  const betaCfg = functions.config().beta ?? {};
  return {
    serviceId: (betaCfg.emailjs_service_id as string | undefined)?.trim(),
    publicKey: (betaCfg.emailjs_public_key as string | undefined)?.trim(),
    privateKey: (betaCfg.emailjs_private_key as string | undefined)?.trim(),
  };
}

/**
 * Résout la config EmailJS d'un namespace (auth, beta, appointment).
 * Chaque flux a son propre `emailjs_template_id` ; service/clés héritent de `beta.*` si omis.
 */
export function getEmailJsConfig(namespace: EmailJsNamespace): EmailJsConfig | null {
  const cfg = functions.config()[namespace] ?? {};
  const shared = getSharedEmailJsKeys();

  const templateId = (cfg.emailjs_template_id as string | undefined)?.trim();
  if (!templateId) return null;

  const serviceId =
    (cfg.emailjs_service_id as string | undefined)?.trim() || shared.serviceId;
  const publicKey =
    (cfg.emailjs_public_key as string | undefined)?.trim() || shared.publicKey;
  const privateKey =
    (cfg.emailjs_private_key as string | undefined)?.trim() || shared.privateKey;

  if (!serviceId || !publicKey || !privateKey) return null;
  return { serviceId, templateId, publicKey, privateKey };
}

/**
 * Config EmailJS Auth par type d'e-mail (vérification vs reset).
 * Préfère auth.emailjs_verification_template_id / auth.emailjs_password_reset_template_id ;
 * repli sur auth.emailjs_template_id (template unifié legacy).
 */
export function getAuthEmailJsConfig(kind: AuthEmailJsKind): EmailJsConfig | null {
  const authCfg = functions.config().auth ?? {};
  const shared = getSharedEmailJsKeys();

  const kindTemplateKey =
    kind === 'verification'
      ? 'emailjs_verification_template_id'
      : 'emailjs_password_reset_template_id';
  const templateId =
    (authCfg[kindTemplateKey] as string | undefined)?.trim() ||
    (authCfg.emailjs_template_id as string | undefined)?.trim();
  if (!templateId) return null;

  const serviceId =
    (authCfg.emailjs_service_id as string | undefined)?.trim() || shared.serviceId;
  const publicKey =
    (authCfg.emailjs_public_key as string | undefined)?.trim() || shared.publicKey;
  const privateKey =
    (authCfg.emailjs_private_key as string | undefined)?.trim() || shared.privateKey;

  if (!serviceId || !publicKey || !privateKey) return null;
  return { serviceId, templateId, publicKey, privateKey };
}

export function isAuthEmailJsLegacyUnifiedTemplate(kind: AuthEmailJsKind): boolean {
  const authCfg = functions.config().auth ?? {};
  const kindTemplateKey =
    kind === 'verification'
      ? 'emailjs_verification_template_id'
      : 'emailjs_password_reset_template_id';
  return (
    !(authCfg[kindTemplateKey] as string | undefined)?.trim() &&
    Boolean((authCfg.emailjs_template_id as string | undefined)?.trim())
  );
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
