import * as admin from 'firebase-admin';
import { sendPushToUser, type PushPayload } from './messaging';

/** Catégories push tribune — alignées sur src/utils/supporterNotificationFilter.ts */
export type SupporterNotifKind =
  | 'goal_live'
  | 'kickoff_favorite'
  | 'match_reminder'
  | 'followed_player'
  | 'followed_club'
  | 'community_digest'
  | 'debate';

export interface SupporterNotificationPreferences {
  goalAlerts: boolean;
  kickoffAlerts: boolean;
  matchReminders: boolean;
  communityDigest: boolean;
}

const DEFAULT_SUPPORTER_NOTIF_PREFS: SupporterNotificationPreferences = {
  goalAlerts: true,
  kickoffAlerts: true,
  matchReminders: true,
  communityDigest: false,
};

function notifKindToPreferenceKey(
  kind: SupporterNotifKind
): keyof SupporterNotificationPreferences {
  switch (kind) {
    case 'goal_live':
    case 'followed_player':
    case 'followed_club':
      return 'goalAlerts';
    case 'kickoff_favorite':
      return 'kickoffAlerts';
    case 'match_reminder':
      return 'matchReminders';
    case 'community_digest':
    case 'debate':
      return 'communityDigest';
  }
}

export function readSupporterNotificationPrefs(
  data: admin.firestore.DocumentData
): SupporterNotificationPreferences {
  const nested = data.notification_preferences as
    | { supporter?: Partial<SupporterNotificationPreferences> }
    | undefined;
  return { ...DEFAULT_SUPPORTER_NOTIF_PREFS, ...nested?.supporter };
}

export function shouldDeliverSupporterNotification(
  prefs: SupporterNotificationPreferences,
  kind: SupporterNotifKind
): boolean {
  return prefs[notifKindToPreferenceKey(kind)] === true;
}

export type SupporterPushResult = 'sent' | 'filtered' | 'no_token';

/** Push tribune filtrée par préférences Firestore (fallback gracieux sans token). */
export async function sendSupporterPushIfAllowed(
  uid: string,
  kind: SupporterNotifKind,
  payload: PushPayload
): Promise<SupporterPushResult> {
  const snap = await admin.firestore().doc(`users/${uid}`).get();
  if (!snap.exists) return 'no_token';

  const data = snap.data()!;
  if (data.role !== 'supporter') return 'filtered';

  const prefs = readSupporterNotificationPrefs(data);
  if (!shouldDeliverSupporterNotification(prefs, kind)) return 'filtered';

  const sent = await sendPushToUser(uid, payload);
  return sent ? 'sent' : 'no_token';
}
