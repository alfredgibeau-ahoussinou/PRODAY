import * as functions from 'firebase-functions';
import { sendPushToUser } from './messaging';

/**
 * Toute entrée `staff_notifications` déclenche un push réel (Expo / FCM)
 * vers le destinataire — remplace le faux console.log côté client.
 */
export const onStaffNotificationCreated = functions.firestore
  .document('staff_notifications/{notifId}')
  .onCreate(async (snap) => {
    const data = snap.data();
    const uid = String(data.recipient_uid ?? '').trim();
    if (!uid) return;

    const title = String(data.title ?? 'ProDay').slice(0, 80);
    const body = String(data.body ?? '').slice(0, 180);
    const type = String(data.type ?? 'generic');

    await sendPushToUser(uid, {
      title,
      body,
      data: {
        type,
        notifId: snap.id,
        ...(data.event_id ? { eventId: String(data.event_id) } : {}),
        ...(data.club_id ? { clubId: String(data.club_id) } : {}),
        ...(data.player_uid ? { playerUid: String(data.player_uid) } : {}),
      },
    });
  });
