import React, { createContext, useContext } from 'react';
import type { MainTabId } from '../navigation/mainTabConfig';

import type { UserRole } from '../models/User';
import type { ProductLineId } from '../models/ProductLine';

export type AuthIntent = 'login' | 'signup';
import type {
  CarpoolDeepLink,
  DashboardDeepLink,
  MatchsDeepLink,
  MercatoDeepLink,
  ProfileDeepLink,
} from '../utils/navigationDeepLink';

export interface TabNavigationContextValue {
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
  openMercato: (view?: MercatoDeepLink) => void;
  clearPendingMercato: () => void;

  pendingProfileView: ProfileDeepLink | null;
  openProfile: (view?: ProfileDeepLink) => void;
  clearPendingProfile: () => void;

  pendingAuthIntent: AuthIntent | null;
  openAuth: (intent: AuthIntent) => void;
  clearPendingAuthIntent: () => void;

  /** Inscription sponsor : ligne Pro + rôle sponsor. */
  pendingSignupProductLine: ProductLineId | null;
  pendingSignupRole: UserRole | null;
  openSponsorSignup: (tier?: 'free' | 'pro') => void;
  /** @deprecated Utiliser openSponsorSignup */
  openPartnerSignup?: (tier?: 'free' | 'pro') => void;
  clearSignupPreset: () => void;

  pendingDashboardView: DashboardDeepLink | null;
  openDashboard: (view: DashboardDeepLink) => void;
  clearPendingDashboard: () => void;

  openShop: () => void;

  pendingCarpoolLink: CarpoolDeepLink | null;
  openCarpool: (link?: CarpoolDeepLink) => void;
  clearPendingCarpool: () => void;
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

export function useTabNavigationOptional(): TabNavigationContextValue | null {
  return useContext(TabNavigationContext);
}
