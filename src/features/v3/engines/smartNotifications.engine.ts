export {
  rankNotifications,
  buildNotificationCandidates,
  scoreNotification,
} from '../../../core/notifications/notificationPriority.engine';
export type {
  PrioritizedNotification,
  NotificationKind,
} from '../../../core/notifications/notificationPriority.engine';

import type { PrioritizedNotification } from '../../../core/notifications/notificationPriority.engine';

export interface NotificationPeek {
  push: PrioritizedNotification[];
  inboxPreview: PrioritizedNotification[];
  total: number;
}

/** Aperçu inbox priorisée pour l’accueil (spec §4). */
export function peekNotifications(notifications: {
  push: PrioritizedNotification[];
  inbox: PrioritizedNotification[];
}): NotificationPeek {
  return {
    push: notifications.push.slice(0, 3),
    inboxPreview: notifications.inbox.slice(0, 2),
    total: notifications.push.length + notifications.inbox.length,
  };
}
