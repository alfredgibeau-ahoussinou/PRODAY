import { useMemo } from 'react';
import type { TabNavigationContextValue } from '../context/TabNavigationContext';
import type { MainTabId } from './mainTabConfig';
import type { SponsorShellNavigate } from '../context/SponsorShellContext';
import { sponsorTabRoute } from '../context/SponsorShellContext';

const noop = () => {};

function mapMainTabToSponsor(tab: MainTabId): Parameters<SponsorShellNavigate>[0] {
  switch (tab) {
    case 'messages':
      return sponsorTabRoute('reseau', 'messages');
    case 'matchs':
      return sponsorTabRoute('offres');
    case 'profil':
      return sponsorTabRoute('marque');
    case 'home':
      return sponsorTabRoute('pilotage');
    default:
      return sponsorTabRoute('pilotage');
  }
}

type SponsorTabNavBridgeParams = {
  navigate: SponsorShellNavigate;
  pendingChatThreadId: string | null;
  openChat: (threadId: string) => void;
  clearPendingChat: () => void;
};

/** Adaptateur TabNavigation pour le shell partenaire (bridges + écrans legacy). */
export function useSponsorTabNavigationBridge({
  navigate,
  pendingChatThreadId,
  openChat,
  clearPendingChat,
}: SponsorTabNavBridgeParams): TabNavigationContextValue {
  return useMemo(
    () => ({
      activeTab: 'home',
      setActiveTab: (tab: MainTabId) => navigate(mapMainTabToSponsor(tab)),
      pendingChatThreadId,
      openChat,
      clearPendingChat,
      pendingTeamEventId: null,
      openTeamEvent: noop,
      clearPendingTeamEvent: noop,
      pendingMatchsLink: null,
      openMatchs: () => navigate(sponsorTabRoute('clubs')),
      clearPendingMatchs: noop,
      pendingMercatoView: null,
      openMercato: () => navigate(sponsorTabRoute('offres')),
      clearPendingMercato: noop,
      pendingProfileView: null,
      openProfile: () => navigate(sponsorTabRoute('marque')),
      clearPendingProfile: noop,
      pendingAuthIntent: null,
      openAuth: noop,
      clearPendingAuthIntent: noop,
      pendingSignupProductLine: null,
      pendingSignupRole: null,
      openSponsorSignup: noop,
      openPartnerSignup: noop,
      clearSignupPreset: noop,
      pendingDashboardView: null,
      openDashboard: () => navigate(sponsorTabRoute('pilotage')),
      clearPendingDashboard: noop,
      openShop: noop,
      pendingCarpoolLink: null,
      openCarpool: noop,
      clearPendingCarpool: noop,
    }),
    [navigate, pendingChatThreadId, openChat, clearPendingChat],
  );
}
