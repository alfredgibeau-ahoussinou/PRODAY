import { configStr } from './runtimeConfig';
import { getBrevoConfig, sendViaBrevo, type BrevoSendPayload } from './brevoEmailClient';
import {
  getEmailJsConfig,
  sendEmailViaEmailJs,
  type EmailJsConfig,
  type EmailJsNamespace,
} from './emailJsClient';

export type TransactionalEmailPayload = BrevoSendPayload;

export type EmailJsFallback = {
  config: EmailJsConfig;
  templateParams: Record<string, string>;
};

export function getEmailProvider(): 'brevo' | 'emailjs' {
  const provider = String(configStr('email', 'provider', ['EMAIL_PROVIDER']) ?? 'brevo')
    .trim()
    .toLowerCase();
  return provider === 'emailjs' ? 'emailjs' : 'brevo';
}

export function isBrevoConfigured(): boolean {
  return getBrevoConfig() !== null;
}

export function isEmailJsNamespaceConfigured(namespace: EmailJsNamespace): boolean {
  return getEmailJsConfig(namespace) !== null;
}

export function isTransactionalEmailConfigured(
  emailJsNamespaces: EmailJsNamespace[] = ['auth', 'beta', 'appointment']
): boolean {
  if (isBrevoConfigured()) return true;
  return emailJsNamespaces.some((ns) => isEmailJsNamespaceConfigured(ns));
}

/**
 * Envoi transactionnel : Brevo (principal) avec repli EmailJS optionnel.
 */
export async function sendTransactionalEmail(
  payload: TransactionalEmailPayload,
  emailJsFallback?: EmailJsFallback
): Promise<void> {
  const brevo = getBrevoConfig();
  const preferBrevo = getEmailProvider() !== 'emailjs';

  if (preferBrevo && brevo) {
    try {
      const { messageId } = await sendViaBrevo(brevo, payload);
      console.info('[emailTransport] Brevo OK', { to: payload.to, messageId });
      return;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error('[emailTransport] Brevo failed:', msg, { to: payload.to, from: brevo.fromEmail });
      if (!emailJsFallback) throw e;
      console.warn('[emailTransport] Repli EmailJS');
    }
  }

  if (emailJsFallback) {
    await sendEmailViaEmailJs(emailJsFallback.config, emailJsFallback.templateParams);
    return;
  }

  if (!preferBrevo && brevo) {
    await sendViaBrevo(brevo, payload);
    return;
  }

  throw new Error(
    'Transport email non configuré (email.brevo_api_key + email.from_email ou clés EmailJS)'
  );
}
