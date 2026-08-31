import { useMemo } from 'react';
import { useTabNavigation } from '../context/TabNavigationContext';
import type { TabNavigationActions } from '../utils/navigationDeepLink';

/** Helpers navigation pour dashboard, profil, etc. */
export function useTabNavigationActions(): TabNavigationActions {
  const nav = useTabNavigation();

  return useMemo(
    () => ({
      setActiveTab: nav.setActiveTab,
      goBackTab: nav.goBackTab,
      openTeamEvent: nav.openTeamEvent,
      openMatchs: (opts) => nav.openMatchs(opts),
      openMercato: (view) => nav.openMercato(view),
      openProfile: (view) => nav.openProfile(view),
      openDashboard: (view) => nav.openDashboard(view),
      openShop: () => nav.openShop(),
      openCarpool: (opts) => nav.openCarpool(opts),
    }),
    [nav],
  );
}
