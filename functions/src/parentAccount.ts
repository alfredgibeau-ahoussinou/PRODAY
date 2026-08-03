/**
 * Provisionnement du compte Parent à l’inscription d’un mineur.
 * - Crée un Auth user distinct (parent_uid ≠ child_uid)
 * - Écrit users/{parentUid} avec role=parent + parent_of
 * - Lie parental_settings.parent_uid sur l’enfant
 * - Envoie un e-mail « définir mon mot de passe » (Brevo / transport auth)
 */
import * as functions from 'firebase-functions';
import * as crypto from 'crypto';
import { admin } from './firebaseAdmin';
import { renderAuthEmailTemplate } from './authEmailTemplates';
import {
  hasAuthEmailTransport,
  isAuthCustomEmailEnabled,
  sendAuthEmail,
} from './authEmailTransport';
import { configStr } from './runtimeConfig';

const APP_NAME = 'ProDay';
const IOS_BUNDLE_ID = 'com.proday.app';
const ANDROID_PACKAGE = 'com.proday.app';

function normalizeEmail(email: unknown): string {
  return typeof email === 'string' ? email.trim().toLowerCase() : '';
}

function getContinueUrl(): string {
  const explicit = configStr('auth', 'continue_url', ['AUTH_CONTINUE_URL']);
  if (explicit) return explicit;
  const siteUrl = configStr('beta', 'site_url', ['BETA_SITE_URL']);
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

function randomPassword(): string {
  return crypto.randomBytes(24).toString('base64url');
}

async function sendParentSetPasswordEmail(
  email: string,
  displayName: string,
  childName: string,
): Promise<boolean> {
  if (!isAuthCustomEmailEnabled() || !hasAuthEmailTransport()) {
    // Fallback Firebase Auth native (sans branding parent) — le lien set-password existe quand même.
    try {
      await admin.auth().generatePasswordResetLink(email, actionCodeSettings());
    } catch (e) {
      console.warn('[parentAccount] generatePasswordResetLink failed:', e);
    }
    return false;
  }

  const link = await admin.auth().generatePasswordResetLink(email, actionCodeSettings());
  const { subject, html, text } = renderAuthEmailTemplate('password-reset', {
    link,
    email,
    appName: APP_NAME,
    displayName,
  });

  const parentSubject = `Activez votre espace Parent ProDay — ${childName}`;
  const intro = `Un compte Parent ProDay a été créé pour superviser ${childName}. Définissez votre mot de passe pour vous connecter.`;
  const htmlWithIntro = html.replace(
    'Une demande de réinitialisation a été faite pour le compte',
    intro + ' Compte',
  );

  try {
    await sendAuthEmail(
      { to: email, subject: parentSubject || subject, html: htmlWithIntro, text: `${intro}\n\n${text}` },
      link,
      { displayName, kind: 'password-reset' },
    );
    return true;
  } catch (e) {
    console.error('[parentAccount] send parent invite email failed:', e);
    return false;
  }
}

export type ProvisionParentResult = {
  parentUid: string;
  created: boolean;
  emailSent: boolean;
  linked: boolean;
};

/**
 * Crée ou réutilise le compte parent, lie l’enfant, envoie l’e-mail set-password.
 */
export async function provisionParentForMinorUser(
  childUid: string,
  childData: admin.firestore.DocumentData,
): Promise<ProvisionParentResult | null> {
  const parental = (childData.parental_settings ?? {}) as Record<string, unknown>;
  if (parental.is_minor !== true) return null;

  const guardianEmail = normalizeEmail(parental.guardian_email);
  if (!guardianEmail || !guardianEmail.includes('@')) {
    console.warn('[parentAccount] missing guardian_email for minor', childUid);
    return null;
  }

  // Ne jamais lier un parent à lui-même
  const childEmail = normalizeEmail(childData.email);
  if (childEmail && childEmail === guardianEmail) {
    console.warn('[parentAccount] guardian email equals child email — skip', childUid);
    return null;
  }

  const db = admin.firestore();
  const guardianName =
    typeof parental.guardian_name === 'string' && parental.guardian_name.trim()
      ? parental.guardian_name.trim()
      : 'Parent';
  const childName =
    typeof childData.display_name === 'string' && childData.display_name.trim()
      ? childData.display_name.trim()
      : 'votre enfant';

  let parentUid: string | null =
    typeof parental.parent_uid === 'string' && parental.parent_uid ? parental.parent_uid : null;
  let created = false;
  let emailSent = false;

  if (!parentUid) {
    try {
      const existing = await admin.auth().getUserByEmail(guardianEmail);
      parentUid = existing.uid;
    } catch {
      const userRecord = await admin.auth().createUser({
        email: guardianEmail,
        password: randomPassword(),
        displayName: guardianName,
        emailVerified: true,
      });
      parentUid = userRecord.uid;
      created = true;
    }
  }

  if (!parentUid || parentUid === childUid) {
    console.error('[parentAccount] invalid parentUid', { parentUid, childUid });
    return null;
  }

  const parentRef = db.doc(`users/${parentUid}`);
  const parentSnap = await parentRef.get();

  if (!parentSnap.exists) {
    await parentRef.set({
      display_name: guardianName,
      email: guardianEmail,
      role: 'parent',
      product_line: 'parent',
      is_verified: true,
      verification_status: 'NOT_REQUIRED',
      email_verified: false,
      is_active: true,
      parent_of: [childUid],
      profile: { job_title: 'Parent' },
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
    });
    created = true;
  } else {
    const existingRole = parentSnap.data()?.role;
    const parentOf: string[] = Array.isArray(parentSnap.data()?.parent_of)
      ? [...parentSnap.data()!.parent_of]
      : [];
    if (!parentOf.includes(childUid)) parentOf.push(childUid);

    const patch: Record<string, unknown> = {
      parent_of: parentOf,
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
    };
    // Ne pas écraser un compte joueur/staff existant en « parent » — on lie seulement.
    // Si le doc n’a pas de rôle métier fort, ou est déjà parent, on force le portail parent.
    if (existingRole === 'parent' || !existingRole) {
      patch.role = 'parent';
      patch.product_line = 'parent';
      patch.display_name = parentSnap.data()?.display_name || guardianName;
    }
    await parentRef.set(patch, { merge: true });
  }

  // Lien côté enfant (Admin SDK — bypass rules)
  const nextParental = {
    ...parental,
    is_minor: true,
    guardian_email: guardianEmail,
    guardian_name: guardianName,
    parent_uid: parentUid,
    supervision_enabled: parental.supervision_enabled !== false,
    contacts_filter_enabled: parental.contacts_filter_enabled !== false,
    messaging_restricted: parental.messaging_restricted !== false,
    privacy: {
      share_live_carpool: true,
      parent_can_read_messages: true,
      ...((parental.privacy as Record<string, unknown>) ?? {}),
    },
  };

  await db.doc(`users/${childUid}`).set(
    {
      parental_settings: nextParental,
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true },
  );

  // E-mail set-password uniquement si compte Auth nouvellement créé, ou pas encore de mot de passe défini via invite.
  if (created) {
    emailSent = await sendParentSetPasswordEmail(guardianEmail, guardianName, childName);
  } else {
    // Compte existant : rappeler le lien set-password / connexion
    emailSent = await sendParentSetPasswordEmail(guardianEmail, guardianName, childName);
  }

  return { parentUid, created, emailSent, linked: true };
}

/** Trigger : inscription mineur → provision parent. */
export const onMinorUserCreatedProvisionParent = functions.firestore
  .document('users/{uid}')
  .onCreate(async (snap, context) => {
    const data = snap.data();
    if (!data) return;
    try {
      const result = await provisionParentForMinorUser(context.params.uid, data);
      if (result) {
        console.log('[parentAccount] provisioned', context.params.uid, result);
      }
    } catch (e) {
      console.error('[parentAccount] onCreate failed', context.params.uid, e);
    }
  });

/**
 * Callable : le mineur (ou admin) peut relancer la provision / l’e-mail.
 * data: { childUid?: string } — défaut = auth.uid
 */
export const provisionParentAccount = functions.https.onCall(async (data, context) => {
  if (!context.auth?.uid) {
    throw new functions.https.HttpsError('unauthenticated', 'Connexion requise');
  }
  const childUid =
    typeof data?.childUid === 'string' && data.childUid.trim()
      ? data.childUid.trim()
      : context.auth.uid;

  const isAdmin = context.auth.token.admin === true;
  if (childUid !== context.auth.uid && !isAdmin) {
    throw new functions.https.HttpsError('permission-denied', 'Accès refusé');
  }

  const snap = await admin.firestore().doc(`users/${childUid}`).get();
  if (!snap.exists) {
    throw new functions.https.HttpsError('not-found', 'Compte introuvable');
  }

  const result = await provisionParentForMinorUser(childUid, snap.data()!);
  if (!result) {
    throw new functions.https.HttpsError(
      'failed-precondition',
      'Ce compte n’est pas un mineur avec e-mail parent valide.',
    );
  }
  return result;
});
