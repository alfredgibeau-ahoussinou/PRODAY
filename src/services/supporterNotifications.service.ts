import { doc, getDoc } from 'firebase/firestore';
import { getDb } from '../lib/firebase';
import {
  shouldDeliverSupporterNotification,
  type SupporterNotifKind,
} from '../utils/supporterNotificationFilter';
import {
  loadSupporterNotificationPrefs,
  type SupporterNotificationPreferences,
} from './supporterPreferences.service';
import { notificationService } from './notification.service';

export type SupporterPushResult = 'sent' | 'filtered' | 'no_token';

export interface SupporterPushPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
}

async function resolveFcmToken(uid: string): Promise<string | undefined> {
  const database = getDb();
  if (!database) return undefined;
  try {
    const snap = await getDoc(doc(database, 'users', uid));
    return snap.data()?.fcm_token as string | undefined;
  } catch {
    return undefined;
  }
}

/** Envoie une push tribune si la préférence utilisateur l'autorise (fallback gracieux sans token). */
export async function sendSupporterPushIfAllowed(
  uid: string,
  kind: SupporterNotifKind,
  payload: SupporterPushPayload,
  prefsOverride?: SupporterNotificationPreferences
): Promise<SupporterPushResult> {
  const prefs = prefsOverride ?? (await loadSupporterNotificationPrefs(uid));
  if (!shouldDeliverSupporterNotification(prefs, kind)) {
    return 'filtered';
  }

  const token = await resolveFcmToken(uid);
  if (!token) {
    if (__DEV__) {
      console.log(`[supporter push dev ${uid}] ${payload.title}: ${payload.body}`);
    }
    return 'no_token';
  }

  await notificationService.sendPush(uid, token, payload);
  return 'sent';
}
