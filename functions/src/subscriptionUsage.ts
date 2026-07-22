import * as functions from 'firebase-functions';
import { admin } from './firebaseAdmin';

const db = admin.firestore();

type UsageFeature =
  | 'mercato_apply'
  | 'recruitment_message'
  | 'sponsor_club_message';

const SPONSOR_DISCOVERY_MESSAGES = 10;

function currentUsagePeriod(date = new Date()): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

function usageField(feature: UsageFeature): string {
  if (feature === 'mercato_apply') return 'mercato_applications';
  if (feature === 'recruitment_message') return 'recruitment_messages';
  return 'sponsor_club_messages';
}

function mercatoLimitForRole(role: string): number {
  if (role === 'player') return 1;
  if (role === 'coach' || role === 'recruiter') return 5;
  return Infinity;
}

function recruitmentLimitForRole(role: string): number {
  if (role === 'coach') return 5;
  if (role === 'recruiter') return 10;
  return Infinity;
}

function sponsorMessagingUnlimited(data: FirebaseFirestore.DocumentData): boolean {
  return data.role === 'sponsor' && (
    data.subscription_tier === 'pro' || data.sponsor_tier === 'territorial'
  );
}

/** Incrémente un quota abonnement côté serveur (anti-triche Firestore). */
export const incrementSubscriptionUsage = functions
  .region('europe-west1')
  .https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Connexion requise.');
    }

    const feature = String(data?.feature ?? '') as UsageFeature;
    if (!['mercato_apply', 'recruitment_message', 'sponsor_club_message'].includes(feature)) {
      throw new functions.https.HttpsError('invalid-argument', 'Quota inconnu.');
    }

    const uid = context.auth.uid;
    const userSnap = await db.doc(`users/${uid}`).get();
    if (!userSnap.exists) {
      throw new functions.https.HttpsError('not-found', 'Profil introuvable.');
    }

    const user = userSnap.data()!;
    const role = String(user.role ?? '');
    const tier = user.subscription_tier === 'pro' ? 'pro' : 'free';

    if (tier === 'pro') {
      return { ok: true, skipped: true };
    }

    const period = currentUsagePeriod();
    const usageRef = db.doc(`users/${uid}/subscription_usage/${period}`);
    const field = usageField(feature);

    await db.runTransaction(async (tx) => {
      const usageSnap = await tx.get(usageRef);
      const current = Number(usageSnap.data()?.[field] ?? 0);

      if (feature === 'sponsor_club_message') {
        if (role !== 'sponsor') return;
        if (sponsorMessagingUnlimited(user)) return;
        if (current >= SPONSOR_DISCOVERY_MESSAGES) {
          throw new functions.https.HttpsError(
            'resource-exhausted',
            `Limite gratuite : ${SPONSOR_DISCOVERY_MESSAGES} messages clubs par mois.`,
          );
        }
      }

      if (feature === 'mercato_apply') {
        const limit = mercatoLimitForRole(role);
        if (Number.isFinite(limit) && current >= limit) {
          throw new functions.https.HttpsError(
            'resource-exhausted',
            `Limite gratuite : ${limit} candidature(s) Mercato par mois.`,
          );
        }
      }

      if (feature === 'recruitment_message') {
        const limit = recruitmentLimitForRole(role);
        if (Number.isFinite(limit) && current >= limit) {
          throw new functions.https.HttpsError(
            'resource-exhausted',
            `Limite gratuite : ${limit} messages recrutement par mois.`,
          );
        }
      }

      tx.set(
        usageRef,
        {
          period,
          [field]: current + 1,
          updated_at: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
    });

    return { ok: true };
  });
