import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { admin } from './firebaseAdmin';
import {
  buildDailyJoinUrl,
  createDailyMeetingToken,
  extractDailyRoomName,
} from './dailyVisio';

type AppointmentDoc = {
  physio_uid: string;
  patient_uid: string;
  meeting_link?: string | null;
  visio_provider?: string | null;
  end_at?: FirebaseFirestore.Timestamp | Date;
  status?: string;
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

/** Callable — URL Daily Prebuilt prête à rejoindre (nom + token auto, sans formulaire). */
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

    const data = snap.data() as AppointmentDoc;
    if (data.status !== 'confirmed') {
      throw new HttpsError('failed-precondition', 'Rendez-vous non confirmé');
    }

    const isPhysio = uid === data.physio_uid;
    const isPatient = uid === data.patient_uid;
    if (!isPhysio && !isPatient) {
      throw new HttpsError('permission-denied', 'Accès refusé');
    }

    const meetingLink = data.meeting_link?.trim();
    if (!meetingLink) {
      throw new HttpsError('failed-precondition', 'Lien visio indisponible');
    }

    const userName = await resolveUserDisplayName(uid);
    const endAt = toDate(data.end_at) ?? new Date(Date.now() + 60 * 60_000);
    const host = Boolean(isHost) && isPhysio;

    if (data.visio_provider === 'daily' || meetingLink.includes('daily.co')) {
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

    return { joinUrl: meetingLink, provider: (data.visio_provider ?? 'cal') as string };
  }
);
