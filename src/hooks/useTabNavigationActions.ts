import { useMemo } from 'react';
import { useTabNavigation } from '../context/TabNavigationContext';
import type { TabNavigationActions } from '../utils/navigationDeepLink';

/** Helpers navigation pour dashboard, profil, etc. */
export function useTabNavigationActions(): TabNavigationActions {
  const nav = useTabNavigation();

  return useMemo(
    () => ({
      setActiveTab: nav.setActiveTab,
      openTeamEvent: nav.openTeamEvent,
      openMatchs: (opts) => {
        nav.setActiveTab('matchs');
        nav.openMatchs(opts);
      },
      openMercato: (view) => {
        nav.setActiveTab('recrutement');
        nav.openMercato(view);
      },
      openProfile: (view) => {
        nav.setActiveTab('profil');
        nav.openProfile(view);
      },
      openDashboard: (view) => {
        nav.setActiveTab('home');
        nav.openDashboard(view);
      },
      openArenaTournament: (tournamentId) => {
        nav.openArenaTournament(tournamentId);
      },
    }),
    [nav]
  );
}
