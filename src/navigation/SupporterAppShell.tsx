import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { type MainTabId } from './MainTabs';
import { resolveMainTabScreen } from './resolveMainTabScreen';
import { TabNavigationProvider } from '../context/TabNavigationContext';
import { SupporterShellProvider } from '../context/SupporterShellContext';
import { BottomTabBar } from '../components/navigation/BottomTabBar';
import { AnimatedTabContent } from '../components/motion';
import { ProdayNotificationBridge } from '../components/ProdayNotificationBridge';
import { ProdayBrainBridge } from '../components/ProdayBrainBridge';
import { PoleHelpChatbot } from '../components/help/PoleHelpChatbot';
import { useSessionProfile } from '../hooks/useSessionProfile';
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
import {
  SUPPORTER_DOCK_TABS,
  type SupporterDockTabId,
} from '../features/supporter/navigation/supporterTabs';

/** Shell supporter minimal — dock Accueil · Matchs · Compétitions · Mes clubs · Vidéos · Profil. */
export const SupporterAppShell: React.FC = () => {
  const profile = useSessionProfile();
  const { productLine, colors: themeColors } = useProductLine();
  const [activeTab, setActiveTab] = useState<MainTabId>('home');
  const [returnTab, setReturnTab] = useState<MainTabId | null>(null);
  const [pendingChatThreadId, setPendingChatThreadId] = useState<string | null>(null);
  const [pendingMatchsLink, setPendingMatchsLink] = useState<MatchsDeepLink | null>(null);
  const [pendingProfileView, setPendingProfileView] = useState<ProfileDeepLink | null>(null);
  const [pendingDashboardView, setPendingDashboardView] = useState<DashboardDeepLink | null>(null);

  const dockTabs = useMemo(() => new Set<MainTabId>(SUPPORTER_DOCK_TABS), []);
  const screenTabs = useMemo((): MainTabId[] => [...SUPPORTER_DOCK_TABS], []);

  useEffect(() => {
    if (!screenTabs.includes(activeTab)) {
      setActiveTab(screenTabs[0] ?? 'home');
    }
  }, [screenTabs, activeTab]);

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
      handleTabPress('profil');
    },
    [handleTabPress],
  );

  const openMatchs = useCallback(
    (link?: MatchsDeepLink) => {
      setPendingMatchsLink(link ?? null);
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
    () => ({
      navigate,
      activeTab: activeTab as SupporterDockTabId,
    }),
    [navigate, activeTab],
  );

  if (!profile) return null;

  // Toujours le scaffold supporter (y compris parent guest : role reste « parent »).
  const Screen = resolveMainTabScreen(activeTab, 'supporter', productLine);

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
        openTeamEvent: () => handleTabPress('matchs'),
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
          if (view) setPendingDashboardView(view);
          handleTabPress('home');
        },
        clearPendingDashboard: () => setPendingDashboardView(null),
        openShop: () => undefined,
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
            visibleTabs={[...SUPPORTER_DOCK_TABS]}
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
