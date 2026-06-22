import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import {
  BETA_ROLE_LABELS,
  isBetaRoleId,
  sendBetaWelcomeEmailViaEmailJs,
  type EmailJsBetaConfig,
} from './betaWaitlistEmail';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
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
  return (cfg.site_url as string | undefined) ?? 'https://proday.app';
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

    if (existing.empty) {
      docRef = db.collection('beta_waitlist').doc();
      await docRef.set({
        email,
        role,
        role_label: roleLabel,
        source: 'website',
        welcome_email_sent: false,
        created_at: now,
        updated_at: now,
      });
      isNew = true;
    } else {
      docRef = existing.docs[0].ref;
      await docRef.update({
        role,
        role_label: roleLabel,
        updated_at: now,
      });
    }

    const emailJs = getBetaEmailJsConfig();
    let emailSent = false;
    let emailError: string | undefined;

    if (emailJs) {
      try {
        await sendBetaWelcomeEmailViaEmailJs(emailJs, {
          email,
          roleLabel,
          siteUrl: getBetaSiteUrl(),
        });
        emailSent = true;
        await docRef.update({
          welcome_email_sent: true,
          welcome_email_sent_at: admin.firestore.FieldValue.serverTimestamp(),
        });
      } catch (e) {
        emailError = e instanceof Error ? e.message : 'Envoi email impossible';
        console.error('[submitBetaWaitlist] email:', e);
      }
    } else {
      emailError =
        'EmailJS non configuré (beta.emailjs_service_id, template_id, public_key, private_key)';
      console.warn('[submitBetaWaitlist]', emailError);
    }

    res.status(200).json({
      ok: true,
      isNew,
      emailSent,
      emailError: emailSent ? undefined : emailError,
    });
  };
}
