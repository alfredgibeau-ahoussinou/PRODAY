import type { SupporterNotificationPreferences } from '../services/supporterPreferences.service';

/** Catégories push tribune — mappées aux toggles profil supporter. */
export type SupporterNotifKind =
  | 'goal_live'
  | 'kickoff_favorite'
  | 'match_reminder'
  | 'followed_player'
  | 'followed_club'
  | 'community_digest'
  | 'debate';

export function notifKindToPreferenceKey(
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

export function shouldDeliverSupporterNotification(
  prefs: SupporterNotificationPreferences,
  kind: SupporterNotifKind
): boolean {
  return prefs[notifKindToPreferenceKey(kind)] === true;
}

export function filterSupporterNotifications<T extends { kind: SupporterNotifKind }>(
  prefs: SupporterNotificationPreferences,
  items: T[]
): T[] {
  return items.filter((item) => shouldDeliverSupporterNotification(prefs, item.kind));
}
