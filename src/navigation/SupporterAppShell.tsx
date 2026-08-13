import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { type MainTabId } from './MainTabs';
import {
  resolveMainTabScreen,
  shouldInjectShopTab,
} from './resolveMainTabScreen';
import { TabNavigationProvider } from '../context/TabNavigationContext';
import { SupporterShellProvider } from '../context/SupporterShellContext';
import { BottomTabBar } from '../components/navigation/BottomTabBar';
import { AnimatedTabContent } from '../components/motion';
import { ProdayNotificationBridge } from '../components/ProdayNotificationBridge';
import { ProdayBrainBridge } from '../components/ProdayBrainBridge';
import { PoleHelpChatbot } from '../components/help/PoleHelpChatbot';
import { useSessionProfile } from '../hooks/useSessionProfile';
import { useUnreadMessageCount } from '../hooks/useUnreadMessages';
import { getVisibleMainTabs } from '../content/poleExperience';
import { useProductLine } from '../context/ProductLineContext';
import { prodayHaptics } from '../utils/prodayHaptics';
import type {
  CarpoolDeepLink,
  DashboardDeepLink,
  MatchsDeepLink,
  MercatoDeepLink,
  ProfileDeepLink,
} from '../utils/navigationDeepLink';

export const SupporterAppShell: React.FC = () => {
  const profile = useSessionProfile();
  const { productLine, colors: themeColors } = useProductLine();
  const [activeTab, setActiveTab] = useState<MainTabId>('home');
  const [pendingChatThreadId, setPendingChatThreadId] = useState<string | null>(null);
  const [pendingMatchsLink, setPendingMatchsLink] = useState<MatchsDeepLink | null>(null);
  const [pendingProfileView, setPendingProfileView] = useState<ProfileDeepLink | null>(null);
  const [pendingDashboardView, setPendingDashboardView] = useState<DashboardDeepLink | null>(null);
  const { count: unreadCount, refresh: refreshUnread } = useUnreadMessageCount();

  const visibleTabs = useMemo(
    () => getVisibleMainTabs(productLine, profile?.role, profile),
    [productLine, profile],
  );

  const screenTabs = useMemo((): MainTabId[] => {
    if (!shouldInjectShopTab(profile?.role, productLine)) return visibleTabs;
    if (visibleTabs.includes('shop')) return visibleTabs;
    return [...visibleTabs, 'shop'];
  }, [visibleTabs, profile?.role, productLine]);

  useEffect(() => {
    if (!screenTabs.includes(activeTab)) {
      setActiveTab(screenTabs[0] ?? 'home');
    }
  }, [screenTabs, activeTab]);

  useEffect(() => {
    if (activeTab === 'messages') refreshUnread();
  }, [activeTab, refreshUnread]);

  const handleTabPress = useCallback(
    (tab: MainTabId) => {
      if (tab !== activeTab) prodayHaptics.tabSwitch();
      setActiveTab(tab);
    },
    [activeTab],
  );

  const openChat = useCallback(
    (threadId: string) => {
      setPendingChatThreadId(threadId);
      handleTabPress('messages');
    },
    [handleTabPress],
  );

  const navigate = useCallback(
    (tab: MainTabId) => {
      handleTabPress(tab);
    },
    [handleTabPress],
  );

  const shellValue = useMemo(
    () => ({ navigate, activeTab }),
    [navigate, activeTab],
  );

  if (!profile) return null;

  const Screen = resolveMainTabScreen(activeTab, profile.role, productLine);

  return (
    <TabNavigationProvider
      value={{
        activeTab,
        setActiveTab: handleTabPress,
        pendingChatThreadId,
        openChat,
        clearPendingChat: () => setPendingChatThreadId(null),
        pendingTeamEventId: null,
        openTeamEvent: (eventId) => {
          setPendingMatchsLink({ eventId, homeTab: 'season' });
          handleTabPress('matchs');
        },
        clearPendingTeamEvent: () => undefined,
        pendingMatchsLink,
        openMatchs: (link) => {
          setPendingMatchsLink(link ?? { homeTab: 'season' });
          handleTabPress('matchs');
        },
        clearPendingMatchs: () => setPendingMatchsLink(null),
        pendingMercatoView: null,
        openMercato: () => handleTabPress('feed'),
        clearPendingMercato: () => undefined,
        pendingProfileView,
        openProfile: (view) => {
          if (view) setPendingProfileView(view);
          handleTabPress('profil');
        },
        clearPendingProfile: () => setPendingProfileView(null),
        pendingAuthIntent: null,
        openAuth: () => handleTabPress('profil'),
        clearPendingAuthIntent: () => undefined,
        pendingSignupProductLine: null,
        pendingSignupRole: null,
        openSponsorSignup: () => undefined,
        openPartnerSignup: () => undefined,
        clearSignupPreset: () => undefined,
        pendingDashboardView,
        openDashboard: (view) => {
          if (view === 'feed') {
            handleTabPress('feed');
            return;
          }
          setPendingDashboardView(view);
          handleTabPress('home');
        },
        clearPendingDashboard: () => setPendingDashboardView(null),
        openShop: () => handleTabPress('shop'),
        pendingCarpoolLink: null as CarpoolDeepLink | null,
        openCarpool: () => undefined,
        clearPendingCarpool: () => undefined,
      }}
    >
      <SupporterShellProvider value={shellValue}>
          <SafeAreaView
            style={[styles.root, { backgroundColor: themeColors.background }]}
            edges={['top', 'left', 'right']}
          >
            <StatusBar style="light" />
            <ProdayNotificationBridge />
            <ProdayBrainBridge />
            <PoleHelpChatbot />
            <View style={[styles.screen, { backgroundColor: themeColors.background }]}>
              <AnimatedTabContent activeTab={activeTab} tabOrder={screenTabs}>
                <Screen />
              </AnimatedTabContent>
            </View>
            <BottomTabBar
              activeTab={activeTab}
              onTabPress={handleTabPress}
              unreadCount={unreadCount}
              visibleTabs={screenTabs}
            />
          </SafeAreaView>
        </SupporterShellProvider>
    </TabNavigationProvider>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  screen: { flex: 1 },
});
