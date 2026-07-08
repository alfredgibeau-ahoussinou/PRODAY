import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { generateBetaAccessToken } from './betaAccessToken';
import { BETA_ROLE_LABELS, isBetaRoleId } from './betaWaitlistEmail';
import { markWelcomeEmailSent, sendBetaWelcomeEmailToEntry } from './betaWaitlistMail';
import { resolveBetaWaitlistStatus } from './betaWaitlistStatus';

function assertAdmin(context: functions.https.CallableContext): string {
  if (!context.auth?.token?.admin) {
    throw new functions.https.HttpsError('permission-denied', 'Admin only');
  }
  return context.auth.uid;
}

async function loadBetaEntry(
  db: admin.firestore.Firestore,
  entryId: string,
): Promise<{ ref: admin.firestore.DocumentReference; data: admin.firestore.DocumentData }> {
  const ref = db.collection('beta_waitlist').doc(entryId);
  const snap = await ref.get();
  if (!snap.exists) {
    throw new functions.https.HttpsError('not-found', 'Inscription introuvable');
  }
  return { ref, data: snap.data()! };
}

function resolveAccessToken(data: admin.firestore.DocumentData): string {
  const existing =
    typeof data.access_token === 'string' && data.access_token.trim()
      ? data.access_token.trim()
      : '';
  return existing || generateBetaAccessToken();
}

function resolveRoleLabel(data: admin.firestore.DocumentData): string {
  if (typeof data.role_label === 'string' && data.role_label.trim()) {
    return data.role_label.trim();
  }
  const role = String(data.role ?? 'player');
  return isBetaRoleId(role) ? BETA_ROLE_LABELS[role] : role;
}

/** Approuve une inscription bêta et envoie l'email de bienvenue. */
export function createAdminApproveBetaAccessHandler(db: admin.firestore.Firestore) {
  return async (
    data: { entryId?: string },
    context: functions.https.CallableContext,
  ): Promise<{ success: boolean; emailSent: boolean; emailError?: string }> => {
    const adminUid = assertAdmin(context);
    const entryId = String(data.entryId ?? '').trim();
    if (!entryId) {
      throw new functions.https.HttpsError('invalid-argument', 'entryId requis');
    }

    const { ref, data: entry } = await loadBetaEntry(db, entryId);
    const status = resolveBetaWaitlistStatus(entry);
    if (status === 'rejected') {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'Inscription refusée — réactivez manuellement si besoin',
      );
    }

    const email = String(entry.email ?? '').trim().toLowerCase();
    if (!email) {
      throw new functions.https.HttpsError('failed-precondition', 'Email manquant');
    }

    const accessToken = resolveAccessToken(entry);
    const roleLabel = resolveRoleLabel(entry);
    const now = admin.firestore.FieldValue.serverTimestamp();

    await ref.update({
      status: 'approved',
      access_token: accessToken,
      approved_at: now,
      approved_by: adminUid,
      updated_at: now,
    });

    const { emailSent, emailError } = await sendBetaWelcomeEmailToEntry(
      email,
      roleLabel,
      accessToken,
    );

    if (emailSent) {
      await markWelcomeEmailSent(ref);
    }

    return { success: true, emailSent, emailError };
  };
}

/** Refuse une inscription bêta. */
export function createAdminRejectBetaAccessHandler(db: admin.firestore.Firestore) {
  return async (
    data: { entryId?: string },
    context: functions.https.CallableContext,
  ): Promise<{ success: boolean }> => {
    const adminUid = assertAdmin(context);
    const entryId = String(data.entryId ?? '').trim();
    if (!entryId) {
      throw new functions.https.HttpsError('invalid-argument', 'entryId requis');
    }

    const { ref } = await loadBetaEntry(db, entryId);
    const now = admin.firestore.FieldValue.serverTimestamp();

    await ref.update({
      status: 'rejected',
      rejected_at: now,
      rejected_by: adminUid,
      updated_at: now,
    });

    return { success: true };
  };
}

/** Renvoie l'email de bienvenue (inscription déjà approuvée). */
export function createAdminResendBetaWelcomeEmailHandler(db: admin.firestore.Firestore) {
  return async (
    data: { entryId?: string },
    context: functions.https.CallableContext,
  ): Promise<{ success: boolean; emailSent: boolean; emailError?: string }> => {
    assertAdmin(context);
    const entryId = String(data.entryId ?? '').trim();
    if (!entryId) {
      throw new functions.https.HttpsError('invalid-argument', 'entryId requis');
    }

    const { ref, data: entry } = await loadBetaEntry(db, entryId);
    const status = resolveBetaWaitlistStatus(entry);
    if (status !== 'approved') {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'Approuvez l\'inscription avant de renvoyer l\'email',
      );
    }

    const email = String(entry.email ?? '').trim().toLowerCase();
    const accessToken = resolveAccessToken(entry);
    const roleLabel = resolveRoleLabel(entry);

    await ref.update({
      access_token: accessToken,
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
    });

    const { emailSent, emailError } = await sendBetaWelcomeEmailToEntry(
      email,
      roleLabel,
      accessToken,
    );

    if (emailSent) {
      await markWelcomeEmailSent(ref);
    }

    return { success: true, emailSent, emailError };
  };
}

/** Supprime une inscription bêta (révoque le jeton d'accès). */
export function createAdminDeleteBetaWaitlistEntryHandler(db: admin.firestore.Firestore) {
  return async (
    data: { entryId?: string },
    context: functions.https.CallableContext,
  ): Promise<{ success: boolean }> => {
    assertAdmin(context);
    const entryId = String(data.entryId ?? '').trim();
    if (!entryId) {
      throw new functions.https.HttpsError('invalid-argument', 'entryId requis');
    }

    const { ref } = await loadBetaEntry(db, entryId);
    await ref.delete();

    return { success: true };
  };
}
