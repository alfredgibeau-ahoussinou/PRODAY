import './firebaseAdmin';
import * as functions from 'firebase-functions';
import { admin } from './firebaseAdmin';
import { processScheduledEventReminders } from './eventReminders';
import { sendFcmToUser } from './messaging';
import { createPaymentCheckoutSession, stripeWebhook } from './stripePayments';
import { createShopCheckoutSession } from './shopPayments';
import { onRecruitmentPostCreated } from './mercatoAlerts';
import { runMistralDocumentVerification, verifyOnboardingDocumentEphemeral } from './mistralVerification';
import { onPlatformFeedCreated, onChatMessageCreated } from './feedNotifications';
import { createValidateBetaAccessHandler } from './betaAccess';
import { createSubmitBetaWaitlistHandler } from './betaWaitlist';
import {
  createAdminApproveBetaAccessHandler,
  createAdminRejectBetaAccessHandler,
  createAdminResendBetaWelcomeEmailHandler,
  createAdminDeleteBetaWaitlistEntryHandler,
} from './betaWaitlistAdmin';
import { createWebsiteBetaWaitlistAdminHandler } from './betaWaitlistWebsiteAdmin';
import { processScheduledBetaIosCampaign } from './betaIosCampaign';
import {
  createRecordTrafficVisitHandler,
  createWebsiteTrafficStatsAdminHandler,
} from './trafficStats';
import { createWebsiteAdminStatsHandler } from './websiteAdminStats';
import { createSubmitSponsorQuoteRequestHandler } from './sponsorQuoteRequest';
import {
  createAdminSendSponsorQuoteHandler,
  createAdminRejectSponsorQuoteHandler,
} from './sponsorQuoteAdmin';
import { onV3BrainWrite } from './v3Brain';
import { activateStoreSubscription } from './subscriptionIap';
import { revenueCatWebhook } from './revenueCatWebhook';
import { claimAgentLaunchSeat } from './agentLaunchSeats';
import { ensureReferralCode, claimReferralCode } from './referral';
import {
  onSponsorOfferCreated,
  onSponsorOfferUpdated,
  notifySponsorOfferInCityCallable,
} from './sponsorGeoPush';
import { onTeamEventUpdated, syncTeamEventActivities } from './teamEventActivitySync';
import { analyzeActivityHighlight } from './analyzeActivityHighlight';
import { sendAuthPasswordResetEmail, sendAuthVerificationEmail } from './authCustomEmails';
import {
  onMinorUserCreatedProvisionParent,
  provisionParentAccount,
} from './parentAccount';
import {
  onMedicalAppointmentCreated,
  onMedicalAppointmentUpdated,
} from './appointmentEmail';
import { getVisioJoinUrl } from './getVisioJoinUrl';
import { incrementSubscriptionUsage } from './subscriptionUsage';
import { sendSponsorClubMessage } from './sendSponsorClubMessage';

export { createPaymentCheckoutSession, stripeWebhook, createShopCheckoutSession };
export { sendAuthVerificationEmail, sendAuthPasswordResetEmail };
export { onMinorUserCreatedProvisionParent, provisionParentAccount };
export { incrementSubscriptionUsage };
export { sendSponsorClubMessage };
export { onSponsorOfferCreated, onSponsorOfferUpdated, notifySponsorOfferInCityCallable };
export { onMedicalAppointmentCreated, onMedicalAppointmentUpdated };
export { getVisioJoinUrl };
export { onTeamEventUpdated, syncTeamEventActivities };
export { analyzeActivityHighlight };
export { activateStoreSubscription };
export { revenueCatWebhook };
export { claimAgentLaunchSeat };
export { ensureReferralCode, claimReferralCode };
export { onPlatformFeedCreated, onChatMessageCreated };
export { onRecruitmentPostCreated };
export { onV3BrainWrite };

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

/** Inscription — analyse IA éphémère (sans Storage ni sous-collection documents). */
export const verifyOnboardingDocument = functions
  .runWith({ timeoutSeconds: 120, memory: '512MB' })
  .https.onCall(async (data, context) => {
    if (!context.auth?.uid) {
      throw new functions.https.HttpsError('unauthenticated', 'Connexion requise');
    }
    const { image_base64, mime_type, verification_check } = data as {
      image_base64?: string;
      mime_type?: string;
      verification_check?: string;
    };
    if (!image_base64?.trim()) {
      throw new functions.https.HttpsError('invalid-argument', 'image_base64 requis');
    }
    try {
      return await verifyOnboardingDocumentEphemeral(
        context.auth.uid,
        image_base64.trim(),
        String(mime_type ?? 'image/jpeg'),
        verification_check?.trim() || undefined
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Analyse impossible';
      throw new functions.https.HttpsError('failed-precondition', msg);
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
  const userSnap = await db.doc(`users/${uid}`).get();
  const role = String(userSnap.data()?.role ?? '');
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
  if (role === 'sponsor') {
    update.sponsor_approved = verified;
    update.product_line = 'sponsor';
  }
  await db.doc(`users/${uid}`).update(update);

  await sendFcmToUser(uid, {
    title: verified ? 'Profil vérifié' : 'Vérification refusée',
    body: verified
      ? role === 'sponsor'
        ? 'Votre espace marque est validé. Campagnes débloquées.'
        : 'Votre diplôme/licence est validé. Messagerie complète débloquée.'
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

/**
 * Campagne bêta iOS : lancement TestFlight (11 août 2026 18 h Paris)
 * + emails d'engagement tous les 2 jours après ouverture.
 *
 * Déployer : firebase deploy --only functions:scheduledBetaIosCampaign
 */
export const scheduledBetaIosCampaign = functions.pubsub
  .schedule('every 1 hours')
  .timeZone('Europe/Paris')
  .onRun(async () => {
    const result = await processScheduledBetaIosCampaign(db);
    console.log('[scheduledBetaIosCampaign]', result);
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
    status: 'VIEWED' | 'IN_PROGRESS' | 'ACCEPTED' | 'REJECTED';
    rejectionReason?: string;
  };

  if (!applicationId || !status) {
    throw new functions.https.HttpsError('invalid-argument', 'applicationId et status requis');
  }
  if (!['VIEWED', 'IN_PROGRESS', 'ACCEPTED', 'REJECTED'].includes(status)) {
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
  const { email, password, display_name, role, city, product_line, medical_specialty } = data as {
    email: string;
    password: string;
    display_name: string;
    role: string;
    city?: string;
    product_line?: string;
    medical_specialty?: string;
  };
  if (!email?.trim() || !password || password.length < 6) {
    throw new functions.https.HttpsError('invalid-argument', 'email et password requis');
  }
  const allowed = [
    'player',
    'coach',
    'club',
    'agent',
    'recruiter',
    'organizer',
    'sponsor',
    'physio',
    'supporter',
  ];
  if (!allowed.includes(role)) {
    throw new functions.https.HttpsError('invalid-argument', 'role invalide');
  }

  const resolveLine = (): string => {
    if (role === 'sponsor') return 'sponsor';
    if (role === 'physio') return 'sante';
    if (role === 'supporter') return 'supporter';
    if (product_line && typeof product_line === 'string') {
      const allowedLines = [
        'amateur',
        'supporter',
        'pro_player',
        'pro_club',
        'pro_staff',
        'sponsor',
        'sante',
      ];
      if (allowedLines.includes(product_line)) {
        if (role === 'club') return 'pro_club';
        if (role === 'player' && product_line === 'amateur') return 'amateur';
        if (role === 'player') return product_line === 'pro_player' ? 'pro_player' : product_line === 'amateur' ? 'amateur' : 'pro_player';
        if (['coach', 'agent', 'recruiter', 'organizer'].includes(role)) {
          return 'pro_staff';
        }
        return product_line;
      }
    }
    if (role === 'player') return 'pro_player';
    if (role === 'club') return 'pro_club';
    if (['coach', 'agent', 'recruiter', 'organizer'].includes(role)) return 'pro_staff';
    return 'amateur';
  };

  const line = resolveLine();
  const requiresVerification =
    role === 'coach' ||
    role === 'agent' ||
    role === 'club' ||
    role === 'organizer' ||
    role === 'sponsor';
  const userRecord = await admin.auth().createUser({
    email: email.trim().toLowerCase(),
    password,
    displayName: display_name.trim(),
  });

  const specialty =
    role === 'physio' && typeof medical_specialty === 'string' && medical_specialty.trim()
      ? medical_specialty.trim()
      : null;

  await db.doc(`users/${userRecord.uid}`).set({
    display_name: display_name.trim(),
    email: email.trim().toLowerCase(),
    role,
    product_line: line,
    city: city?.trim() || null,
    is_verified: !requiresVerification,
    verification_status: requiresVerification ? 'PENDING' : 'NOT_REQUIRED',
    sponsor_approved: role === 'sponsor' ? false : null,
    is_active: true,
    profile: specialty
      ? { medical_specialty: specialty, job_title: specialty }
      : {},
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

/** Suppression de son propre compte — parcours requis pour les comptes créés dans l'app. */
export const deleteMyAccount = functions.https.onCall(async (_data, context) => {
  const uid = context.auth?.uid;
  if (!uid) {
    throw new functions.https.HttpsError('unauthenticated', 'Connexion requise');
  }

  // Les documents de vérification sont privés et doivent disparaître avec le compte.
  const documents = await db.collection(`users/${uid}/documents`).get();
  const batch = db.batch();
  documents.docs.forEach((document) => batch.delete(document.ref));
  batch.delete(db.doc(`users/${uid}`));
  await batch.commit();

  try {
    await admin.auth().deleteUser(uid);
  } catch (error) {
    console.error('[deleteMyAccount] auth delete:', error);
    throw new functions.https.HttpsError(
      'internal',
      'La suppression du compte n’a pas pu être finalisée. Réessayez ou contactez le support.'
    );
  }

  return { success: true };
});

type SponsorTrackEventType = 'offer_view' | 'offer_click' | 'offer_lead' | 'profile_view';

const SPONSOR_TRACK_EVENTS = new Set<SponsorTrackEventType>([
  'offer_view',
  'offer_click',
  'offer_lead',
  'profile_view',
]);

const SPONSOR_RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000;
const SPONSOR_RATE_LIMIT_MAX = 80;
const PROFILE_VIEW_DEDUP_MS = 24 * 60 * 60 * 1000;

function sponsorTrackClientIp(context: functions.https.CallableContext): string {
  const raw = context.rawRequest;
  if (!raw) return 'unknown';
  const forwarded = raw.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim()) {
    return forwarded.split(',')[0].trim();
  }
  return raw.ip ?? 'unknown';
}

function sponsorRateLimitDocId(ip: string, viewerKey: string): string {
  const key = `${ip}:${viewerKey}`.slice(0, 200);
  return Buffer.from(key).toString('base64url').slice(0, 120);
}

async function assertSponsorTrackingRateLimit(ip: string, viewerKey: string): Promise<boolean> {
  const rateRef = db.doc(`sponsor_tracking_rate/${sponsorRateLimitDocId(ip, viewerKey)}`);
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

  if (now - windowStart >= SPONSOR_RATE_LIMIT_WINDOW_MS) {
    await rateRef.set({
      count: 1,
      window_start: admin.firestore.Timestamp.fromMillis(now),
    });
    return true;
  }

  if (count >= SPONSOR_RATE_LIMIT_MAX) {
    return false;
  }

  await rateRef.update({ count: admin.firestore.FieldValue.increment(1) });
  return true;
}

async function recordSponsorProfileView(
  sponsorUid: string,
  viewerUid: string | null,
  anonymousId: string
): Promise<{ deduped?: boolean }> {
  const since = admin.firestore.Timestamp.fromMillis(Date.now() - PROFILE_VIEW_DEDUP_MS);
  const viewsRef = db.collection('sponsor_profile_views');

  if (viewerUid) {
    const existing = await viewsRef
      .where('sponsor_uid', '==', sponsorUid)
      .where('viewer_uid', '==', viewerUid)
      .where('created_at', '>', since)
      .limit(1)
      .get();
    if (!existing.empty) return { deduped: true };

    await viewsRef.add({
      sponsor_uid: sponsorUid,
      viewer_uid: viewerUid,
      created_at: admin.firestore.FieldValue.serverTimestamp(),
    });
    return {};
  }

  const existing = await viewsRef
    .where('sponsor_uid', '==', sponsorUid)
    .where('viewer_anonymous_id', '==', anonymousId)
    .where('created_at', '>', since)
    .limit(1)
    .get();
  if (!existing.empty) return { deduped: true };

  await viewsRef.add({
    sponsor_uid: sponsorUid,
    viewer_anonymous_id: anonymousId,
    created_at: admin.firestore.FieldValue.serverTimestamp(),
  });
  return {};
}

/**
 * Tracking sponsor (vues offres, clics, leads, vues profil) — accessible aux invités.
 * Rate-limit IP + déduplication vues profil sur 24 h par viewer.
 */
export const trackSponsorEvent = functions.https.onCall(async (data, context) => {
  const { event, offer_id, sponsor_uid, anonymous_id } = data as {
    event?: string;
    offer_id?: string;
    sponsor_uid?: string;
    anonymous_id?: string;
  };

  if (!event || !SPONSOR_TRACK_EVENTS.has(event as SponsorTrackEventType)) {
    throw new functions.https.HttpsError('invalid-argument', 'event invalide');
  }

  const viewerUid = context.auth?.uid ?? null;
  const anonId =
    typeof anonymous_id === 'string' ? anonymous_id.trim().slice(0, 128) : '';

  if (!viewerUid && !anonId) {
    throw new functions.https.HttpsError('invalid-argument', 'anonymous_id requis');
  }

  const viewerKey = viewerUid ?? `anon:${anonId}`;
  const allowed = await assertSponsorTrackingRateLimit(sponsorTrackClientIp(context), viewerKey);
  if (!allowed) {
    return { success: true, throttled: true };
  }

  if (event === 'profile_view') {
    const targetSponsor = String(sponsor_uid ?? '').trim();
    if (!targetSponsor) {
      throw new functions.https.HttpsError('invalid-argument', 'sponsor_uid requis');
    }
    if (viewerUid === targetSponsor) {
      return { success: true, skipped: true };
    }

    const result = await recordSponsorProfileView(targetSponsor, viewerUid, anonId);
    return { success: true, ...result };
  }

  const offerId = String(offer_id ?? '').trim();
  if (!offerId) {
    throw new functions.https.HttpsError('invalid-argument', 'offer_id requis');
  }

  const offerRef = db.doc(`sponsor_offers/${offerId}`);
  const offerSnap = await offerRef.get();
  if (!offerSnap.exists) {
    throw new functions.https.HttpsError('not-found', 'Offre introuvable');
  }

  const metricField =
    event === 'offer_view'
      ? 'views_count'
      : event === 'offer_click'
        ? 'clicks_count'
        : 'leads_count';

  await offerRef.update({
    [metricField]: admin.firestore.FieldValue.increment(1),
  });

  return { success: true };
});

/** Inscription bêta site vitrine — Firestore + EmailJS (email après validation admin). */
export const submitBetaWaitlist = functions
  .region('europe-west1')
  .https.onRequest(createSubmitBetaWaitlistHandler(db));

/** Validation jeton d'accès page bêta (lien email). */
export const validateBetaAccess = functions
  .region('europe-west1')
  .https.onRequest(createValidateBetaAccessHandler(db));

/** Admin waitlist depuis le site vitrine — secret partagé (PIN session côté Netlify). */
export const websiteBetaWaitlistAdmin = functions
  .region('europe-west1')
  .https.onRequest(createWebsiteBetaWaitlistAdminHandler(db));

/** Compteur de visites site / ouvertures app (public, rate-limité). */
export const recordTrafficVisit = functions
  .region('europe-west1')
  .https.onRequest(createRecordTrafficVisitHandler(db));

/** Lecture stats trafic pour l’admin site — secret partagé. */
export const websiteTrafficStatsAdmin = functions
  .region('europe-west1')
  .https.onRequest(createWebsiteTrafficStatsAdminHandler(db));

/** Agrégats users / abonnements / parrainage / signalements — admin site. */
export const websiteAdminStats = functions
  .region('europe-west1')
  .runWith({ timeoutSeconds: 60, memory: '512MB' })
  .https.onRequest(createWebsiteAdminStatsHandler(db));

/** Approuve une inscription bêta et envoie l'email de bienvenue — admin uniquement. */
export const adminApproveBetaAccess = functions
  .region('europe-west1')
  .https.onCall(createAdminApproveBetaAccessHandler(db));

/** Refuse une inscription bêta — admin uniquement. */
export const adminRejectBetaAccess = functions
  .region('europe-west1')
  .https.onCall(createAdminRejectBetaAccessHandler(db));

/** Renvoie l'email de bienvenue bêta — admin uniquement. */
export const adminResendBetaWelcomeEmail = functions
  .region('europe-west1')
  .https.onCall(createAdminResendBetaWelcomeEmailHandler(db));

/** Supprime une inscription bêta — admin uniquement. */
export const adminDeleteBetaWaitlistEntry = functions
  .region('europe-west1')
  .https.onCall(createAdminDeleteBetaWaitlistEntryHandler(db));

/** Demande de devis sponsor — site vitrine / app mobile. */
export const submitSponsorQuoteRequest = functions
  .region('europe-west1')
  .https.onRequest(createSubmitSponsorQuoteRequestHandler(db));

/** Envoie un devis sponsor personnalisé — admin uniquement. */
export const adminSendSponsorQuote = functions
  .region('europe-west1')
  .https.onCall(createAdminSendSponsorQuoteHandler(db));

/** Refuse une demande de devis sponsor — admin uniquement. */
export const adminRejectSponsorQuote = functions
  .region('europe-west1')
  .https.onCall(createAdminRejectSponsorQuoteHandler(db));
