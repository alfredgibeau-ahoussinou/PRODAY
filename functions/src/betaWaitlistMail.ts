import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import { getAuthEmailTransportConfig, sendAuthEmailViaResend } from './authEmailTransport';
import {
  buildBetaWelcomeEmail,
  sendBetaWelcomeEmailViaEmailJs,
  type EmailJsBetaConfig,
} from './betaWaitlistEmail';
import { getEmailJsConfig, isResendFallbackEnabled } from './emailJsClient';

export function getBetaEmailJsConfig(): EmailJsBetaConfig | null {
  return getEmailJsConfig('beta');
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
  const resend = isResendFallbackEnabled('beta') ? getAuthEmailTransportConfig() : null;

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
      'Transport email non configuré (beta.emailjs_template_id + clés EmailJS)',
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
