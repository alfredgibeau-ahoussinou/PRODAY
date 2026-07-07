import React, { useCallback, useMemo, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TabNavigationProvider } from '../context/TabNavigationContext';
import { SponsorDataProvider, useSponsorData } from '../context/SponsorDataContext';
import {
  SponsorShellProvider,
  type SponsorShellNavigate,
} from '../context/SponsorShellContext';
import { SponsorTopBar } from '../components/sponsor/SponsorTopBar';
import { SponsorDrawerMenu } from '../components/sponsor/SponsorDrawerMenu';
import { SponsorOverviewPage } from '../screens/sponsor/pages/SponsorOverviewPage';
import { SponsorCampaignsScreen } from '../screens/sponsor/SponsorCampaignsScreen';
import { SponsorNetworkScreen } from '../screens/sponsor/SponsorNetworkScreen';
import { SponsorProfileTabScreen } from '../screens/sponsor/SponsorProfileTabScreen';
import { SponsorContractScreen } from '../screens/sponsor/SponsorContractScreen';
import { SponsorContactsScreen } from '../screens/sponsor/SponsorContactsScreen';
import { SponsorHubScreen } from '../screens/sponsor/SponsorHubScreen';
import {
  resolveSponsorPageMeta,
  type SponsorContentSegment,
  type SponsorMainTabId,
  type SponsorRoute,
} from './sponsorTabConfig';
import { useSponsorStyles } from '../components/sponsor/sponsorStyles';
import { ProdayNotificationBridge } from '../components/ProdayNotificationBridge';
import { useSponsorTabNavigationBridge } from './sponsorTabNavigationBridge';
import { SubscriptionShell } from '../components/subscription/SubscriptionShell';
import { useSessionProfile } from '../hooks/useSessionProfile';
import { openSponsorProspectChat } from '../utils/openSponsorProspectChat';

export const SponsorAppShell: React.FC = () => (
  <SponsorDataProvider>
    <SponsorAppShellInner />
  </SponsorDataProvider>
);

const SponsorAppShellInner: React.FC = () => {
  const profile = useSessionProfile();
  const [activeTab, setActiveTab] = useState<SponsorMainTabId>('pilotage');
  const [activeSegment, setActiveSegment] = useState<SponsorContentSegment | undefined>();
  const [menuOpen, setMenuOpen] = useState(false);
  const [pendingChatThreadId, setPendingChatThreadId] = useState<string | null>(null);
  const [pendingChatDraft, setPendingChatDraft] = useState<string | null>(null);
  const { dashboard, unreadMessages } = useSponsorData();
  const { styles } = useSponsorStyles();
  const shellStyles = useMemo(() => createShellStyles(), []);

  const pageMeta = resolveSponsorPageMeta(activeTab, activeSegment);

  const navigate: SponsorShellNavigate = useCallback((route: SponsorRoute) => {
    setActiveTab(route.tab);
    setActiveSegment(route.segment);
  }, []);

  const openChat = useCallback((threadId: string, draft?: string) => {
    setPendingChatThreadId(threadId);
    setPendingChatDraft(draft ?? null);
    setActiveTab('reseau');
    setActiveSegment('messages');
  }, []);

  const clearPendingChat = useCallback(() => {
    setPendingChatThreadId(null);
    setPendingChatDraft(null);
  }, []);

  const shellValue = useMemo(
    () => ({
      navigate,
      pendingChatThreadId,
      pendingChatDraft,
      openChat,
      clearPendingChat,
    }),
    [navigate, pendingChatThreadId, pendingChatDraft, openChat, clearPendingChat],
  );

  const tabNavigation = useSponsorTabNavigationBridge({
    navigate,
    pendingChatThreadId,
    openChat,
    clearPendingChat,
  });

  const renderPage = () => {
    switch (activeTab) {
      case 'pilotage':
        return <SponsorOverviewPage />;
      case 'offres':
        return <SponsorCampaignsScreen shellMode fixedFilter="mine" />;
      case 'clubs':
        return <SponsorCampaignsScreen shellMode fixedFilter="clubs" />;
      case 'reseau':
        if (activeSegment === 'contacts') {
          return (
            <SponsorContactsScreen
              shellMode
              onOpenChat={(prospect) => {
                if (!profile) return;
                void openSponsorProspectChat(profile, prospect, (threadId, draft) => {
                  openChat(threadId, draft);
                });
              }}
            />
          );
        }
        return (
          <SponsorNetworkScreen
            shellMode
            initialSegment={activeSegment === 'prospects' ? 'prospects' : 'messages'}
          />
        );
      case 'marque':
        if (activeSegment === 'contract') {
          return <SponsorContractScreen shellMode />;
        }
        return <SponsorProfileTabScreen shellMode />;
      case 'tarifs':
        return (
          <SponsorHubScreen
            shellMode
            onBrowseOffers={() => navigate({ tab: 'offres' })}
          />
        );
      default:
        return <SponsorOverviewPage />;
    }
  };

  if (!profile) return null;

  return (
    <TabNavigationProvider value={tabNavigation}>
      <SubscriptionShell profile={profile}>
        <SponsorShellProvider value={shellValue}>
          <SafeAreaView style={styles.root} edges={['top', 'left', 'right', 'bottom']}>
            <StatusBar style="light" />
            <ProdayNotificationBridge />
            <SponsorTopBar
              title={pageMeta.title}
              subtitle={pageMeta.subtitle}
              onMenu={() => setMenuOpen(true)}
            />
            <View style={shellStyles.screen}>{renderPage()}</View>
            <SponsorDrawerMenu
              visible={menuOpen}
              activeTab={activeTab}
              activeSegment={activeSegment}
              badges={{
                messages: unreadMessages,
                prospects: dashboard.prospects.length,
                offers: dashboard.stats.activeOffers,
              }}
              onClose={() => setMenuOpen(false)}
              onNavigate={navigate}
            />
          </SafeAreaView>
        </SponsorShellProvider>
      </SubscriptionShell>
    </TabNavigationProvider>
  );
};

function createShellStyles() {
  return StyleSheet.create({
    screen: { flex: 1 },
  });
}
