import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.firestore();

/** Aligné sur src/utils/agentLaunchPricing.ts */
export const AGENT_LAUNCH_SEAT_LIMIT = 20;
export const AGENT_LAUNCH_CONFIG_PATH = 'platform_config/agent_launch';

export type AgentLaunchClaimResult = {
  ok: boolean;
  tier: 'launch' | 'standard';
  monthlyEur: number;
  seatsUsed: number;
  seatsRemaining: number;
  grandfathered: boolean;
};

/**
 * Attribue un siège offre lancement (19,99 €) de façon atomique.
 * Au-delà de 20, renvoie le tarif standard 29,99 €.
 */
export async function claimAgentLaunchSeatInTransaction(
  uid: string,
): Promise<AgentLaunchClaimResult> {
  const userRef = db.doc(`users/${uid}`);
  const configRef = db.doc(AGENT_LAUNCH_CONFIG_PATH);

  return db.runTransaction(async (tx) => {
    const [userSnap, configSnap] = await Promise.all([tx.get(userRef), tx.get(configRef)]);
    if (!userSnap.exists) {
      throw new functions.https.HttpsError('not-found', 'Profil introuvable.');
    }
    const user = userSnap.data() ?? {};
    if (user.role !== 'agent') {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'Offre réservée aux comptes agent.',
      );
    }

    if (user.agent_launch_offer === true) {
      const seatsUsed = Number(configSnap.data()?.seats_used ?? 0);
      return {
        ok: true,
        tier: 'launch' as const,
        monthlyEur: 19.99,
        seatsUsed,
        seatsRemaining: Math.max(0, AGENT_LAUNCH_SEAT_LIMIT - seatsUsed),
        grandfathered: true,
      };
    }

    const seatsUsed = Number(configSnap.data()?.seats_used ?? 0);
    if (seatsUsed < AGENT_LAUNCH_SEAT_LIMIT) {
      const next = seatsUsed + 1;
      tx.set(
        configRef,
        {
          seats_used: next,
          seat_limit: AGENT_LAUNCH_SEAT_LIMIT,
          launch_monthly_eur: 19.99,
          standard_monthly_eur: 29.99,
          updated_at: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
      tx.update(userRef, {
        agent_launch_offer: true,
        updated_at: admin.firestore.FieldValue.serverTimestamp(),
      });
      return {
        ok: true,
        tier: 'launch' as const,
        monthlyEur: 19.99,
        seatsUsed: next,
        seatsRemaining: Math.max(0, AGENT_LAUNCH_SEAT_LIMIT - next),
        grandfathered: false,
      };
    }

    return {
      ok: true,
      tier: 'standard' as const,
      monthlyEur: 29.99,
      seatsUsed,
      seatsRemaining: 0,
      grandfathered: false,
    };
  });
}

/** Callable — réservation siège agent (avant / pendant activation abonnement). */
export const claimAgentLaunchSeat = functions.https.onCall(async (_data, context) => {
  if (!context.auth?.uid) {
    throw new functions.https.HttpsError('unauthenticated', 'Connexion requise');
  }
  return claimAgentLaunchSeatInTransaction(context.auth.uid);
});
