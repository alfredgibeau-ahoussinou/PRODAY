import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
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
import { LocaleProvider } from './src/context/LocaleContext';
import { AuthGreetingProvider } from './src/context/AuthGreetingProvider';
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
import { useUnreadMessageCount } from './src/hooks/useUnreadMessages';
import { AdminAppShell } from './src/navigation/AdminAppShell';
import { SponsorAppShell } from './src/navigation/SponsorAppShell';
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
import { useTranslation } from './src/context/LocaleContext';
import { useParentalScreenTime } from './src/hooks/useParentalScreenTime';
import { useParentalActivityJournal } from './src/hooks/useParentalActivityJournal';
import { ParentalScreenTimeBlockedScreen } from './src/screens/ParentalScreenTimeBlockedScreen';
import { MinorYouthSpaceBridge } from './src/components/appSpace/MinorYouthSpaceBridge';
import type { UserRole } from './src/models/User';
import type { ProductLineId } from './src/models/ProductLine';

void SplashScreen.preventAutoHideAsync().catch(() => {});

export default function App() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
    Inter_900Black,
  });

  const onLayoutRoot = useCallback(() => {
    if (fontsLoaded) {
      void SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  useEffect(() => {
    if (!fontsLoaded) return;
    void SplashScreen.hideAsync().catch(() => {});
  }, [fontsLoaded]);

  useEffect(() => {
    const failSafe = setTimeout(() => {
      void SplashScreen.hideAsync().catch(() => {});
    }, 2500);
    return () => clearTimeout(failSafe);
  }, []);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaProvider onLayout={onLayoutRoot}>
      <AuthProvider>
        <LocaleProvider>
            <ProductLineProvider>
              <AuthGreetingProvider>
                <LaunchIntroProvider>
                  <AppShell />
                </LaunchIntroProvider>
              </AuthGreetingProvider>
            </ProductLineProvider>
        </LocaleProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

function AppShell() {
  const { colors: themeColors, isWoman, productLine, loading: productLineLoading, setProductLine } =
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
  const [pendingSignupProductLine, setPendingSignupProductLine] = useState<ProductLineId | null>(
    null,
  );
  const [pendingSignupRole, setPendingSignupRole] = useState<UserRole | null>(null);
  const [pendingDashboardView, setPendingDashboardView] = useState<DashboardDeepLink | null>(
    null
  );
  const { count: unreadCount, refresh: refreshUnread } = useUnreadMessageCount();
  const screenTime = useParentalScreenTime(profile);
  useParentalActivityJournal(profile, activeTab);
  const { locale, localeReady } = useTranslation();

  const isGuest = !authLoading && !profile;

  const visibleTabs = useMemo(
    () =>
      isGuest
        ? getGuestVisibleTabs(productLine)
        : getVisibleMainTabs(productLine, sessionProfile?.role, sessionProfile),
    [isGuest, productLine, sessionProfile],
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
        uid={profile.uid}
        parentalSettings={profile.parental_settings}
        minutesUsed={screenTime.minutesUsed}
        limitMinutes={screenTime.limitMinutes}
        reason={screenTime.reason}
        onSignOut={signOut}
        onUnlockRequested={() => void refreshProfile().then(() => screenTime.refresh())}
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

  if (!authLoading && profile && isSponsorRole(profile.role)) {
    return (
      <SubscriptionProvider profile={sessionProfile ?? profile}>
        <SponsorAppShell />
      </SubscriptionProvider>
    );
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

  if (!localeReady) {
    return (
      <SafeAreaView
        style={[styles.adminLoader, { backgroundColor: shellBackground }]}
        edges={['top', 'left', 'right', 'bottom']}
      >
        <ActivityIndicator size="large" color={themeColors.accent} />
      </SafeAreaView>
    );
  }

  const mainApp = (
    <AppSpaceProvider>
      <WomanSpaceDefaults />
      {profile ? <MinorYouthSpaceBridge profile={profile} productLine={productLine} /> : null}
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
          pendingSignupProductLine,
          pendingSignupRole,
          openSponsorSignup: () => {
            void setProductLine('pro');
            setPendingSignupProductLine('pro');
            setPendingSignupRole('sponsor');
            setPendingAuthIntent('signup');
            handleTabPress('profil');
          },
          openPartnerSignup: () => {
            void setProductLine('pro');
            setPendingSignupProductLine('pro');
            setPendingSignupRole('sponsor');
            setPendingAuthIntent('signup');
            handleTabPress('profil');
          },
          clearSignupPreset: () => {
            setPendingSignupProductLine(null);
            setPendingSignupRole(null);
          },
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
          key={locale}
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
