import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { generateBetaAccessToken } from './betaAccessToken';
import { getAuthEmailTransportConfig, sendAuthEmailViaResend } from './authEmailTransport';
import {
  BETA_ROLE_LABELS,
  buildBetaWelcomeEmail,
  isBetaRoleId,
  sendBetaWelcomeEmailViaEmailJs,
  type EmailJsBetaConfig,
} from './betaWaitlistEmail';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'https://proday75.fr',
  'https://www.proday75.fr',
  'https://proday.app',
  'https://www.proday.app',
  'https://proday.vercel.app',
  'https://proday75.netlify.app',
];

function setCors(req: functions.https.Request, res: functions.Response): boolean {
  const origin = req.get('Origin') ?? '';
  if (
    origin &&
    (ALLOWED_ORIGINS.includes(origin) ||
      origin.endsWith('.vercel.app') ||
      origin.endsWith('.netlify.app'))
  ) {
    res.set('Access-Control-Allow-Origin', origin);
  }
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  return req.method === 'OPTIONS';
}

function getBetaEmailJsConfig(): EmailJsBetaConfig | null {
  const cfg = functions.config().beta ?? {};
  const serviceId = (cfg.emailjs_service_id as string | undefined)?.trim();
  const templateId = (cfg.emailjs_template_id as string | undefined)?.trim();
  const publicKey = (cfg.emailjs_public_key as string | undefined)?.trim();
  const privateKey = (cfg.emailjs_private_key as string | undefined)?.trim();

  if (!serviceId || !templateId || !publicKey || !privateKey) return null;

  return { serviceId, templateId, publicKey, privateKey };
}

function getBetaSiteUrl(): string {
  const cfg = functions.config().beta ?? {};
  return (cfg.site_url as string | undefined) ?? 'https://proday75.fr';
}

/** Inscription bêta depuis le site vitrine — Firestore + email de bienvenue. */
export function createSubmitBetaWaitlistHandler(db: admin.firestore.Firestore) {
  return async (req: functions.https.Request, res: functions.Response): Promise<void> => {
    if (setCors(req, res)) {
      res.status(204).send('');
      return;
    }

    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    const body = (req.body ?? {}) as { email?: string; role?: string };
    const email = String(body.email ?? '')
      .trim()
      .toLowerCase();
    const role = String(body.role ?? 'player').trim();

    if (!EMAIL_RE.test(email)) {
      res.status(400).json({ error: 'Email invalide' });
      return;
    }
    if (!isBetaRoleId(role)) {
      res.status(400).json({ error: 'Rôle invalide' });
      return;
    }

    const roleLabel = BETA_ROLE_LABELS[role];
    const now = admin.firestore.FieldValue.serverTimestamp();

    const existing = await db
      .collection('beta_waitlist')
      .where('email', '==', email)
      .limit(1)
      .get();

    let docRef: admin.firestore.DocumentReference;
    let isNew = false;
    let accessToken: string;

    if (existing.empty) {
      accessToken = generateBetaAccessToken();
      docRef = db.collection('beta_waitlist').doc();
      await docRef.set({
        email,
        role,
        role_label: roleLabel,
        access_token: accessToken,
        source: 'website',
        welcome_email_sent: false,
        created_at: now,
        updated_at: now,
      });
      isNew = true;
    } else {
      docRef = existing.docs[0].ref;
      const existingData = existing.docs[0].data();
      accessToken =
        typeof existingData.access_token === 'string' && existingData.access_token.trim()
          ? existingData.access_token.trim()
          : generateBetaAccessToken();
      await docRef.update({
        role,
        role_label: roleLabel,
        access_token: accessToken,
        updated_at: now,
      });
    }

    const siteUrl = getBetaSiteUrl();
    const welcomeParams = { email, roleLabel, siteUrl, accessToken };
    const emailJs = getBetaEmailJsConfig();
    const resend = getAuthEmailTransportConfig();
    let emailSent = false;
    let emailError: string | undefined;

    if (emailJs) {
      try {
        await sendBetaWelcomeEmailViaEmailJs(emailJs, welcomeParams);
        emailSent = true;
      } catch (e) {
        emailError = e instanceof Error ? e.message : 'Envoi email impossible';
        console.error('[submitBetaWaitlist] EmailJS:', e);
      }
    } else if (resend) {
      try {
        const { subject, html, text } = buildBetaWelcomeEmail(welcomeParams);
        await sendAuthEmailViaResend(resend, { to: email, subject, html, text });
        emailSent = true;
      } catch (e) {
        emailError = e instanceof Error ? e.message : 'Envoi email impossible';
        console.error('[submitBetaWaitlist] Resend:', e);
      }
    } else {
      emailError =
        'Transport email non configuré (EmailJS ou beta.resend_api_key / auth.resend_api_key)';
      console.warn('[submitBetaWaitlist]', emailError);
    }

    if (emailSent) {
      await docRef.update({
        welcome_email_sent: true,
        welcome_email_sent_at: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    res.status(200).json({
      ok: true,
      isNew,
      emailSent,
      emailError: emailSent ? undefined : emailError,
    });
  };
}
