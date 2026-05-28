import React, { createContext, useContext } from 'react';
import type { MainTabId } from '../navigation/mainTabConfig';
import type {
  DashboardDeepLink,
  MatchsDeepLink,
  MercatoDeepLink,
  ProfileDeepLink,
} from '../utils/navigationDeepLink';

interface TabNavigationContextValue {
  activeTab: MainTabId;
  setActiveTab: (tab: MainTabId) => void;

  pendingChatThreadId: string | null;
  openChat: (threadId: string) => void;
  clearPendingChat: () => void;

  pendingTeamEventId: string | null;
  openTeamEvent: (eventId: string) => void;
  clearPendingTeamEvent: () => void;

  pendingMatchsLink: MatchsDeepLink | null;
  openMatchs: (link?: MatchsDeepLink) => void;
  clearPendingMatchs: () => void;

  pendingMercatoView: MercatoDeepLink | null;
  openMercato: (view: MercatoDeepLink) => void;
  clearPendingMercato: () => void;

  pendingProfileView: ProfileDeepLink | null;
  openProfile: (view?: ProfileDeepLink) => void;
  clearPendingProfile: () => void;

  pendingDashboardView: DashboardDeepLink | null;
  openDashboard: (view: DashboardDeepLink) => void;
  clearPendingDashboard: () => void;

  pendingArenaTournamentId: string | null;
  openArenaTournament: (tournamentId: string) => void;
  clearPendingArenaTournament: () => void;
}

const TabNavigationContext = createContext<TabNavigationContextValue | null>(null);

export const TabNavigationProvider: React.FC<{
  value: TabNavigationContextValue;
  children: React.ReactNode;
}> = ({ value, children }) => (
  <TabNavigationContext.Provider value={value}>{children}</TabNavigationContext.Provider>
);

export function useTabNavigation(): TabNavigationContextValue {
  const ctx = useContext(TabNavigationContext);
  if (!ctx) throw new Error('useTabNavigation must be used within TabNavigationProvider');
  return ctx;
}
