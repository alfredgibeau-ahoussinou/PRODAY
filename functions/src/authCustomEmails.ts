import * as functions from 'firebase-functions';
import { admin } from './firebaseAdmin';
import { renderAuthEmailTemplate } from './authEmailTemplates';
import {
  getAuthEmailTransportConfig,
  isAuthCustomEmailEnabled,
  sendAuthEmailViaResend,
} from './authEmailTransport';

const APP_NAME = 'ProDay';
const IOS_BUNDLE_ID = 'com.proday.app';
const ANDROID_PACKAGE = 'com.proday.app';

const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMIT_MAX = 5;

type AuthEmailCallableResult = {
  enabled: boolean;
  sent: boolean;
};

function getContinueUrl(): string {
  const authCfg = functions.config().auth ?? {};
  const betaCfg = functions.config().beta ?? {};
  const explicit = (authCfg.continue_url as string | undefined)?.trim();
  if (explicit) return explicit;

  const siteUrl = (betaCfg.site_url as string | undefined)?.trim();
  if (siteUrl) return siteUrl;

  return 'https://proday75.fr';
}

function actionCodeSettings() {
  return {
    url: getContinueUrl(),
    handleCodeInApp: true,
    iOS: { bundleId: IOS_BUNDLE_ID },
    android: {
      packageName: ANDROID_PACKAGE,
      installApp: true,
      minimumVersion: '1',
    },
  };
}

function rateLimitDocId(scope: string, key: string): string {
  return Buffer.from(`${scope}:${key}`.slice(0, 200)).toString('base64url').slice(0, 120);
}

async function assertAuthEmailRateLimit(scope: string, key: string): Promise<boolean> {
  const db = admin.firestore();
  const rateRef = db.doc(`auth_email_rate/${rateLimitDocId(scope, key)}`);
  const now = Date.now();
  const snap = await rateRef.get();

  if (!snap.exists) {
    await rateRef.set({
      count: 1,
      window_start: admin.firestore.Timestamp.fromMillis(now),
    });
    return true;
  }

  const data = snap.data()!;
  const windowStart = (data.window_start as admin.firestore.Timestamp).toMillis();
  const count = Number(data.count ?? 0);

  if (now - windowStart >= RATE_LIMIT_WINDOW_MS) {
    await rateRef.set({
      count: 1,
      window_start: admin.firestore.Timestamp.fromMillis(now),
    });
    return true;
  }

  if (count >= RATE_LIMIT_MAX) return false;

  await rateRef.update({ count: admin.firestore.FieldValue.increment(1) });
  return true;
}

function disabledResult(): AuthEmailCallableResult {
  return { enabled: false, sent: false };
}

async function sendAuthActionEmail(
  kind: 'verification' | 'password-reset',
  email: string,
  displayName?: string
): Promise<AuthEmailCallableResult> {
  if (!isAuthCustomEmailEnabled()) return disabledResult();

  const transport = getAuthEmailTransportConfig();
  if (!transport) return disabledResult();

  const normalizedEmail = email.trim().toLowerCase();
  const link =
    kind === 'verification'
      ? await admin.auth().generateEmailVerificationLink(normalizedEmail, actionCodeSettings())
      : await admin.auth().generatePasswordResetLink(normalizedEmail, actionCodeSettings());

  const { subject, html, text } = renderAuthEmailTemplate(kind, {
    link,
    email: normalizedEmail,
    appName: APP_NAME,
    displayName,
  });

  await sendAuthEmailViaResend(transport, {
    to: normalizedEmail,
    subject,
    html,
    text,
  });

  return { enabled: true, sent: true };
}

/**
 * E-mail de vérification ProDay (HTML brandé) — remplace sendEmailVerification() côté client.
 * Nécessite une session Firebase active (inscription ou renvoi).
 */
export const sendAuthVerificationEmail = functions
  .region('europe-west1')
  .https.onCall(async (_data, context): Promise<AuthEmailCallableResult> => {
    if (!context.auth?.uid) {
      throw new functions.https.HttpsError('unauthenticated', 'Connexion requise');
    }

    const uid = context.auth.uid;
    const allowed = await assertAuthEmailRateLimit('verification', uid);
    if (!allowed) {
      throw new functions.https.HttpsError(
        'resource-exhausted',
        'Trop de demandes. Réessayez dans quelques minutes.'
      );
    }

    const user = await admin.auth().getUser(uid);
    const email = user.email?.trim();
    if (!email) {
      throw new functions.https.HttpsError('failed-precondition', 'Aucune adresse e-mail sur ce compte');
    }
    if (user.emailVerified) {
      return { enabled: isAuthCustomEmailEnabled(), sent: false };
    }

    try {
      return await sendAuthActionEmail('verification', email, user.displayName ?? undefined);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes('TOO_MANY_ATTEMPTS') || msg.includes('TOO_MANY_ATTEMPTS_TRY_LATER')) {
        throw new functions.https.HttpsError(
          'resource-exhausted',
          'Trop de tentatives. Attendez 15 à 60 minutes avant un nouvel envoi.'
        );
      }
      console.error('[sendAuthVerificationEmail]', e);
      throw new functions.https.HttpsError(
        'internal',
        e instanceof Error ? e.message : 'Envoi e-mail impossible'
      );
    }
  });

/**
 * E-mail de réinitialisation ProDay (HTML brandé) — remplace sendPasswordResetEmail() côté client.
 * Ne révèle pas si l'adresse existe (comportement identique à Firebase Auth).
 */
export const sendAuthPasswordResetEmail = functions
  .region('europe-west1')
  .https.onCall(async (data, context): Promise<AuthEmailCallableResult> => {
    const email = String((data as { email?: string })?.email ?? '')
      .trim()
      .toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new functions.https.HttpsError('invalid-argument', 'E-mail invalide');
    }

    const ip = context.rawRequest?.ip ?? 'unknown';
    const allowed = await assertAuthEmailRateLimit('password-reset', `${ip}:${email}`);
    if (!allowed) {
      throw new functions.https.HttpsError(
        'resource-exhausted',
        'Trop de demandes. Réessayez dans quelques minutes.'
      );
    }

    if (!isAuthCustomEmailEnabled()) return disabledResult();

    try {
      try {
        await admin.auth().getUserByEmail(email);
      } catch {
        // Ne pas révéler l'absence de compte
        return { enabled: true, sent: true };
      }

      return await sendAuthActionEmail('password-reset', email);
    } catch (e) {
      console.error('[sendAuthPasswordResetEmail]', e);
      throw new functions.https.HttpsError(
        'internal',
        e instanceof Error ? e.message : 'Envoi e-mail impossible'
      );
    }
  });
