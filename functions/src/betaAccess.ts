import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { isBetaEntryApproved } from './betaWaitlistStatus';

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
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  return req.method === 'OPTIONS';
}

/** Valide un jeton d'accès bêta (Firestore) — appelé par le site Next.js. */
export function createValidateBetaAccessHandler(db: admin.firestore.Firestore) {
  return async (req: functions.https.Request, res: functions.Response): Promise<void> => {
    if (setCors(req, res)) {
      res.status(204).send('');
      return;
    }

    if (req.method !== 'GET' && req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    const token = String(
      req.query.token ?? (req.body as { token?: string } | undefined)?.token ?? '',
    ).trim();

    if (!token || token.startsWith('v1.')) {
      res.status(400).json({ error: 'Token invalide' });
      return;
    }

    const snap = await db
      .collection('beta_waitlist')
      .where('access_token', '==', token)
      .limit(1)
      .get();

    if (snap.empty) {
      res.status(403).json({ error: 'Accès refusé' });
      return;
    }

    const doc = snap.docs[0];
    const data = doc.data();

    if (!isBetaEntryApproved(data)) {
      res.status(403).json({ error: 'Accès en attente de validation' });
      return;
    }

    await doc.ref.update({
      last_beta_access_at: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.status(200).json({
      ok: true,
      email: String(data.email ?? ''),
      role: String(data.role ?? 'player'),
      roleLabel: String(data.role_label ?? ''),
    });
  };
}
