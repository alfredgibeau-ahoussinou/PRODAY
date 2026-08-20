import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { type MainTabId } from './MainTabs';
import { resolveMainTabScreen } from './resolveMainTabScreen';
import { TabNavigationProvider } from '../context/TabNavigationContext';
import { SupporterShellProvider } from '../context/SupporterShellContext';
import { BottomTabBar } from '../components/navigation/BottomTabBar';
import { SUPPORTER_SHELL_TABS } from './shells/productShellTabs';
import { AnimatedTabContent } from '../components/motion';
import { ProdayNotificationBridge } from '../components/ProdayNotificationBridge';
import { ProdayBrainBridge } from '../components/ProdayBrainBridge';
import { PoleHelpChatbot } from '../components/help/PoleHelpChatbot';
import { useSessionProfile } from '../hooks/useSessionProfile';
import { useUnreadMessageCount } from '../hooks/useUnreadMessages';
import { getVisibleMainTabs } from '../content/poleExperience';
import { useProductLine } from '../context/ProductLineContext';
import { prodayHaptics } from '../utils/prodayHaptics';
import {
  resolveAutoReturnTab,
  type CarpoolDeepLink,
  type DashboardDeepLink,
  type MatchsDeepLink,
  type ProfileDeepLink,
  type SetActiveTabOptions,
} from '../utils/navigationDeepLink';
import { stampMatchsDeepLink } from '../utils/supporterMatchsDeepLink';

/** Shell Supporter Space V3 — dock Accueil · Matchs · ProDay · Clubs · Profil. */
export const SupporterAppShell: React.FC = () => {
  const profile = useSessionProfile();
  const { productLine, colors: themeColors } = useProductLine();
  const [activeTab, setActiveTab] = useState<MainTabId>('home');
  const [returnTab, setReturnTab] = useState<MainTabId | null>(null);
  const [pendingChatThreadId, setPendingChatThreadId] = useState<string | null>(null);
  const [pendingMatchsLink, setPendingMatchsLink] = useState<MatchsDeepLink | null>(null);
  const [pendingProfileView, setPendingProfileView] = useState<ProfileDeepLink | null>(null);
  const [pendingDashboardView, setPendingDashboardView] = useState<DashboardDeepLink | null>(null);
  const { count: unreadCount, refresh: refreshUnread } = useUnreadMessageCount();

  const dockTabs = useMemo(() => new Set<MainTabId>(SUPPORTER_SHELL_TABS), []);

  const visibleTabs = useMemo(
    () => getVisibleMainTabs(productLine, profile?.role, profile),
    [productLine, profile],
  );

  const screenTabs = useMemo((): MainTabId[] => {
    const merged = [...visibleTabs];
    for (const tab of ['reels', 'messages', 'shop'] as MainTabId[]) {
      if (!merged.includes(tab)) merged.push(tab);
    }
    return merged;
  }, [visibleTabs]);

  useEffect(() => {
    if (!screenTabs.includes(activeTab)) {
      setActiveTab(screenTabs[0] ?? 'home');
    }
  }, [screenTabs, activeTab]);

  useEffect(() => {
    if (activeTab === 'messages') refreshUnread();
  }, [activeTab, refreshUnread]);

  const handleTabPress = useCallback(
    (tab: MainTabId, options?: SetActiveTabOptions) => {
      if (tab !== activeTab) prodayHaptics.tabSwitch();
      const nextReturn = resolveAutoReturnTab(activeTab, tab, dockTabs, options?.returnTo);
      if (nextReturn !== undefined) {
        setReturnTab(nextReturn);
      }
      setActiveTab(tab);
    },
    [activeTab, dockTabs],
  );

  const goBackTab = useCallback(() => {
    if (!returnTab) return;
    const target = returnTab;
    setReturnTab(null);
    setActiveTab(target);
  }, [returnTab]);

  const openChat = useCallback(
    (threadId: string) => {
      setPendingChatThreadId(threadId);
      handleTabPress('messages');
    },
    [handleTabPress],
  );

  const openMatchs = useCallback(
    (link?: MatchsDeepLink) => {
      setPendingMatchsLink(stampMatchsDeepLink(link ?? { supporterChapter: 'upcoming' }));
      handleTabPress('matchs');
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
        returnTab,
        goBackTab,
        pendingChatThreadId,
        openChat,
        clearPendingChat: () => setPendingChatThreadId(null),
        pendingTeamEventId: null,
        openTeamEvent: (eventId) => {
          setPendingMatchsLink(stampMatchsDeepLink({ eventId, homeTab: 'season' }));
          handleTabPress('matchs');
        },
        clearPendingTeamEvent: () => undefined,
        pendingMatchsLink,
        openMatchs,
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
          <View style={[styles.screen, { backgroundColor: themeColors.background }]}>
            <AnimatedTabContent activeTab={activeTab} tabOrder={screenTabs}>
              <Screen />
            </AnimatedTabContent>
          </View>
          <BottomTabBar
            activeTab={dockTabs.has(activeTab) ? activeTab : 'home'}
            onTabPress={handleTabPress}
            unreadCount={unreadCount}
            visibleTabs={[...SUPPORTER_SHELL_TABS]}
          />
          <View style={styles.helpLayer} pointerEvents="box-none">
            <PoleHelpChatbot />
          </View>
        </SafeAreaView>
      </SupporterShellProvider>
    </TabNavigationProvider>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  screen: { flex: 1 },
  helpLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 80,
    elevation: 80,
  },
});
