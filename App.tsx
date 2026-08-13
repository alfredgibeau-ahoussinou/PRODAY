import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Linking } from 'react-native';
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
import {
  Syne_700Bold,
  Syne_800ExtraBold,
} from '@expo-google-fonts/syne';
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
import { JoueurSessionProvider } from './src/context/JoueurSessionContext';
import { JoueurProgressProvider } from './src/context/JoueurProgressContext';
import { JoueurLevelUpOverlay } from './src/features/joueur/JoueurLevelUpOverlay';
import {
  JoueurGateGuard,
  useJoueurGateBlocksTabs,
} from './src/features/joueur/JoueurGateGuard';

function JoueurTabBarSlot(props: {
  activeTab: MainTabId;
  onTabPress: (tab: MainTabId) => void;
  unreadCount: number;
  visibleTabs: MainTabId[];
}) {
  const blocked = useJoueurGateBlocksTabs();
  if (blocked) return null;
  return <BottomTabBar {...props} />;
}
import { AppErrorBoundary } from './src/components/AppErrorBoundary';
import { BottomTabBar } from './src/components/navigation/BottomTabBar';
import { WomanSpaceDefaults } from './src/components/appSpace/WomanSpaceDefaults';
import { AnimatedTabContent } from './src/components/motion';
import { colors, spacing } from './src/theme/designTokens';
import { EmailVerificationScreen } from './src/screens/EmailVerificationScreen';
import { useUnreadMessageCount } from './src/hooks/useUnreadMessages';
import { AdminAppShell } from './src/navigation/AdminAppShell';
import { SponsorAppShell } from './src/navigation/SponsorAppShell';
import { SupporterAppShell } from './src/navigation/SupporterAppShell';
import { ParentAppShell } from './src/navigation/ParentAppShell';
import { parentPortalService } from './src/services/parentPortal.service';
import { ClubAppShell } from './src/features/club/shell/ClubAppShell';
import { CoachAppShell } from './src/features/coach/shell/CoachAppShell';
import { AdminPreviewBanner } from './src/components/admin/AdminPreviewBanner';
import { PoleHelpChatbot } from './src/components/help/PoleHelpChatbot';
import { useIsAdmin } from './src/hooks/useIsAdmin';
import { isPlatformAdminEmail } from './src/config/admin';
import type {
  CarpoolDeepLink,
  DashboardDeepLink,
  MatchsDeepLink,
  MercatoDeepLink,
  ProfileDeepLink,
} from './src/utils/navigationDeepLink';
import { profileMatchesActiveLine, getUserProductLine } from './src/utils/productLineAccess';
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
import { MaintenanceBlockedScreen } from './src/screens/MaintenanceBlockedScreen';
import { FeatureDisabledPanel } from './src/components/platform/FeatureDisabledPanel';
import { MinorYouthSpaceBridge } from './src/components/appSpace/MinorYouthSpaceBridge';
import { PlatformConfigProvider, usePlatformConfig } from './src/context/PlatformConfigContext';
import { usePlatformFeatureFlags } from './src/hooks/usePlatformFeatureFlags';
import { RetiredRoleScreen } from './src/screens/RetiredRoleScreen';
import { isRetiredUserRole, isRetiredProductLine } from './src/utils/retiredRoles';
import type { UserRole } from './src/models/User';
import type { ProductLineId } from './src/models/ProductLine';
import { trafficService } from './src/services/traffic.service';
import { referralService } from './src/services/referral.service';

void SplashScreen.preventAutoHideAsync().catch(() => {});

export default function App() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
    Inter_900Black,
    Syne_700Bold,
    Syne_800ExtraBold,
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

  useEffect(() => {
    if (!fontsLoaded) return;
    trafficService.recordAppOpenOnce();
  }, [fontsLoaded]);

  useEffect(() => {
    void import('./src/services/revenueCat.service').then(({ revenueCatService }) => {
      void revenueCatService.init();
    });
  }, []);

  useEffect(() => {
    const capture = (url: string | null) => {
      if (!url) return;
      void referralService.savePendingCodeFromUrl(url);
    };
    void Linking.getInitialURL().then(capture);
    const sub = Linking.addEventListener('url', ({ url }) => capture(url));
    return () => sub.remove();
  }, []);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <AppErrorBoundary>
      <SafeAreaProvider onLayout={onLayoutRoot}>
        <AuthProvider>
          <LocaleProvider>
            <PlatformConfigProvider>
              <ProductLineProvider>
                <AuthGreetingProvider>
                  <LaunchIntroProvider>
                    <AppShell />
                  </LaunchIntroProvider>
                </AuthGreetingProvider>
              </ProductLineProvider>
            </PlatformConfigProvider>
          </LocaleProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </AppErrorBoundary>
  );
}

function AppShell() {
  const {
    colors: themeColors,
    isWoman,
    productLine,
    loading: productLineLoading,
    setProductLine,
    setProSignupPresetRole,
  } = useProductLine();
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
  const { isAdmin, claimLoading: adminClaimLoading, emailHint } = useIsAdmin();
  const shouldUseAdminShell = isAdmin || emailHint;
  const { config: platformConfig, loading: platformConfigLoading } = usePlatformConfig();
  const { filterTabs, isEnabled, flagForTab, disabledCopy } = usePlatformFeatureFlags();
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
      filterTabs(
        isGuest
          ? getGuestVisibleTabs(productLine)
          : getVisibleMainTabs(productLine, sessionProfile?.role, sessionProfile),
      ),
    [isGuest, productLine, sessionProfile, filterTabs],
  );

  const screenTabs = useMemo((): MainTabId[] => {
    if (!shouldInjectShopTab(sessionProfile?.role, productLine) || !isEnabled('shop')) {
      return visibleTabs;
    }
    if (visibleTabs.includes('shop')) return visibleTabs;
    return [...visibleTabs, 'shop'];
  }, [visibleTabs, sessionProfile?.role, productLine, isEnabled]);

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
    if (isPlatformAdminEmail(profile.email)) return;
    const userLine = getUserProductLine(profile);
    if (userLine !== productLine) {
      void setProductLine(userLine);
      return;
    }
    if (!profileMatchesActiveLine(profile, productLine)) {
      void signOut();
    }
  }, [productLine, productLineLoading, authLoading, profile, setProductLine, signOut]);

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
        uid={profile.uid}
        email={profile.email}
        variant="default"
        onCheckVerified={refreshFirebaseUser}
        onResend={resendEmailVerification}
        onSignOut={signOut}
      />
    );
  }

  // Maintenance : bloque invités + utilisateurs ; les admins (claim ou email plateforme) passent.
  const bypassMaintenance = isAdmin || emailHint;
  if (
    !platformConfigLoading &&
    platformConfig.maintenance_mode &&
    !bypassMaintenance
  ) {
    return <MaintenanceBlockedScreen message={platformConfig.maintenance_message} />;
  }

  // Rôles Agent / Recruteur / Santé retirés du produit.
  const sessionRole = sessionProfile?.role ?? profile?.role;
  if (
    !authLoading &&
    profile &&
    (isRetiredUserRole(sessionRole) || isRetiredProductLine(productLine)) &&
    !bypassMaintenance
  ) {
    return <RetiredRoleScreen />;
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

  if (!authLoading && profile && adminClaimLoading && shouldUseAdminShell && !previewUserMode) {
    return (
      <SafeAreaView style={styles.adminLoader} edges={['top', 'left', 'right', 'bottom']}>
        <StatusBar style="light" />
        <ActivityIndicator size="large" color={colors.accent} />
      </SafeAreaView>
    );
  }

  if (!authLoading && profile && shouldUseAdminShell && !previewUserMode) {
    return <AdminAppShell onPreviewUserApp={() => setPreviewUserMode(true)} />;
  }

  if (!authLoading && (sessionProfile ?? profile) && isSponsorRole((sessionProfile ?? profile)!.role)) {
    return (
      <SubscriptionProvider profile={sessionProfile ?? profile}>
        <SponsorAppShell />
      </SubscriptionProvider>
    );
  }

  if (
    !authLoading &&
    (sessionProfile ?? profile) &&
    parentPortalService.isParentRole((sessionProfile ?? profile)!.role)
  ) {
    return (
      <SubscriptionProvider profile={sessionProfile ?? profile}>
        <ParentAppShell />
      </SubscriptionProvider>
    );
  }

  if (
    !authLoading &&
    profile &&
    (profile.role === 'supporter' || getUserProductLine(profile) === 'supporter')
  ) {
    if (!isEnabled('supporter')) {
      const copy = disabledCopy('supporter');
      return (
        <SafeAreaView
          style={[styles.adminLoader, { backgroundColor: themeColors.background }]}
          edges={['top', 'left', 'right', 'bottom']}
        >
          <StatusBar style={isWoman ? 'dark' : 'light'} />
          <FeatureDisabledPanel
            flag="supporter"
            titleOverride={copy.title}
            messageOverride={copy.message}
          />
        </SafeAreaView>
      );
    }
    return (
      <SubscriptionProvider profile={sessionProfile ?? profile}>
        <SupporterAppShell />
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

  const Screen = resolveMainTabScreen(activeTab, sessionProfile?.role, productLine);
  const disabledFlag = flagForTab(activeTab);
  const tabFeatureBlocked = disabledFlag != null && !isEnabled(disabledFlag);
  const blockedFlag = disabledFlag;
  const isSponsor = isSponsorRole(sessionProfile?.role);
  const isClubShell = sessionProfile?.role === 'club';
  const isCoachShell = sessionProfile?.role === 'coach';
  const usesRoleShell = isClubShell || isCoachShell;
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
    <JoueurSessionProvider profile={sessionProfile ?? profile}>
    <JoueurProgressProvider profile={sessionProfile ?? profile}>
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
          openSponsorSignup: (tier) => {
            void (async () => {
              await setProSignupPresetRole('sponsor');
              await setProductLine('sponsor');
              setPendingSignupProductLine('sponsor');
              setPendingSignupRole('sponsor');
              setPendingAuthIntent('signup');
              handleTabPress('profil');
              void tier;
            })();
          },
          openPartnerSignup: () => {
            void (async () => {
              await setProSignupPresetRole('sponsor');
              await setProductLine('sponsor');
              setPendingSignupProductLine('sponsor');
              setPendingSignupRole('sponsor');
              setPendingAuthIntent('signup');
              handleTabPress('profil');
            })();
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
          <StatusBar style="light" />
          {previewUserMode ? (
            <AdminPreviewBanner onExitPreview={() => setPreviewUserMode(false)} />
          ) : null}
          {profile ? <ProdayNotificationBridge /> : null}
          {profile ? <ProdayBrainBridge /> : null}
          {profile ? <ProdayCalendarSyncBridge /> : null}
          {profile ? <PoleHelpChatbot /> : null}
          <View style={styles.screen}>
            <JoueurGateGuard>
              {isClubShell ? (
                <ClubAppShell activeTab={activeTab} onTabChange={handleTabPress} />
              ) : isCoachShell ? (
                <CoachAppShell activeTab={activeTab} onTabChange={handleTabPress} />
              ) : (
                <AnimatedTabContent activeTab={activeTab} tabOrder={screenTabs}>
                  {tabFeatureBlocked && blockedFlag ? (
                    <FeatureDisabledPanel flag={blockedFlag} />
                  ) : (
                    <Screen />
                  )}
                </AnimatedTabContent>
              )}
            </JoueurGateGuard>
          </View>
          {usesRoleShell ? null : (
            <JoueurTabBarSlot
              activeTab={activeTab}
              onTabPress={handleTabPress}
              unreadCount={unreadCount}
              visibleTabs={screenTabs}
            />
          )}
        </SafeAreaView>
      </TabNavigationProvider>
      <JoueurLevelUpOverlay />
    </AppSpaceProvider>
    </JoueurProgressProvider>
    </JoueurSessionProvider>
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
