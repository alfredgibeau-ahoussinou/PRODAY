import * as admin from 'firebase-admin';
import { configStr } from './runtimeConfig';
import {
  buildBetaEmailJsTemplateParams,
  buildBetaWelcomeEmail,
  type EmailJsBetaConfig,
} from './betaWaitlistEmail';
import { getEmailJsConfig } from './emailJsClient';
import { isBrevoConfigured, sendTransactionalEmail } from './emailTransport';

export function getBetaEmailJsConfig(): EmailJsBetaConfig | null {
  return getEmailJsConfig('beta');
}

export function getBetaSiteUrl(): string {
  return configStr('beta', 'site_url', ['BETA_SITE_URL']) ?? 'https://proday75.fr';
}

export type BetaWelcomeSendResult = {
  emailSent: boolean;
  emailError?: string;
};

export async function sendBetaWelcomeEmailToEntry(
  email: string,
  roleLabel: string,
  accessToken: string,
): Promise<BetaWelcomeSendResult> {
  const siteUrl = getBetaSiteUrl();
  const welcomeParams = { email, roleLabel, siteUrl, accessToken };
  const { subject, html, text } = buildBetaWelcomeEmail(welcomeParams);
  const emailJs = getBetaEmailJsConfig();

  if (!isBrevoConfigured() && !emailJs) {
    return {
      emailSent: false,
      emailError:
        'Transport email non configuré (email.brevo_api_key + email.from_email ou beta.emailjs_template_id)',
    };
  }

  try {
    await sendTransactionalEmail(
      { to: email, subject, html, text },
      emailJs
        ? {
            config: emailJs,
            templateParams: buildBetaEmailJsTemplateParams(welcomeParams),
          }
        : undefined
    );
    return { emailSent: true };
  } catch (e) {
    const emailError = e instanceof Error ? e.message : 'Envoi email impossible';
    console.error('[betaWaitlistMail] Envoi email:', e);
    return { emailSent: false, emailError };
  }
}

export async function markWelcomeEmailSent(
  docRef: admin.firestore.DocumentReference,
): Promise<void> {
  await docRef.update({
    welcome_email_sent: true,
    welcome_email_sent_at: admin.firestore.FieldValue.serverTimestamp(),
  });
}
