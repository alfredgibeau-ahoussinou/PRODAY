import React, { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import {
  useFonts,
  Inter_400Regular,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
  Inter_900Black,
} from '@expo-google-fonts/inter';
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
import {
  TabNavigationProvider,
  type AuthIntent,
} from './src/context/TabNavigationContext';
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
  CarpoolDeepLink,
  DashboardDeepLink,
  MatchsDeepLink,
  MercatoDeepLink,
  ProfileDeepLink,
} from './src/utils/navigationDeepLink';
import { profileMatchesActiveLine } from './src/utils/productLineAccess';
import { getVisibleMainTabs } from './src/content/poleExperience';
import { useSessionProfile } from './src/hooks/useSessionProfile';
import { isSponsorRole, SPONSOR_THEME } from './src/content/sponsorExperience';
import { prodayHaptics } from './src/utils/prodayHaptics';
import { ProdayNotificationBridge } from './src/components/ProdayNotificationBridge';
import { ProdayBrainBridge } from './src/components/ProdayBrainBridge';
import { ProdayCalendarSyncBridge } from './src/components/ProdayCalendarSyncBridge';
import { useParentalScreenTime } from './src/hooks/useParentalScreenTime';
import { ParentalScreenTimeBlockedScreen } from './src/screens/ParentalScreenTimeBlockedScreen';

export default function App() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
    Inter_900Black,
  });

  if (!fontsLoaded) {
    return (
      <View style={styles.fontGate}>
        <ActivityIndicator size="large" color={colors.ink} />
      </View>
    );
  }

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
  const [pendingMatchsLink, setPendingMatchsLink] = useState<MatchsDeepLink | null>(null);
  const [pendingCarpoolLink, setPendingCarpoolLink] = useState<CarpoolDeepLink | null>(null);
  const [pendingMercatoView, setPendingMercatoView] = useState<MercatoDeepLink | null>(
    null
  );
  const [pendingProfileView, setPendingProfileView] = useState<ProfileDeepLink | null>(
    null
  );
  const [pendingAuthIntent, setPendingAuthIntent] = useState<AuthIntent | null>(null);
  const [pendingDashboardView, setPendingDashboardView] = useState<DashboardDeepLink | null>(
    null
  );
  const { count: unreadCount, refresh: refreshUnread } = useUnreadMessageCount();
  const screenTime = useParentalScreenTime(profile);

  const isGuest = !authLoading && !profile;

  const visibleTabs = useMemo(
    () =>
      isGuest
        ? getGuestVisibleTabs(productLine)
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
    if (isGuest && !isGuestTabAllowed(activeTab, productLine)) {
      setActiveTab('home');
    }
  }, [isGuest, activeTab, productLine]);

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

  useEffect(() => {
    if (authLoading || !profile || !pendingCarpoolLink) return;
    if (!screenTabs.includes('covoiturage') || activeTab === 'covoiturage') return;
    setActiveTab('covoiturage');
  }, [authLoading, profile, pendingCarpoolLink, screenTabs, activeTab]);

  useEffect(() => {
    if (authLoading || !profile || !pendingMercatoView) return;
    if (!screenTabs.includes('recrutement') || activeTab === 'recrutement') return;
    setActiveTab('recrutement');
  }, [authLoading, profile, pendingMercatoView, screenTabs, activeTab]);

  useEffect(() => {
    if (authLoading || !profile || !pendingMatchsLink) return;
    if (!screenTabs.includes('matchs') || activeTab === 'matchs') return;
    setActiveTab('matchs');
  }, [authLoading, profile, pendingMatchsLink, screenTabs, activeTab]);

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

  if (!authLoading && profile && screenTime.blocked) {
    return (
      <ParentalScreenTimeBlockedScreen
        minutesUsed={screenTime.minutesUsed}
        limitMinutes={screenTime.limitMinutes}
        reason={screenTime.reason}
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

  const handleTabPress = (tab: MainTabId) => {
    if (tab !== activeTab) prodayHaptics.tabSwitch();
    setActiveTab(isGuest ? resolveGuestTab(tab, productLine) : tab);
  };

  const openChat = (threadId: string) => {
    if (isGuest) {
      setPendingAuthIntent('login');
      handleTabPress('profil');
      return;
    }
    setPendingChatThreadId(threadId);
    setActiveTab('messages');
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
            if (isGuest) {
              setPendingAuthIntent('login');
              handleTabPress('profil');
              return;
            }
            setPendingTeamEventId(eventId);
            setPendingMatchsLink({ eventId, homeTab: 'season' });
            handleTabPress('matchs');
          },
          clearPendingTeamEvent: () => setPendingTeamEventId(null),
          pendingMatchsLink,
          openMatchs: (link) => {
            if (isGuest) {
              setPendingAuthIntent('login');
              handleTabPress('profil');
              return;
            }
            setPendingMatchsLink(link ?? { homeTab: 'season' });
            handleTabPress('matchs');
          },
          clearPendingMatchs: () => setPendingMatchsLink(null),
          pendingMercatoView,
          openMercato: (view) => {
            if (isGuest) {
              setPendingAuthIntent('login');
              handleTabPress('profil');
              return;
            }
            setPendingMercatoView(view ?? 'home');
            handleTabPress('recrutement');
          },
          clearPendingMercato: () => setPendingMercatoView(null),
          pendingProfileView,
          openProfile: (view) => {
            if (view) setPendingProfileView(view);
            handleTabPress('profil');
          },
          clearPendingProfile: () => setPendingProfileView(null),
          pendingAuthIntent,
          openAuth: (intent) => {
            setPendingAuthIntent(intent);
            handleTabPress('profil');
          },
          clearPendingAuthIntent: () => setPendingAuthIntent(null),
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
          pendingCarpoolLink,
          openCarpool: (link) => {
            if (isGuest) {
              setPendingAuthIntent('login');
              handleTabPress('profil');
              return;
            }
            setPendingCarpoolLink(link ?? { chapter: 'reserver' });
            handleTabPress('covoiturage');
          },
          clearPendingCarpool: () => setPendingCarpoolLink(null),
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
          {profile ? <ProdayNotificationBridge /> : null}
          {profile ? <ProdayBrainBridge /> : null}
          {profile ? <ProdayCalendarSyncBridge /> : null}
          <View style={styles.screen}>
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
  fontGate: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
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
