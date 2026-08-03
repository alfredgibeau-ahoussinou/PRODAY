import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import {
  REFERRAL_REQUIRED_FOR_REWARD,
  REFERRAL_REWARD_MONTHS,
  extendSubscriptionPeriodEnd,
  generateReferralCode,
  isReferralEligibleRole,
  isValidReferralCodeFormat,
  nextReferralProgress,
  normalizeReferralCode,
  referralDocId,
} from './referralLogic';

const db = admin.firestore();

const MAX_CODE_ATTEMPTS = 8;

async function allocateUniqueReferralCode(
  tx: admin.firestore.Transaction,
  uid: string
): Promise<string> {
  for (let attempt = 0; attempt < MAX_CODE_ATTEMPTS; attempt += 1) {
    const code = generateReferralCode();
    const codeRef = db.collection('referral_codes').doc(code);
    const snap = await tx.get(codeRef);
    if (!snap.exists) {
      tx.set(codeRef, {
        uid,
        created_at: admin.firestore.FieldValue.serverTimestamp(),
      });
      return code;
    }
  }
  throw new functions.https.HttpsError(
    'resource-exhausted',
    'Impossible de générer un code de parrainage unique.'
  );
}

/** Assure un code unique pour l’utilisateur connecté. */
export const ensureReferralCode = functions.https.onCall(async (_data, context) => {
  if (!context.auth?.uid) {
    throw new functions.https.HttpsError('unauthenticated', 'Connexion requise');
  }
  const uid = context.auth.uid;
  const userRef = db.doc(`users/${uid}`);

  const code = await db.runTransaction(async (tx) => {
    const userSnap = await tx.get(userRef);
    if (!userSnap.exists) {
      throw new functions.https.HttpsError('not-found', 'Profil introuvable');
    }
    const data = userSnap.data() ?? {};
    const existing = normalizeReferralCode(String(data.referral_code ?? ''));
    if (existing && isValidReferralCodeFormat(existing)) {
      const codeRef = db.collection('referral_codes').doc(existing);
      const codeSnap = await tx.get(codeRef);
      if (!codeSnap.exists) {
        tx.set(codeRef, {
          uid,
          created_at: admin.firestore.FieldValue.serverTimestamp(),
        });
      }
      return existing;
    }

    const role = String(data.role ?? '');
    if (!isReferralEligibleRole(role)) {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'Le parrainage n’est pas disponible pour ce rôle.'
      );
    }

    const allocated = await allocateUniqueReferralCode(tx, uid);
    tx.update(userRef, {
      referral_code: allocated,
      referral_progress: typeof data.referral_progress === 'number' ? data.referral_progress : 0,
      referral_total_subscribed:
        typeof data.referral_total_subscribed === 'number' ? data.referral_total_subscribed : 0,
      referral_rewards_earned:
        typeof data.referral_rewards_earned === 'number' ? data.referral_rewards_earned : 0,
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
    });
    return allocated;
  });

  return {
    ok: true,
    referral_code: code,
    referral_link: `https://proday75.fr/?ref=${encodeURIComponent(code)}`,
  };
});

type ClaimPayload = { code?: string };

/** Lie le compte courant à un parrain (une seule fois, à l’inscription). */
export const claimReferralCode = functions.https.onCall(
  async (data: ClaimPayload, context) => {
    if (!context.auth?.uid) {
      throw new functions.https.HttpsError('unauthenticated', 'Connexion requise');
    }
    const inviteeUid = context.auth.uid;
    const code = normalizeReferralCode(String(data.code ?? ''));
    if (!isValidReferralCodeFormat(code)) {
      throw new functions.https.HttpsError('invalid-argument', 'Code de parrainage invalide');
    }

    await db.runTransaction(async (tx) => {
      const inviteeRef = db.doc(`users/${inviteeUid}`);
      const inviteeSnap = await tx.get(inviteeRef);
      if (!inviteeSnap.exists) {
        throw new functions.https.HttpsError('not-found', 'Profil introuvable');
      }
      const invitee = inviteeSnap.data() ?? {};
      if (invitee.referred_by_uid) {
        throw new functions.https.HttpsError(
          'already-exists',
          'Ce compte a déjà un parrain.'
        );
      }
      if (!isReferralEligibleRole(String(invitee.role ?? ''))) {
        throw new functions.https.HttpsError(
          'failed-precondition',
          'Le parrainage n’est pas disponible pour ce rôle.'
        );
      }

      const codeSnap = await tx.get(db.collection('referral_codes').doc(code));
      if (!codeSnap.exists) {
        throw new functions.https.HttpsError('not-found', 'Code de parrainage inconnu');
      }
      const referrerUid = String(codeSnap.data()?.uid ?? '');
      if (!referrerUid) {
        throw new functions.https.HttpsError('not-found', 'Code de parrainage inconnu');
      }
      if (referrerUid === inviteeUid) {
        throw new functions.https.HttpsError(
          'invalid-argument',
          'Vous ne pouvez pas utiliser votre propre code.'
        );
      }

      const referrerSnap = await tx.get(db.doc(`users/${referrerUid}`));
      if (!referrerSnap.exists) {
        throw new functions.https.HttpsError('not-found', 'Parrain introuvable');
      }
      const referrer = referrerSnap.data() ?? {};
      if (!isReferralEligibleRole(String(referrer.role ?? ''))) {
        throw new functions.https.HttpsError(
          'failed-precondition',
          'Ce parrain n’est pas éligible.'
        );
      }

      const refId = referralDocId(referrerUid, inviteeUid);
      const referralRef = db.collection('referrals').doc(refId);
      const existingReferral = await tx.get(referralRef);
      if (existingReferral.exists) {
        throw new functions.https.HttpsError('already-exists', 'Parrainage déjà enregistré');
      }

      tx.set(referralRef, {
        referrer_uid: referrerUid,
        invitee_uid: inviteeUid,
        referral_code: code,
        invitee_role: invitee.role ?? null,
        invitee_display_name: invitee.display_name ?? null,
        status: 'signed_up',
        created_at: admin.firestore.FieldValue.serverTimestamp(),
        subscribed_at: null,
      });
      tx.update(inviteeRef, {
        referred_by_uid: referrerUid,
        referred_by_code: code,
        updated_at: admin.firestore.FieldValue.serverTimestamp(),
      });
    });

    return { ok: true, message: 'Code de parrainage enregistré.' };
  }
);

/**
 * Après activation IAP : si l’utilisateur est filleul et passe en abonné,
 * incrémente le compteur du parrain et accorde 1 mois gratuit tous les 2 filleuls.
 */
export async function processReferralOnSubscribe(inviteeUid: string): Promise<{
  processed: boolean;
  rewardGranted?: boolean;
}> {
  const inviteeRef = db.doc(`users/${inviteeUid}`);
  const inviteeSnap = await inviteeRef.get();
  if (!inviteeSnap.exists) return { processed: false };
  const invitee = inviteeSnap.data() ?? {};
  const referrerUid = String(invitee.referred_by_uid ?? '');
  if (!referrerUid) return { processed: false };

  const refId = referralDocId(referrerUid, inviteeUid);
  const referralRef = db.collection('referrals').doc(refId);
  const referrerRef = db.doc(`users/${referrerUid}`);

  return db.runTransaction(async (tx) => {
    const [referralSnap, referrerSnap] = await Promise.all([
      tx.get(referralRef),
      tx.get(referrerRef),
    ]);

    if (!referralSnap.exists || !referrerSnap.exists) {
      return { processed: false };
    }
    const referral = referralSnap.data() ?? {};
    if (referral.status === 'subscribed') {
      return { processed: true, rewardGranted: false };
    }

    const referrer = referrerSnap.data() ?? {};
    const currentProgress =
      typeof referrer.referral_progress === 'number' ? referrer.referral_progress : 0;
    const { progress, rewardEarned } = nextReferralProgress(currentProgress);
    const totalSubscribed =
      (typeof referrer.referral_total_subscribed === 'number'
        ? referrer.referral_total_subscribed
        : 0) + 1;
    const rewardsEarned =
      (typeof referrer.referral_rewards_earned === 'number'
        ? referrer.referral_rewards_earned
        : 0) + (rewardEarned ? 1 : 0);

    tx.update(referralRef, {
      status: 'subscribed',
      subscribed_at: admin.firestore.FieldValue.serverTimestamp(),
      invitee_role: invitee.role ?? referral.invitee_role ?? null,
      invitee_display_name: invitee.display_name ?? referral.invitee_display_name ?? null,
    });

    const referrerUpdate: Record<string, unknown> = {
      referral_progress: progress,
      referral_total_subscribed: totalSubscribed,
      referral_rewards_earned: rewardsEarned,
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (rewardEarned) {
      const now = new Date();
      const periodBefore = referrer.subscription_period_end ?? null;
      const periodAfter = extendSubscriptionPeriodEnd(periodBefore, now, REFERRAL_REWARD_MONTHS);
      referrerUpdate.subscription_tier = 'pro';
      referrerUpdate.subscription_status = 'active';
      referrerUpdate.subscription_period_end = periodAfter.toISOString();

      const rewardRef = referrerRef.collection('referral_rewards').doc();
      tx.set(rewardRef, {
        months_granted: REFERRAL_REWARD_MONTHS,
        invitee_uid: inviteeUid,
        progress_reset_from: REFERRAL_REQUIRED_FOR_REWARD,
        period_end_before: periodBefore ?? null,
        period_end_after: periodAfter.toISOString(),
        created_at: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    tx.update(referrerRef, referrerUpdate);
    return { processed: true, rewardGranted: rewardEarned };
  });
}
