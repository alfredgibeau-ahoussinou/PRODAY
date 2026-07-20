import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { admin } from './firebaseAdmin';
import {
  buildDailyJoinUrl,
  createDailyMeetingToken,
  createDailyRoom,
  extractDailyRoomName,
  isDailyMeetingLink,
} from './dailyVisio';
import { buildCalVideoJoinUrl, isCalVideoMeetingLink } from './calVisio';

type AppointmentDoc = {
  physio_uid: string;
  patient_uid: string;
  meeting_link?: string | null;
  visio_provider?: string | null;
  cal_booking_uid?: string | null;
  end_at?: FirebaseFirestore.Timestamp | Date;
  status?: string;
};

function isJoinableMeetingLink(link: string): boolean {
  return isCalVideoMeetingLink(link) || isDailyMeetingLink(link);
}

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

/** Callable — URL Cal Video / Daily prête à rejoindre (nom + email auto, sans formulaire). */
export const getVisioJoinUrl = onCall(
  { region: 'europe-west1' },
  async (request) => {
    const uid = request.auth?.uid;
    if (!uid) {
      throw new HttpsError('unauthenticated', 'Connexion requise');
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

    let data = snap.data() as AppointmentDoc;
    if (data.status !== 'confirmed') {
      throw new HttpsError('failed-precondition', 'Rendez-vous non confirmé');
    }

    const isPhysio = uid === data.physio_uid;
    const isPatient = uid === data.patient_uid;
    if (!isPhysio && !isPatient) {
      throw new HttpsError('permission-denied', 'Accès refusé');
    }

    let meetingLink = data.meeting_link?.trim();
    if (!meetingLink && data.cal_booking_uid?.trim()) {
      meetingLink = `https://app.cal.com/video/${data.cal_booking_uid.trim()}`;
    }

    // Page booking Cal.com / lien invalide → salle Daily joinable immédiatement.
    if (!meetingLink || !isJoinableMeetingLink(meetingLink)) {
      const endAt = toDate(data.end_at) ?? new Date(Date.now() + 60 * 60_000);
      const daily = await createDailyRoom({ appointmentId, endAt });
      meetingLink = daily.meetingLink;
      await admin
        .firestore()
        .doc(`medical_appointments/${appointmentId}`)
        .update({
          meeting_link: daily.meetingLink,
          visio_provider: 'daily',
          updated_at: admin.firestore.FieldValue.serverTimestamp(),
        });
      data = { ...data, meeting_link: daily.meetingLink, visio_provider: 'daily' };
    }

    if (!meetingLink) {
      throw new HttpsError('failed-precondition', 'Lien visio indisponible');
    }

    const userName = await resolveUserDisplayName(uid);
    const userEmail = await resolveUserEmail(uid);
    const endAt = toDate(data.end_at) ?? new Date(Date.now() + 60 * 60_000);
    const host = Boolean(isHost) && isPhysio;

    if (data.visio_provider === 'daily' || isDailyMeetingLink(meetingLink)) {
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

      return {
        joinUrl: buildDailyJoinUrl(meetingLink, { token, userName, userId: uid }),
        provider: 'daily' as const,
      };
    }

    const joinUrl = buildCalVideoJoinUrl(meetingLink, {
      userName,
      email: userEmail ?? undefined,
    });

    return {
      joinUrl,
      provider: (isCalVideoMeetingLink(joinUrl) ? 'cal' : data.visio_provider ?? 'cal') as string,
    };
  }
);
