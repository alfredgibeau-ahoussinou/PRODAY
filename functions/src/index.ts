import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();
const db = admin.firestore();

/** Document uploadé → notifier admin, forcer PENDING */
export const onProfileDocumentSubmit = functions.firestore
  .document('users/{uid}/documents/{docId}')
  .onCreate(async (_snap, context) => {
    const { uid } = context.params;
    await db.doc(`users/${uid}`).update({
      verification_status: 'PENDING',
      is_verified: false,
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
    });
    // TODO: email / Slack admin
  });

/** Callable admin — approuver ou rejeter un profil */
export const validateProfile = functions.https.onCall(async (data, context) => {
  if (!context.auth?.token?.admin) {
    throw new functions.https.HttpsError('permission-denied', 'Admin only');
  }
  const { uid, action, rejectionReason } = data as {
    uid: string;
    action: 'approve' | 'reject';
    rejectionReason?: string;
  };
  const verified = action === 'approve';
  await db.doc(`users/${uid}`).update({
    is_verified: verified,
    verification_status: verified ? 'VERIFIED' : 'REJECTED',
    verification_date: admin.firestore.FieldValue.serverTimestamp(),
  });
  // TODO: FCM push au user
  return { success: true };
});

/** Nouveau tournoi → agents dans un rayon de 50 km (géofencing côté requête) */
export const onTournamentCreated = functions.firestore
  .document('tournaments/{tournamentId}')
  .onCreate(async (snap) => {
    const t = snap.data();
    const agents = await db.collection('users').where('role', '==', 'agent').get();
    // En prod : filtrer par distance Haversine ou GeoFirestore
    console.log(`Tournament ${snap.id} created near ${t.city}, notify ${agents.size} agents`);
  });

/** Fin de tournoi — trophées + notification abonnés */
export const submitTournamentAwards = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Sign in required');
  }
  const { tournamentId, bestPlayer, topScorer, bestGoalkeeper } = data;
  await db.doc(`tournaments/${tournamentId}`).update({
    awards: { best_player: bestPlayer, top_scorer: topScorer, best_goalkeeper: bestGoalkeeper },
    status: 'FINISHED',
  });
  // TODO: push "Félicitations à [Nom], élu meilleur gardien..."
  return { success: true };
});
