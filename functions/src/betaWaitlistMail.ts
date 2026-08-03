import * as admin from 'firebase-admin';
import { configStr } from './runtimeConfig';
import {
  buildBetaConfirmationEmail,
  buildBetaEmailJsTemplateParams,
  buildBetaRejectEmail,
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

function emailNotConfiguredError(): string {
  return 'Transport email non configuré (email.brevo_api_key + email.from_email ou beta.emailjs_template_id)';
}

export async function sendBetaConfirmationEmailToEntry(
  email: string,
): Promise<BetaWelcomeSendResult> {
  const siteUrl = getBetaSiteUrl();
  const { subject, html, text } = buildBetaConfirmationEmail({ email, siteUrl });
  const emailJs = getBetaEmailJsConfig();

  if (!isBrevoConfigured() && !emailJs) {
    return { emailSent: false, emailError: emailNotConfiguredError() };
  }

  try {
    await sendTransactionalEmail(
      { to: email, subject, html, text },
      emailJs
        ? {
            config: emailJs,
            templateParams: {
              email,
              to_email: email,
              user_email: email,
              site_url: siteUrl,
              subject,
              email_type: 'beta_confirmation',
            },
          }
        : undefined
    );
    return { emailSent: true };
  } catch (e) {
    const emailError = e instanceof Error ? e.message : 'Envoi email impossible';
    console.error('[betaWaitlistMail] Envoi email confirmation:', e);
    return { emailSent: false, emailError };
  }
}

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
      emailError: emailNotConfiguredError(),
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

export async function sendBetaRejectEmailToEntry(
  email: string,
  roleLabel: string,
): Promise<BetaWelcomeSendResult> {
  const siteUrl = getBetaSiteUrl();
  const rejectParams = { email, roleLabel, siteUrl };
  const { subject, html, text } = buildBetaRejectEmail(rejectParams);
  const emailJs = getBetaEmailJsConfig();

  if (!isBrevoConfigured() && !emailJs) {
    return {
      emailSent: false,
      emailError: emailNotConfiguredError(),
    };
  }

  try {
    await sendTransactionalEmail(
      { to: email, subject, html, text },
      emailJs
        ? {
            config: emailJs,
            templateParams: {
              email,
              to_email: email,
              user_email: email,
              profile_label: roleLabel,
              role_label: roleLabel,
              site_url: siteUrl,
              subject,
              email_type: 'beta_reject',
            },
          }
        : undefined
    );
    return { emailSent: true };
  } catch (e) {
    const emailError = e instanceof Error ? e.message : 'Envoi email impossible';
    console.error('[betaWaitlistMail] Envoi email refus:', e);
    return { emailSent: false, emailError };
  }
}

export async function markConfirmationEmailSent(
  docRef: admin.firestore.DocumentReference,
): Promise<void> {
  await docRef.update({
    confirmation_email_sent: true,
    confirmation_email_sent_at: admin.firestore.FieldValue.serverTimestamp(),
  });
}

export async function markWelcomeEmailSent(
  docRef: admin.firestore.DocumentReference,
): Promise<void> {
  await docRef.update({
    welcome_email_sent: true,
    welcome_email_sent_at: admin.firestore.FieldValue.serverTimestamp(),
  });
}

export async function markRejectEmailSent(
  docRef: admin.firestore.DocumentReference,
): Promise<void> {
  await docRef.update({
    reject_email_sent: true,
    reject_email_sent_at: admin.firestore.FieldValue.serverTimestamp(),
  });
}
