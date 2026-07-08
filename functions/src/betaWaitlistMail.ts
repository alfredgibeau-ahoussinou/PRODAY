import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import { getAuthEmailTransportConfig, sendAuthEmailViaResend } from './authEmailTransport';
import {
  buildBetaWelcomeEmail,
  sendBetaWelcomeEmailViaEmailJs,
  type EmailJsBetaConfig,
} from './betaWaitlistEmail';

export function getBetaEmailJsConfig(): EmailJsBetaConfig | null {
  const cfg = functions.config().beta ?? {};
  const serviceId = (cfg.emailjs_service_id as string | undefined)?.trim();
  const templateId = (cfg.emailjs_template_id as string | undefined)?.trim();
  const publicKey = (cfg.emailjs_public_key as string | undefined)?.trim();
  const privateKey = (cfg.emailjs_private_key as string | undefined)?.trim();

  if (!serviceId || !templateId || !publicKey || !privateKey) return null;

  return { serviceId, templateId, publicKey, privateKey };
}

export function getBetaSiteUrl(): string {
  const cfg = functions.config().beta ?? {};
  return (cfg.site_url as string | undefined) ?? 'https://proday75.fr';
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
  const emailJs = getBetaEmailJsConfig();
  const resend = getAuthEmailTransportConfig();

  if (emailJs) {
    try {
      await sendBetaWelcomeEmailViaEmailJs(emailJs, welcomeParams);
      return { emailSent: true };
    } catch (e) {
      const emailError = e instanceof Error ? e.message : 'Envoi email impossible';
      console.error('[betaWaitlistMail] EmailJS:', e);
      return { emailSent: false, emailError };
    }
  }

  if (resend) {
    try {
      const { subject, html, text } = buildBetaWelcomeEmail(welcomeParams);
      await sendAuthEmailViaResend(resend, { to: email, subject, html, text });
      return { emailSent: true };
    } catch (e) {
      const emailError = e instanceof Error ? e.message : 'Envoi email impossible';
      console.error('[betaWaitlistMail] Resend:', e);
      return { emailSent: false, emailError };
    }
  }

  return {
    emailSent: false,
    emailError:
      'Transport email non configuré (EmailJS ou beta.resend_api_key / auth.resend_api_key)',
  };
}

export async function markWelcomeEmailSent(
  docRef: admin.firestore.DocumentReference,
): Promise<void> {
  await docRef.update({
    welcome_email_sent: true,
    welcome_email_sent_at: admin.firestore.FieldValue.serverTimestamp(),
  });
}
