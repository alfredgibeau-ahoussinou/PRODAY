import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { generateBetaAccessToken } from './betaAccessToken';
import { sendIosPreAnnouncementAfterSignup } from './betaIosCampaign';
import { BETA_ROLE_LABELS, isBetaRoleId } from './betaWaitlistEmail';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'https://proday75.fr',
  'https://www.proday75.fr',
  'https://proday.app',
  'https://www.proday.app',
  'https://proday75.netlify.app',
];

function setCors(req: functions.https.Request, res: functions.Response): boolean {
  const origin = req.get('Origin') ?? '';
  if (
    origin &&
    (ALLOWED_ORIGINS.includes(origin) ||
      origin.endsWith('.netlify.app'))
  ) {
    res.set('Access-Control-Allow-Origin', origin);
  }
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  return req.method === 'OPTIONS';
}

/** Inscription bêta depuis le site vitrine — Firestore, validation admin requise avant accès. */
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

    const body = (req.body ?? {}) as { email?: string; role?: string; referral_code?: string };
    const email = String(body.email ?? '')
      .trim()
      .toLowerCase();
    const role = String(body.role ?? 'player').trim();
    const referralCode = String(body.referral_code ?? '')
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .slice(0, 12);

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
    let status: 'pending' | 'approved' | 'rejected' = 'pending';

    if (existing.empty) {
      const accessToken = generateBetaAccessToken();
      docRef = db.collection('beta_waitlist').doc();
      await docRef.set({
        email,
        role,
        role_label: roleLabel,
        access_token: accessToken,
        status: 'pending',
        source: 'website',
        welcome_email_sent: false,
        ...(referralCode.length >= 6 ? { referral_code: referralCode } : {}),
        created_at: now,
        updated_at: now,
      });
      isNew = true;
      status = 'pending';
      void sendIosPreAnnouncementAfterSignup(db, docRef).catch((err) => {
        console.error('[submitBetaWaitlist] pre-announcement email:', err);
      });
    } else {
      docRef = existing.docs[0].ref;
      const existingData = existing.docs[0].data();
      const existingStatus = existingData.status;
      status =
        existingStatus === 'approved' || existingStatus === 'rejected'
          ? existingStatus
          : 'pending';
      const accessToken =
        typeof existingData.access_token === 'string' && existingData.access_token.trim()
          ? existingData.access_token.trim()
          : generateBetaAccessToken();
      await docRef.update({
        role,
        role_label: roleLabel,
        access_token: accessToken,
        ...(referralCode.length >= 6 ? { referral_code: referralCode } : {}),
        updated_at: now,
      });
      void sendIosPreAnnouncementAfterSignup(db, docRef).catch((err) => {
        console.error('[submitBetaWaitlist] pre-announcement email:', err);
      });
    }

    res.status(200).json({
      ok: true,
      isNew,
      status,
      emailSent: false,
      message:
        status === 'approved'
          ? 'Inscription déjà validée — consultez votre email.'
          : 'Inscription enregistrée. Vous serez contacté après validation par l\'équipe ProDay.',
    });
  };
}
