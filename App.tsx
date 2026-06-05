import React, { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { type MainTabId } from './src/navigation/MainTabs';
import {
  resolveMainTabScreen,
  shouldInjectShopTab,
} from './src/navigation/resolveMainTabScreen';
import {
  getGuestVisibleTabs,
  isGuestTabAllowed,
  resolveGuestTab,
} from './src/navigation/guestAccess';
import { TabNavigationProvider } from './src/context/TabNavigationContext';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { SubscriptionProvider } from './src/context/SubscriptionContext';
import { SubscriptionShell } from './src/components/subscription/SubscriptionShell';
import { AppSpaceProvider } from './src/context/AppSpaceContext';
import { ProductLineProvider, useProductLine } from './src/context/ProductLineContext';
import { LaunchIntroProvider } from './src/context/LaunchIntroContext';
import { BottomTabBar } from './src/components/navigation/BottomTabBar';
import { WomanSpaceDefaults } from './src/components/appSpace/WomanSpaceDefaults';
import { AnimatedTabContent } from './src/components/motion';
import { colors, spacing } from './src/theme/designTokens';
import { EmailVerificationScreen } from './src/screens/EmailVerificationScreen';
import { OnboardingDocumentsScreen } from './src/screens/OnboardingDocumentsScreen';
import { needsOnboardingDocumentUpload } from './src/utils/onboardingGate';
import { useUnreadMessageCount } from './src/hooks/useUnreadMessages';
import { AdminAppShell } from './src/navigation/AdminAppShell';
import { AdminPreviewBanner } from './src/components/admin/AdminPreviewBanner';
import { useIsAdmin } from './src/hooks/useIsAdmin';
import type {
  DashboardDeepLink,
  MercatoDeepLink,
  ProfileDeepLink,
} from './src/utils/navigationDeepLink';
import { profileMatchesActiveLine } from './src/utils/productLineAccess';
import { getVisibleMainTabs } from './src/content/poleExperience';
import { useSessionProfile } from './src/hooks/useSessionProfile';
import { isSponsorRole, SPONSOR_THEME } from './src/content/sponsorExperience';

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ProductLineProvider>
          <LaunchIntroProvider>
            <AppShell />
          </LaunchIntroProvider>
        </ProductLineProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

function AppShell() {
  const { colors: themeColors, isWoman, productLine, loading: productLineLoading } =
    useProductLine();
  const sessionProfile = useSessionProfile();
  const {
    profile,
    loading: authLoading,
    needsEmailVerification,
    refreshFirebaseUser,
    refreshProfile,
    resendEmailVerification,
    signOut,
  } = useAuth();
  const { isAdmin, claimLoading: adminClaimLoading } = useIsAdmin();
  const [previewUserMode, setPreviewUserMode] = useState(false);
  const [activeTab, setActiveTab] = useState<MainTabId>('home');
  const [pendingChatThreadId, setPendingChatThreadId] = useState<string | null>(null);
  const [pendingTeamEventId, setPendingTeamEventId] = useState<string | null>(null);
  const [pendingMatchsLink, setPendingMatchsLink] = useState<{
    eventId?: string;
    homeTab?: 'season' | 'matches';
  } | null>(null);
  const [pendingMercatoView, setPendingMercatoView] = useState<MercatoDeepLink | null>(
    null
  );
  const [pendingProfileView, setPendingProfileView] = useState<ProfileDeepLink | null>(
    null
  );
  const [pendingDashboardView, setPendingDashboardView] = useState<DashboardDeepLink | null>(
    null
  );
  const [pendingArenaTournamentId, setPendingArenaTournamentId] = useState<
    string | null
  >(null);
  const { count: unreadCount, refresh: refreshUnread } = useUnreadMessageCount();

  const isGuest = !authLoading && !profile;

  const visibleTabs = useMemo(
    () =>
      isGuest
        ? getGuestVisibleTabs()
        : getVisibleMainTabs(productLine, sessionProfile?.role),
    [isGuest, productLine, sessionProfile?.role]
  );

  const screenTabs = useMemo((): MainTabId[] => {
    if (!shouldInjectShopTab(sessionProfile?.role)) return visibleTabs;
    if (visibleTabs.includes('shop')) return visibleTabs;
    return [...visibleTabs, 'shop'];
  }, [visibleTabs, sessionProfile?.role]);

  useEffect(() => {
    if (activeTab === 'messages') refreshUnread();
  }, [activeTab, refreshUnread]);

  useEffect(() => {
    if (isGuest && !isGuestTabAllowed(activeTab)) {
      setActiveTab('home');
    }
  }, [isGuest, activeTab]);

  useEffect(() => {
    if (!screenTabs.includes(activeTab)) {
      setActiveTab(screenTabs[0] ?? 'home');
    }
  }, [screenTabs, activeTab]);

  useEffect(() => {
    if (productLineLoading || authLoading || !profile) return;
    if (!profileMatchesActiveLine(profile, productLine)) {
      void signOut();
    }
  }, [productLine, productLineLoading, authLoading, profile, signOut]);

  if (!authLoading && profile && needsOnboardingDocumentUpload(profile)) {
    return (
      <OnboardingDocumentsScreen
        profile={profile}
        onComplete={refreshProfile}
        onSignOut={signOut}
      />
    );
  }

  if (!authLoading && profile && needsEmailVerification) {
    return (
      <EmailVerificationScreen
        email={profile.email}
        onCheckVerified={refreshFirebaseUser}
        onResend={resendEmailVerification}
        onSignOut={signOut}
      />
    );
  }

  if (!authLoading && profile && adminClaimLoading && !previewUserMode) {
    return (
      <SafeAreaView style={styles.adminLoader} edges={['top', 'left', 'right', 'bottom']}>
        <StatusBar style="light" />
        <ActivityIndicator size="large" color={colors.accent} />
      </SafeAreaView>
    );
  }

  if (!authLoading && profile && isAdmin && !previewUserMode) {
    return <AdminAppShell onPreviewUserApp={() => setPreviewUserMode(true)} />;
  }

  const openChat = (threadId: string) => {
    if (isGuest) {
      setActiveTab('profil');
      return;
    }
    setPendingChatThreadId(threadId);
    setActiveTab('messages');
  };

  const handleTabPress = (tab: MainTabId) => {
    setActiveTab(isGuest ? resolveGuestTab(tab) : tab);
  };

  const Screen = resolveMainTabScreen(activeTab, sessionProfile?.role);
  const isSponsor = isSponsorRole(sessionProfile?.role);
  const shellBackground = isSponsor ? SPONSOR_THEME.background : themeColors.background;

  const mainApp = (
    <AppSpaceProvider>
      <WomanSpaceDefaults />
      <TabNavigationProvider
        value={{
          activeTab,
          setActiveTab: handleTabPress,
          pendingChatThreadId,
          openChat,
          clearPendingChat: () => setPendingChatThreadId(null),
          pendingTeamEventId,
          openTeamEvent: (eventId) => {
            setPendingTeamEventId(eventId);
            setPendingMatchsLink({ eventId, homeTab: 'season' });
            handleTabPress('matchs');
          },
          clearPendingTeamEvent: () => setPendingTeamEventId(null),
          pendingMatchsLink,
          openMatchs: (link) => {
            setPendingMatchsLink(link ?? { homeTab: 'season' });
            handleTabPress('matchs');
          },
          clearPendingMatchs: () => setPendingMatchsLink(null),
          pendingMercatoView,
          openMercato: (view) => {
            setPendingMercatoView(view);
            handleTabPress('recrutement');
          },
          clearPendingMercato: () => setPendingMercatoView(null),
          pendingProfileView,
          openProfile: (view) => {
            if (view) setPendingProfileView(view);
            handleTabPress('profil');
          },
          clearPendingProfile: () => setPendingProfileView(null),
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
          pendingArenaTournamentId,
          openArenaTournament: (tournamentId) => {
            setPendingArenaTournamentId(tournamentId);
            setPendingDashboardView('arena');
            handleTabPress('home');
          },
          clearPendingArenaTournament: () => setPendingArenaTournamentId(null),
          openShop: () => handleTabPress('shop'),
        }}
      >
        <SafeAreaView
          style={[styles.root, { backgroundColor: shellBackground }]}
          edges={previewUserMode ? [] : ['top', 'left', 'right']}
        >
          <StatusBar style={isSponsor ? 'light' : 'dark'} />
          {previewUserMode ? (
            <AdminPreviewBanner onExitPreview={() => setPreviewUserMode(false)} />
          ) : null}
          <View style={styles.screen}>
            <AnimatedTabContent activeTab={activeTab} tabOrder={screenTabs}>
              <Screen />
            </AnimatedTabContent>
          </View>
          {!isGuest ? (
            <BottomTabBar
              activeTab={activeTab}
              onTabPress={handleTabPress}
              unreadCount={unreadCount}
            />
          ) : null}
        </SafeAreaView>
      </TabNavigationProvider>
    </AppSpaceProvider>
  );

  if (profile) {
    const billingProfile = sessionProfile ?? profile;
    return (
      <SubscriptionProvider profile={billingProfile}>
        <SubscriptionShell profile={billingProfile}>{mainApp}</SubscriptionShell>
      </SubscriptionProvider>
    );
  }

  return mainApp;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  screen: { flex: 1 },
  adminLoader: {
    flex: 1,
    backgroundColor: colors.surfaceInverse,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
});
