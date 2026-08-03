import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { admin } from './firebaseAdmin';
import {
  buildDailyJoinUrl,
  createDailyMeetingToken,
  createDailyRoom,
  extractDailyRoomName,
  isDailyMeetingLink,
} from './dailyVisio';
import {
  buildCalVideoJoinUrl,
  isCalVideoMeetingLink,
  resolveCalVideoMeetingLink,
} from './calVisio';

type AppointmentDoc = {
  physio_uid: string;
  patient_uid: string;
  patient_name?: string;
  meeting_link?: string | null;
  visio_provider?: string | null;
  cal_booking_uid?: string | null;
  start_at?: FirebaseFirestore.Timestamp | Date;
  end_at?: FirebaseFirestore.Timestamp | Date;
  status?: string;
  consultation_type?: string;
};

function toDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof admin.firestore.Timestamp) return value.toDate();
  if (value instanceof Date) return value;
  return null;
}

async function resolveUserDisplayName(uid: string): Promise<string> {
  const snap = await admin.firestore().doc(`users/${uid}`).get();
  const data = snap.data();
  const displayName = data?.display_name;
  if (typeof displayName === 'string' && displayName.trim()) {
    return displayName.trim();
  }
  try {
    const user = await admin.auth().getUser(uid);
    return user.displayName?.trim() || user.email?.split('@')[0] || 'Participant';
  } catch {
    return 'Participant';
  }
}

async function resolveUserEmail(uid: string): Promise<string | null> {
  const snap = await admin.firestore().doc(`users/${uid}`).get();
  const fromDoc = snap.data()?.email;
  if (typeof fromDoc === 'string' && fromDoc.trim()) {
    return fromDoc.trim().toLowerCase();
  }
  try {
    const user = await admin.auth().getUser(uid);
    return user.email?.trim().toLowerCase() ?? null;
  } catch {
    return null;
  }
}

async function loadPhysioProfile(uid: string): Promise<Record<string, unknown>> {
  const snap = await admin.firestore().doc(`users/${uid}`).get();
  const data = snap.data();
  return (data?.profile as Record<string, unknown>) ?? {};
}

async function persistMeetingLink(
  appointmentId: string,
  link: { meetingLink: string; visioProvider: string; calBookingUid?: string }
): Promise<void> {
  const patch: Record<string, unknown> = {
    meeting_link: link.meetingLink,
    visio_provider: link.visioProvider,
    updated_at: admin.firestore.FieldValue.serverTimestamp(),
  };
  if (link.calBookingUid) {
    patch.cal_booking_uid = link.calBookingUid;
  }
  await admin.firestore().doc(`medical_appointments/${appointmentId}`).update(patch);
}

/**
 * Garantit une URL de salle réelle (Daily prioritaire pour l'UI in-app, Cal Video en secours).
 * Ne renvoie jamais une URL Daily « fictive » (domain/room sans création API).
 */
async function resolveJoinableMeeting(input: {
  appointmentId: string;
  data: AppointmentDoc;
}): Promise<{ meetingLink: string; visioProvider: 'cal' | 'daily'; calBookingUid?: string }> {
  const { appointmentId, data } = input;
  const endAt = toDate(data.end_at) ?? new Date(Date.now() + 60 * 60_000);
  const startAt = toDate(data.start_at) ?? new Date();
  const existing = data.meeting_link?.trim();

  // Daily en priorité : salle privée + token pour Call Object in-app.
  const daily = await createDailyRoom({ appointmentId, endAt });
  if (daily) {
    if (daily.meetingLink !== existing || data.visio_provider !== 'daily') {
      await persistMeetingLink(appointmentId, daily);
    }
    return daily;
  }

  const calUid = data.cal_booking_uid?.trim();
  if (calUid) {
    return {
      meetingLink: `https://app.cal.com/video/${calUid}`,
      visioProvider: 'cal',
      calBookingUid: calUid,
    };
  }

  if (existing && isCalVideoMeetingLink(existing)) {
    return { meetingLink: existing, visioProvider: 'cal' };
  }

  const profile = await loadPhysioProfile(data.physio_uid);
  const patientEmail =
    (await resolveUserEmail(data.patient_uid)) ?? `${data.patient_uid}@proday.app`;
  const cal = await resolveCalVideoMeetingLink({
    profile: {
      cal_com_username: profile.cal_com_username as string | undefined,
      booking_url: profile.booking_url as string | undefined,
      cal_event_type_slug: profile.cal_event_type_slug as string | undefined,
    },
    startAt,
    attendeeName: data.patient_name?.trim() || 'Patient ProDay',
    attendeeEmail: patientEmail,
    appointmentId,
  });

  if (cal && isCalVideoMeetingLink(cal.meetingLink)) {
    await persistMeetingLink(appointmentId, {
      meetingLink: cal.meetingLink,
      visioProvider: 'cal',
      calBookingUid: cal.calBookingUid,
    });
    return {
      meetingLink: cal.meetingLink,
      visioProvider: 'cal',
      calBookingUid: cal.calBookingUid,
    };
  }

  throw new HttpsError(
    'failed-precondition',
    'Salle visio indisponible. Configurez DAILY_API_KEY (ou Cal Video) puis réessayez.'
  );
}

/** Callable — URL Cal Video / Daily prête à rejoindre (nom + email auto, sans formulaire). */
export const getVisioJoinUrl = onCall(
  { region: 'europe-west1' },
  async (request) => {
    const uid = request.auth?.uid;
    if (!uid) {
      throw new HttpsError('unauthenticated', 'Connexion requise');
    }

    const platformSnap = await admin.firestore().doc('platform_config/main').get();
    const flags = (platformSnap.data()?.feature_flags as Record<string, unknown> | undefined) ?? {};
    if (flags.sante_visio !== true) {
      throw new HttpsError(
        'failed-precondition',
        'Bêta actuelle — aucun accès à la visio. Réessayez quand l’équipe ProDay l’aura activée.',
      );
    }

    const { appointmentId, isHost } = request.data as {
      appointmentId?: string;
      isHost?: boolean;
    };

    if (!appointmentId?.trim()) {
      throw new HttpsError('invalid-argument', 'appointmentId requis');
    }

    const snap = await admin.firestore().doc(`medical_appointments/${appointmentId}`).get();
    if (!snap.exists) {
      throw new HttpsError('not-found', 'Rendez-vous introuvable');
    }

    const data = snap.data() as AppointmentDoc;
    if (data.status !== 'confirmed') {
      throw new HttpsError('failed-precondition', 'Rendez-vous non confirmé');
    }

    const isPhysio = uid === data.physio_uid;
    const isPatient = uid === data.patient_uid;
    if (!isPhysio && !isPatient) {
      throw new HttpsError('permission-denied', 'Accès refusé');
    }

    const resolved = await resolveJoinableMeeting({ appointmentId, data });
    const meetingLink = resolved.meetingLink;
    const userName = await resolveUserDisplayName(uid);
    const userEmail = await resolveUserEmail(uid);
    const endAt = toDate(data.end_at) ?? new Date(Date.now() + 60 * 60_000);
    const host = Boolean(isHost) && isPhysio;

    if (resolved.visioProvider === 'daily' || isDailyMeetingLink(meetingLink)) {
      const roomName = extractDailyRoomName(meetingLink);
      const token =
        roomName != null
          ? await createDailyMeetingToken({
              roomName,
              userName,
              userId: uid,
              isOwner: host,
              endAt,
            })
          : null;

      const roomUrl = meetingLink.split('?')[0];
      return {
        joinUrl: buildDailyJoinUrl(roomUrl, { token, userName, userId: uid }),
        roomUrl,
        token,
        provider: 'daily' as const,
      };
    }

    return {
      joinUrl: buildCalVideoJoinUrl(meetingLink, {
        userName,
        email: userEmail ?? undefined,
      }),
      roomUrl: meetingLink.split('?')[0],
      token: null,
      provider: 'cal' as const,
    };
  }
);
