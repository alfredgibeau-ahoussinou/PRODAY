import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import type { ProdayNotificationData } from '../services/prodayLocalNotifications.service';
import type { MatchsDeepLink } from '../utils/navigationDeepLink';

type RouterActions = {
  openMatchs: (link?: MatchsDeepLink) => void;
  openCarpool: (link?: { chapter?: 'reserver'; eventId?: string }) => void;
  openMercato: (view: 'detections' | 'create_post' | 'stages') => void;
};

function routeNotificationData(data: ProdayNotificationData, actions: RouterActions): void {
  switch (data.type) {
    case 'convocation_j1':
    case 'convocation_h2':
      if (data.eventId) {
        actions.openMatchs({
          eventId: data.eventId,
          homeTab: data.homeTab ?? 'convocations',
          hubChapter: data.hubChapter ?? 'apercu',
        });
      } else {
        actions.openMatchs({ homeTab: 'convocations' });
      }
      break;
    case 'carpool_seat':
      if (data.eventId) {
        actions.openMatchs({
          eventId: data.eventId,
          homeTab: 'convocations',
          hubChapter: 'apercu',
        });
      }
      break;
    case 'friendly_nearby':
      actions.openMatchs({ homeTab: 'matches' });
      break;
    case 'mercato_alert':
      actions.openMercato('detections');
      break;
    default:
      break;
  }
}

/** Écoute les taps sur notifications locales / push et ouvre le bon écran. */
export function useProdayNotificationRouter(actions: RouterActions): void {
  const actionsRef = useRef(actions);
  actionsRef.current = actions;

  useEffect(() => {
    if (Platform.OS === 'web') return;

    let mounted = true;
    let subResponse: { remove: () => void } | undefined;
    const coldStartIdRef = { current: null as string | null };

    void (async () => {
      try {
        const Notifications = await import('expo-notifications');
        if (!mounted) return;

        const last = await Notifications.getLastNotificationResponseAsync();
        if (last?.notification.request.content.data) {
          coldStartIdRef.current = last.notification.request.identifier;
          routeNotificationData(
            last.notification.request.content.data as ProdayNotificationData,
            actionsRef.current
          );
        }

        subResponse = Notifications.addNotificationResponseReceivedListener((response) => {
          if (response.notification.request.identifier === coldStartIdRef.current) return;
          const data = response.notification.request.content.data as ProdayNotificationData;
          if (data?.type) routeNotificationData(data, actionsRef.current);
        });
      } catch {
        /* simulateur / permissions */
      }
    })();

    return () => {
      mounted = false;
      subResponse?.remove();
    };
  }, []);
}
