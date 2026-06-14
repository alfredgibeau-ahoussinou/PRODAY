import React, { useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTabNavigation } from '../context/TabNavigationContext';
import { useSeasonCalendar } from '../hooks/useAppData';
import { useProdayNotificationRouter } from '../hooks/useProdayNotificationRouter';
import { useProdayNotificationSync } from '../hooks/useProdayNotificationSync';

/** Sync notifications locales + routage deep link au tap. */
export const ProdayNotificationBridge: React.FC = () => {
  const { profile } = useAuth();
  const nav = useTabNavigation();
  const clubId = profile?.profile.club_id;
  const { events, matches } = useSeasonCalendar(profile?.uid, clubId);

  const routerActions = useMemo(
    () => ({
      openMatchs: nav.openMatchs,
      openCarpool: nav.openCarpool,
      openMercato: nav.openMercato,
    }),
    [nav.openMatchs, nav.openCarpool, nav.openMercato]
  );

  useProdayNotificationSync(profile ?? undefined, events, matches);
  useProdayNotificationRouter(routerActions);

  return null;
};
