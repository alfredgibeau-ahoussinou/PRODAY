import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { processScheduledEventReminders } from './eventReminders';
import { sendFcmToUser } from './messaging';
import { createPaymentCheckoutSession, stripeWebhook } from './stripePayments';
import { runMistralDocumentVerification } from './mistralVerification';
import { onPlatformFeedCreated, onChatMessageCreated } from './feedNotifications';

export { createPaymentCheckoutSession, stripeWebhook };
export { onPlatformFeedCreated, onChatMessageCreated };

admin.initializeApp();
const db = admin.firestore();

/** Document uploadé → PENDING + analyse Mistral IA */
export const onProfileDocumentSubmit = functions
  .runWith({ timeoutSeconds: 120, memory: '512MB' })
  .firestore.document('users/{uid}/documents/{docId}')
  .onCreate(async (_snap, context) => {
    const { uid, docId } = context.params;
    await db.doc(`users/${uid}`).update({
      verification_status: 'PENDING',
      is_verified: false,
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
    });
    try {
      await runMistralDocumentVerification(uid, docId);
    } catch (e) {
      console.error('[onProfileDocumentSubmit] mistral:', e);
    }
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
  const update: Record<string, unknown> = {
    is_verified: verified,
    verification_status: verified ? 'VERIFIED' : 'REJECTED',
    verification_date: admin.firestore.FieldValue.serverTimestamp(),
    updated_at: admin.firestore.FieldValue.serverTimestamp(),
  };
  if (!verified && rejectionReason?.trim()) {
    update.rejection_reason = rejectionReason.trim();
  } else if (verified) {
    update.rejection_reason = admin.firestore.FieldValue.delete();
  }
  await db.doc(`users/${uid}`).update(update);

  await sendFcmToUser(uid, {
    title: verified ? 'Profil vérifié' : 'Vérification refusée',
    body: verified
      ? 'Votre diplôme/licence est validé. Messagerie complète débloquée.'
      : 'Votre document a été refusé. Mettez à jour votre dossier dans Profil.',
  });

  return { success: true };
});

/** Nouveau tournoi → agents dans un rayon de 50 km (géofencing côté requête) */
export const onTournamentCreated = functions.firestore
  .document('tournaments/{tournamentId}')
  .onCreate(async (snap) => {
    const t = snap.data();
    const agents = await db.collection('users').where('role', '==', 'agent').get();
    console.log(`Tournament ${snap.id} created near ${t.city}, notify ${agents.size} agents`);
  });

/** Fin de tournoi — trophées + notification abonnés */
export const submitTournamentAwards = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Sign in required');
  }
  const { tournamentId, bestPlayer, topScorer, bestGoalkeeper } = data as {
    tournamentId: string;
    bestPlayer: string;
    topScorer: string;
    bestGoalkeeper: string;
  };
  await db.doc(`tournaments/${tournamentId}`).update({
    awards: { best_player: bestPlayer, top_scorer: topScorer, best_goalkeeper: bestGoalkeeper },
    status: 'FINISHED',
  });
  return { success: true };
});

/**
 * Relances automatiques des convocations (toutes les heures).
 * Envoie un FCM aux joueurs encore "pending" quand on entre dans la fenêtre
 * [starts_at - reminder_hours_before, +1h].
 *
 * Déployer : firebase deploy --only functions:scheduledEventReminders
 */
export const scheduledEventReminders = functions.pubsub
  .schedule('every 1 hours')
  .timeZone('Europe/Paris')
  .onRun(async () => {
    const result = await processScheduledEventReminders();
    console.log('[scheduledEventReminders]', result);
    return result;
  });

/** Relance manuelle côté serveur (organisateur de l'événement) */
export const sendEventRemindersCallable = functions.https.onCall(async (data, context) => {
  if (!context.auth?.uid) {
    throw new functions.https.HttpsError('unauthenticated', 'Sign in required');
  }
  const { eventId } = data as { eventId: string };
  if (!eventId) {
    throw new functions.https.HttpsError('invalid-argument', 'eventId required');
  }

  const eventRef = db.doc(`team_events/${eventId}`);
  const eventSnap = await eventRef.get();
  if (!eventSnap.exists) {
    throw new functions.https.HttpsError('not-found', 'Event not found');
  }

  const event = eventSnap.data()!;
  if (event.organizer_uid !== context.auth.uid && !context.auth.token?.admin) {
    throw new functions.https.HttpsError('permission-denied', 'Organizer only');
  }

  const invitees = (event.invitee_uids as string[]) ?? [];
  const rsvps = (event.rsvps as Record<string, string>) ?? {};
  const pending = invitees.filter((uid) => (rsvps[uid] ?? 'pending') === 'pending');

  const startsAt = (event.starts_at as admin.firestore.Timestamp).toDate();
  const dateLabel = startsAt.toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

  let pushes = 0;
  for (const uid of pending) {
    const sent = await sendFcmToUser(uid, {
      title: 'Convocation ProDay',
      body: `${event.title} — ${dateLabel} · ${event.city}. Merci de confirmer votre présence.`,
    });
    if (sent) pushes += 1;
  }

  await eventRef.update({
    last_reminder_at: admin.firestore.FieldValue.serverTimestamp(),
    updated_at: admin.firestore.FieldValue.serverTimestamp(),
  });

  return { success: true, pending: pending.length, pushes };
});

async function notifyClubMembers(
  clubId: string,
  payload: { title: string; body: string; data?: Record<string, string> },
  excludeUid?: string
): Promise<number> {
  const roles = ['player', 'coach', 'agent', 'organizer'];
  const uids = new Set<string>();
  for (const role of roles) {
    const snap = await db.collection('users').where('role', '==', role).limit(200).get();
    for (const doc of snap.docs) {
      const profile = doc.data().profile as { club_id?: string } | undefined;
      if (profile?.club_id === clubId && doc.id !== excludeUid) {
        uids.add(doc.id);
      }
    }
  }
  let pushes = 0;
  for (const uid of uids) {
    const sent = await sendFcmToUser(uid, payload);
    if (sent) pushes += 1;
  }
  return pushes;
}

/** Nouvelle convocation → push aux joueurs convoqués */
export const onTeamEventCreated = functions.firestore
  .document('team_events/{eventId}')
  .onCreate(async (snap) => {
    const data = snap.data();
    const invitees = (data.invitee_uids as string[]) ?? [];
    if (invitees.length === 0) return;

    const startsAt = (data.starts_at as admin.firestore.Timestamp | undefined)?.toDate();
    const dateLabel = startsAt
      ? startsAt.toLocaleDateString('fr-FR', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit',
        })
      : '';

    const title = 'Nouvelle convocation';
    const body = `${data.title ?? 'Événement'} — ${dateLabel} · ${data.city ?? ''}. Confirmez votre présence.`;

    for (const uid of invitees) {
      await sendFcmToUser(uid, { title, body, data: { type: 'team_event', eventId: snap.id } });
    }
  });

interface CarpoolSlotDoc {
  driver_uid?: string;
  driver_name?: string;
}

function carpoolDriverUids(slots: unknown): string[] {
  if (!Array.isArray(slots)) return [];
  return slots
    .map((s) => (s as CarpoolSlotDoc).driver_uid)
    .filter((uid): uid is string => typeof uid === 'string' && uid.length > 0);
}

/** Nouveau chauffeur désigné → notification push */
export const onTeamEventCarpoolUpdated = functions.firestore
  .document('team_events/{eventId}')
  .onUpdate(async (change, context) => {
    const before = carpoolDriverUids(change.before.data().carpool_slots);
    const after = carpoolDriverUids(change.after.data().carpool_slots);
    const newlyAssigned = after.filter((uid) => !before.includes(uid));
    if (newlyAssigned.length === 0) return;

    const data = change.after.data();
    const startsAt = (data.starts_at as admin.firestore.Timestamp | undefined)?.toDate();
    const dateLabel = startsAt
      ? startsAt.toLocaleDateString('fr-FR', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit',
        })
      : '';
    const eventTitle = String(data.title ?? 'Événement');

    for (const uid of newlyAssigned) {
      await sendFcmToUser(uid, {
        title: 'Covoiturage — vous êtes chauffeur',
        body: `${eventTitle} · ${dateLabel}. Indiquez vos places et le point de RDV dans ProDay.`,
        data: {
          type: 'carpool_assignment',
          eventId: context.params.eventId,
        },
      });
    }
  });

/** Nouvelle cotisation → push au membre concerné */
export const onTeamPaymentRequestCreated = functions.firestore
  .document('team_payment_requests/{requestId}')
  .onCreate(async (snap) => {
    const data = snap.data();
    const memberUid = data.member_uid as string | undefined;
    if (!memberUid) return;

    const amount = data.amount_eur ?? 0;
    const label = (data.label as string) ?? 'Cotisation';
    await sendFcmToUser(memberUid, {
      title: 'Cotisation à régler',
      body: `${label} — ${amount} €`,
      data: { type: 'team_payment', requestId: snap.id },
    });
  });

/** Nouvelle annonce club → push aux membres du club */
export const onClubAnnouncementCreated = functions.firestore
  .document('club_announcements/{announcementId}')
  .onCreate(async (snap) => {
    const data = snap.data();
    const clubId = data.club_id as string | undefined;
    if (!clubId) return;

    const authorUid = data.author_uid as string | undefined;
    const title = String(data.title ?? 'Annonce club');
    const body = String(data.body ?? '').slice(0, 120);

    const pushes = await notifyClubMembers(
      clubId,
      {
        title: `Annonce — ${title}`,
        body: body || 'Nouvelle publication sur le fil club.',
        data: { type: 'club_announcement', announcementId: snap.id, clubId },
      },
      authorUid
    );
    console.log(`[onClubAnnouncementCreated] ${clubId} → ${pushes} push(es)`);
  });

/** Nouvelle candidature → push au recruteur / auteur de l'annonce */
export const onRecruitmentApplicationCreated = functions.firestore
  .document('recruitment_applications/{applicationId}')
  .onCreate(async (snap) => {
    const data = snap.data();
    const authorUid = data.post_author_uid as string | undefined;
    if (!authorUid) return;

    const playerName = String(data.player_name ?? 'Un joueur');
    await sendFcmToUser(authorUid, {
      title: 'Nouvelle candidature',
      body: `${playerName} a postulé à votre annonce mercato.`,
      data: {
        type: 'recruitment_application',
        applicationId: snap.id,
        postId: String(data.post_id ?? ''),
      },
    });
  });

/** Staff — mettre à jour le statut d'une candidature (vue / acceptée / refusée) */
export const updateApplicationStatus = functions.https.onCall(async (data, context) => {
  if (!context.auth?.uid) {
    throw new functions.https.HttpsError('unauthenticated', 'Connexion requise');
  }

  const { applicationId, status, rejectionReason } = data as {
    applicationId: string;
    status: 'VIEWED' | 'ACCEPTED' | 'REJECTED';
    rejectionReason?: string;
  };

  if (!applicationId || !status) {
    throw new functions.https.HttpsError('invalid-argument', 'applicationId et status requis');
  }
  if (!['VIEWED', 'ACCEPTED', 'REJECTED'].includes(status)) {
    throw new functions.https.HttpsError('invalid-argument', 'status invalide');
  }

  const appRef = db.doc(`recruitment_applications/${applicationId}`);
  const appSnap = await appRef.get();
  if (!appSnap.exists) {
    throw new functions.https.HttpsError('not-found', 'Candidature introuvable');
  }

  const app = appSnap.data()!;
  const postSnap = await db.doc(`recruitment_posts/${app.post_id}`).get();
  if (!postSnap.exists) {
    throw new functions.https.HttpsError('not-found', 'Annonce introuvable');
  }
  const post = postSnap.data()!;

  const callerUid = context.auth.uid;
  const isAdminUser = context.auth.token?.admin === true;
  const callerSnap = await db.doc(`users/${callerUid}`).get();
  const caller = callerSnap.data() ?? {};
  const callerRole = String(caller.role ?? '');
  const callerClubId = (caller.profile as { club_id?: string } | undefined)?.club_id;
  const postAuthorUid = String(app.post_author_uid ?? post.author_uid ?? '');
  const postClubId = String(post.club_id ?? '');

  const isAuthor = postAuthorUid === callerUid;
  const isClubStaff =
    ['coach', 'agent', 'organizer'].includes(callerRole) &&
    callerClubId &&
    callerClubId === postClubId;

  if (!isAdminUser && !isAuthor && !isClubStaff) {
    throw new functions.https.HttpsError('permission-denied', 'Accès refusé');
  }

  await appRef.update({
    status,
    rejection_reason: status === 'REJECTED' ? String(rejectionReason ?? '').trim() : null,
    updated_at: admin.firestore.FieldValue.serverTimestamp(),
  });

  const postTitle = String(post.title ?? post.position ?? 'Annonce mercato');
  const playerUid = String(app.player_uid ?? '');
  const pushByStatus: Record<string, { title: string; body: string }> = {
    VIEWED: {
      title: 'Candidature consultée',
      body: `Le club a consulté votre candidature pour « ${postTitle} ».`,
    },
    ACCEPTED: {
      title: 'Candidature acceptée',
      body: `Bonne nouvelle ! Votre candidature pour « ${postTitle} » a été acceptée.`,
    },
    REJECTED: {
      title: 'Candidature refusée',
      body: rejectionReason?.trim()
        ? `Votre candidature pour « ${postTitle} » : ${rejectionReason.trim()}`
        : `Votre candidature pour « ${postTitle} » n'a pas été retenue.`,
    },
  };

  if (playerUid && pushByStatus[status]) {
    await sendFcmToUser(playerUid, {
      ...pushByStatus[status],
      data: {
        type: 'application_status',
        applicationId,
        postId: String(app.post_id ?? ''),
        status,
      },
    });
  }

  return { success: true };
});

/** Créer un compte utilisateur (Auth + profil Firestore) — admin uniquement */
export const adminCreateUser = functions.https.onCall(async (data, context) => {
  if (!context.auth?.token?.admin) {
    throw new functions.https.HttpsError('permission-denied', 'Admin only');
  }
  const { email, password, display_name, role, city } = data as {
    email: string;
    password: string;
    display_name: string;
    role: string;
    city?: string;
  };
  if (!email?.trim() || !password || password.length < 6) {
    throw new functions.https.HttpsError('invalid-argument', 'email et password requis');
  }
  const allowed = ['player', 'coach', 'agent', 'organizer', 'sponsor', 'physio'];
  if (!allowed.includes(role)) {
    throw new functions.https.HttpsError('invalid-argument', 'role invalide');
  }

  const requiresVerification = role === 'coach' || role === 'agent';
  const userRecord = await admin.auth().createUser({
    email: email.trim().toLowerCase(),
    password,
    displayName: display_name.trim(),
  });

  await db.doc(`users/${userRecord.uid}`).set({
    display_name: display_name.trim(),
    email: email.trim().toLowerCase(),
    role,
    city: city?.trim() || null,
    is_verified: !requiresVerification,
    verification_status: requiresVerification ? 'PENDING' : 'NOT_REQUIRED',
    is_active: true,
    profile: {},
    created_at: admin.firestore.FieldValue.serverTimestamp(),
    updated_at: admin.firestore.FieldValue.serverTimestamp(),
  });

  return { success: true, uid: userRecord.uid };
});

/** Supprimer un utilisateur (Firestore + Auth) — admin uniquement */
export const adminDeleteUser = functions.https.onCall(async (data, context) => {
  if (!context.auth?.token?.admin) {
    throw new functions.https.HttpsError('permission-denied', 'Admin only');
  }
  const { uid } = data as { uid: string };
  if (!uid) {
    throw new functions.https.HttpsError('invalid-argument', 'uid required');
  }
  if (uid === context.auth.uid) {
    throw new functions.https.HttpsError('failed-precondition', 'Cannot delete yourself');
  }

  const docsSnap = await db.collection(`users/${uid}/documents`).get();
  const batch = db.batch();
  docsSnap.docs.forEach((d) => batch.delete(d.ref));
  batch.delete(db.doc(`users/${uid}`));
  await batch.commit();

  try {
    await admin.auth().deleteUser(uid);
  } catch (e) {
    console.warn('[adminDeleteUser] auth delete:', e);
  }

  return { success: true };
});
