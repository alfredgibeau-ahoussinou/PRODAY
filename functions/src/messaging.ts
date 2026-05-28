import * as admin from 'firebase-admin';

export interface PushPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
}

function isExpoPushToken(token: string): boolean {
  return token.startsWith('ExponentPushToken[') || token.startsWith('ExpoPushToken[');
}

async function sendExpoPush(token: string, payload: PushPayload): Promise<boolean> {
  try {
    const res = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: token,
        sound: 'default',
        title: payload.title,
        body: payload.body,
        data: payload.data ?? {},
      }),
    });
    const json = (await res.json()) as {
      data?: Array<{ status: string; message?: string }>;
    };
    const ticket = json.data?.[0];
    if (ticket?.status === 'ok') return true;
    console.warn('[Expo push fail]', ticket?.message ?? json);
    return false;
  } catch (e) {
    console.warn('[Expo push error]', e);
    return false;
  }
}

/** Envoie une notification push (Expo Push Token ou FCM natif). */
export async function sendPushToUser(uid: string, payload: PushPayload): Promise<boolean> {
  const snap = await admin.firestore().doc(`users/${uid}`).get();
  const token = snap.data()?.fcm_token as string | undefined;
  if (!token) {
    console.log(`[push skip ${uid}] no token — ${payload.title}`);
    return false;
  }

  if (isExpoPushToken(token)) {
    return sendExpoPush(token, payload);
  }

  try {
    await admin.messaging().send({
      token,
      notification: { title: payload.title, body: payload.body },
      data: { type: 'proday', uid, ...(payload.data ?? {}) },
    });
    return true;
  } catch (e) {
    console.warn(`[FCM fail ${uid}]`, e);
    return false;
  }
}

/** @deprecated Alias — préférer sendPushToUser */
export const sendFcmToUser = sendPushToUser;
