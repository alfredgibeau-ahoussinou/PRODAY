import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Linking,
  Alert,
  Platform,
  useWindowDimensions,
} from 'react-native';
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
import {
  Sora_600SemiBold,
  Sora_700Bold,
} from '@expo-google-fonts/sora';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { type MainTabId } from './src/navigation/MainTabs';
import {
  resolveMainTabScreen,
  shouldInjectShopTab,
} from './src/navigation/resolveMainTabScreen';
import { getMobileRailLayout } from './src/navigation/mobileTabConfig';
import {
  getGuestVisibleTabs,
  isGuestTabAllowed,
  resolveGuestTab,
} from './src/navigation/guestAccess';
import {
  guestProfilTabOpensAuthOverlay,
  isGuestAuthOverlayVisible,
} from './src/navigation/authOverlay';
import { AuthOverlayHost } from './src/navigation/AuthOverlayHost';
import {
  TabNavigationProvider,
  type AuthIntent,
  type SetActiveTabOptions,
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
import { PlayerThemeProvider } from './src/context/PlayerThemeContext';
import { JoueurProgressProvider } from './src/context/JoueurProgressContext';
import { JoueurShellExtras } from './src/features/joueur/JoueurShellExtras';
import { JoueurDashboardOverlayHost } from './src/features/joueur/JoueurDashboardOverlayHost';
import {
  isJoueurDashboardOverlayView,
  shouldStayOnTabForDashboard,
} from './src/navigation/joueurDashboardOverlay';
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

/** Bascule Club ↔ Président avec transition légère. */
function ClubPresidentShellSwitch({
  activeTab,
  onTabChange,
  adminPreviewBypass = false,
}: {
  activeTab: MainTabId;
  onTabChange: (tab: MainTabId) => void;
  /** Aperçu admin du pôle Président — n’assouplit pas l’ACL adhérents. */
  adminPreviewBypass?: boolean;
}) {
  const profile = useSessionProfile();
  const ws = useClubWorkspace();
  const { clubShellMode, setClubShellMode } = useProductLine();
  const wantPresident = clubShellMode === 'president' || adminPreviewBypass;
  const allowed =
    adminPreviewBypass ||
    canAccessPresidentPole({
      role: profile?.role,
      uid: profile?.uid,
      clubId: ws.clubId ?? profile?.profile?.club_id,
      clubOwnerUid: ws.club?.owner_uid,
    });

  useEffect(() => {
    if (!wantPresident || ws.loading || allowed) return;
    Alert.alert(PRESIDENT_POLE_DENIED_TITLE, PRESIDENT_POLE_DENIED_BODY);
    void setClubShellMode('club');
  }, [wantPresident, ws.loading, allowed, setClubShellMode]);

  const president = wantPresident && (ws.loading || allowed);
  return (
    <PoleShellTransition shellKey={president ? 'president' : 'club'}>
      {president ? (
        <PresidentAppShell />
      ) : (
        <ClubAppShell activeTab={activeTab} onTabChange={onTabChange} />
      )}
    </PoleShellTransition>
  );
}
import { AppErrorBoundary } from './src/components/AppErrorBoundary';
import { BottomTabBar } from './src/components/navigation/BottomTabBar';
import {
  desktopShellChrome,
  isDesktopWideLayout,
} from './src/theme/desktopShellChrome';
import { WomanSpaceDefaults } from './src/components/appSpace/WomanSpaceDefaults';
import { AnimatedTabContent, PoleShellTransition } from './src/components/motion';
import { ProDayMotionProvider } from './src/motion';
import { colors, spacing } from './src/theme/designTokens';
import { EmailVerificationScreen } from './src/screens/EmailVerificationScreen';
import { useUnreadMessageCount } from './src/hooks/useUnreadMessages';
import { AdminAppShell, AdminPreviewBanner } from './src/features/admin';
import { SponsorAppShell } from './src/navigation/SponsorAppShell';
import { SupporterAppShell } from './src/navigation/SupporterAppShell';
import { ParentAppShell } from './src/navigation/ParentAppShell';
import { parentPortalService } from './src/services/parentPortal.service';
import { ClubAppShell } from './src/features/club/shell/ClubAppShell';
import { useClubWorkspace } from './src/features/club/hooks/useClubWorkspace';
import { CoachAppShell } from './src/features/coach/shell/CoachAppShell';
import {
  canAccessPresidentPole,
  PRESIDENT_POLE_DENIED_BODY,
  PRESIDENT_POLE_DENIED_TITLE,
  PresidentAppShell,
  PresidentShellBridgeProvider,
} from './src/features/president';
import { COACH_SITE } from './src/content/coachPageIdentity';
import { PoleHelpChatbot } from './src/components/help/PoleHelpChatbot';
import { isJoueurPoleProductLine } from './src/utils/joueurPoleAccess';
import { useIsAdmin } from './src/hooks/useIsAdmin';
import { isPlatformAdminEmail } from './src/config/admin';
import {
  resolveAutoReturnTab,
  type CarpoolDeepLink,
  type DashboardDeepLink,
  type MatchsDeepLink,
  type MercatoDeepLink,
  type ProfileDeepLink,
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
import type { CarouselPoleId } from './src/models/CarouselPole';
import type { ProductLineId } from './src/models/ProductLine';
import { trafficService } from './src/services/traffic.service';
import { referralService } from './src/services/referral.service';
import { useAndroidBackHandler } from './src/hooks/useAndroidBackHandler';

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
    Sora_600SemiBold,
    Sora_700Bold,
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
                  <ProDayMotionProvider>
                    <AppShell />
                  </ProDayMotionProvider>
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
    setClubShellMode,
    parentGuestSupporter,
    returnParentFromSupporterGuest,
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
  const [adminPresidentPreview, setAdminPresidentPreview] = useState(false);
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
  const [pendingChosenPole, setPendingChosenPole] = useState<CarouselPoleId | null>(null);
  const [pendingSignupProductLine, setPendingSignupProductLine] = useState<ProductLineId | null>(
    null,
  );
  const [pendingSignupRole, setPendingSignupRole] = useState<UserRole | null>(null);
  const [pendingDashboardView, setPendingDashboardView] = useState<DashboardDeepLink | null>(
    null
  );
  const [returnTab, setReturnTab] = useState<MainTabId | null>(null);
  const { count: unreadCount, refresh: refreshUnread } = useUnreadMessageCount();
  const screenTime = useParentalScreenTime(profile);
  useParentalActivityJournal(profile, activeTab);
  const { locale, localeReady } = useTranslation();

  const isGuest = !authLoading && !profile;

  const visibleTabs = useMemo(() => {
    const tabs = isGuest
      ? getGuestVisibleTabs(productLine)
      : getVisibleMainTabs(productLine, sessionProfile?.role, sessionProfile);
    if (sessionProfile?.role === 'player') return tabs;
    return filterTabs(tabs);
  }, [isGuest, productLine, sessionProfile, filterTabs]);

  const screenTabs = useMemo((): MainTabId[] => {
    if (!shouldInjectShopTab(sessionProfile?.role, productLine)) {
      return visibleTabs;
    }
    if (visibleTabs.includes('shop')) return visibleTabs;
    return [...visibleTabs, 'shop'];
  }, [visibleTabs, sessionProfile?.role, productLine]);

  const primaryDockTabs = useMemo(() => {
    const rail = getMobileRailLayout(productLine, sessionProfile?.role, screenTabs);
    return new Set(rail.flat ?? []);
  }, [productLine, sessionProfile?.role, screenTabs]);

  useEffect(() => {
    if (activeTab === 'messages') refreshUnread();
  }, [activeTab, refreshUnread]);

  useEffect(() => {
    if (isGuest && !isGuestTabAllowed(activeTab, productLine)) {
      setActiveTab('home');
    }
  }, [isGuest, activeTab, productLine]);

  useEffect(() => {
    if (!profile) return;
    setPendingAuthIntent(null);
    setPendingSignupProductLine(null);
    setPendingSignupRole(null);
  }, [profile]);

  useEffect(() => {
    if (sessionProfile?.role === 'club' || sessionProfile?.role === 'coach') return;
    if (!screenTabs.includes(activeTab)) {
      setActiveTab(screenTabs[0] ?? 'home');
    }
  }, [screenTabs, activeTab, sessionProfile?.role]);

  useEffect(() => {
    if (productLineLoading || authLoading || !profile) return;
    if (isPlatformAdminEmail(profile.email)) return;
    if (profile.role === 'parent' && parentGuestSupporter) return;
    const userLine = getUserProductLine(profile);
    if (userLine !== productLine) {
      void setProductLine(userLine);
      return;
    }
    if (!profileMatchesActiveLine(profile, productLine)) {
      void signOut();
    }
  }, [
    productLine,
    productLineLoading,
    authLoading,
    profile,
    setProductLine,
    signOut,
    parentGuestSupporter,
  ]);

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

  const dismissAuthOverlay = useCallback(() => {
    setPendingAuthIntent(null);
    setPendingSignupProductLine(null);
    setPendingSignupRole(null);
    setPendingChosenPole(null);
  }, []);

  const handleTabPress = useCallback(
    (tab: MainTabId, options?: SetActiveTabOptions) => {
      if (tab !== activeTab) prodayHaptics.tabSwitch();
      if (guestProfilTabOpensAuthOverlay(tab, isGuest, activeTab)) {
        setPendingAuthIntent((prev) => prev ?? 'login');
        return;
      }
      if (
        tab !== activeTab &&
        isJoueurDashboardOverlayView(pendingDashboardView)
      ) {
        setPendingDashboardView(null);
      }
      const nextReturn = resolveAutoReturnTab(
        activeTab,
        tab,
        primaryDockTabs,
        options?.returnTo,
      );
      if (nextReturn !== undefined) {
        setReturnTab(nextReturn);
      }
      setActiveTab(isGuest ? resolveGuestTab(tab, productLine) : tab);
    },
    [activeTab, isGuest, pendingDashboardView, primaryDockTabs, productLine],
  );

  const goBackTab = useCallback(() => {
    if (!returnTab) return;
    const target = returnTab;
    setReturnTab(null);
    setActiveTab(isGuest ? resolveGuestTab(target, productLine) : target);
  }, [returnTab, isGuest, productLine]);

  const hasPendingModals = Boolean(
    pendingChatThreadId ||
      pendingTeamEventId ||
      pendingMatchsLink ||
      pendingMercatoView ||
      pendingProfileView ||
      pendingDashboardView ||
      pendingCarpoolLink,
  );

  const clearAllPendingModals = useCallback(() => {
    setPendingChatThreadId(null);
    setPendingTeamEventId(null);
    setPendingMatchsLink(null);
    setPendingMercatoView(null);
    setPendingProfileView(null);
    setPendingDashboardView(null);
    setPendingCarpoolLink(null);
  }, []);

  useAndroidBackHandler({
    activeTab,
    returnTab,
    pendingAuthIntent,
    hasPendingModals,
    onDismissAuth: dismissAuthOverlay,
    onClearPendingModals: clearAllPendingModals,
    onGoBackTab: goBackTab,
    onGoHome: () => setActiveTab('home'),
  });

  // Must stay above every conditional return — auth/role gates skip the main shell
  // and would otherwise drop this hook ("Rendered fewer hooks than expected").
  const { width: windowWidth } = useWindowDimensions();

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
    return (
      <AdminAppShell
        onPreviewUserApp={() => {
          setAdminPresidentPreview(false);
          setPreviewUserMode(true);
        }}
        onPreviewPresidentPole={() => {
          void setClubShellMode('president');
          setAdminPresidentPreview(true);
          setPreviewUserMode(true);
        }}
      />
    );
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
    const showSupporterGuest = parentGuestSupporter && isEnabled('supporter');
    if (parentGuestSupporter && !isEnabled('supporter')) {
      void returnParentFromSupporterGuest();
    }
    return (
      <SubscriptionProvider profile={sessionProfile ?? profile}>
        <PoleShellTransition shellKey={showSupporterGuest ? 'supporter' : 'parent'}>
          {showSupporterGuest ? <SupporterAppShell /> : <ParentAppShell />}
        </PoleShellTransition>
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

  const openChat = (threadId: string) => {
    if (isGuest) {
      setPendingAuthIntent('login');
      return;
    }
    setPendingChatThreadId(threadId);
    handleTabPress('messages');
  };

  const Screen = resolveMainTabScreen(activeTab, sessionProfile?.role, productLine);
  const disabledFlag = flagForTab(activeTab);
  const tabFeatureBlocked = disabledFlag != null && !isEnabled(disabledFlag);
  const blockedFlag = disabledFlag;
  const showFeatureDisabledPanel =
    tabFeatureBlocked && blockedFlag != null && sessionProfile?.role !== 'player';
  const isSponsor = isSponsorRole(sessionProfile?.role);
  const forcePresidentPreview = previewUserMode && adminPresidentPreview;
  const isClubShell = sessionProfile?.role === 'club' || forcePresidentPreview;
  const isCoachShell = sessionProfile?.role === 'coach' && !forcePresidentPreview;
  const usesRoleShell = isClubShell || isCoachShell;
  /** Expo web grand écran : rail latéral + colonne contenu (pas d’app macOS native). */
  const desktopWideTabs =
    Platform.OS === 'web' && isDesktopWideLayout(windowWidth) && !usesRoleShell;
  const joueurPoleActive = isJoueurPoleProductLine(productLine);
  const shellBackground = isSponsor
    ? SPONSOR_THEME.background
    : isCoachShell
      ? COACH_SITE.bg
      : isClubShell
        ? themeColors.background
        : themeColors.background;

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
    <PlayerThemeProvider>
    <JoueurProgressProvider profile={sessionProfile ?? profile}>
    <AppSpaceProvider>
      <WomanSpaceDefaults />
      {profile ? <MinorYouthSpaceBridge profile={profile} productLine={productLine} /> : null}
      <TabNavigationProvider
        value={{
          activeTab,
          setActiveTab: handleTabPress,
          returnTab,
          goBackTab,
          pendingChatThreadId,
          openChat,
          clearPendingChat: () => setPendingChatThreadId(null),
          pendingTeamEventId,
          openTeamEvent: (eventId) => {
            if (isGuest) {
              setPendingAuthIntent('login');
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
              return;
            }
            setPendingMatchsLink(link ?? { homeTab: 'season' });
            handleTabPress('matchs', activeTab === 'plus' ? { returnTo: 'plus' } : undefined);
          },
          clearPendingMatchs: () => setPendingMatchsLink(null),
          pendingMercatoView,
          openMercato: (view) => {
            if (isGuest) {
              setPendingAuthIntent('login');
              return;
            }
            setPendingMercatoView(view ?? 'home');
            handleTabPress('recrutement', activeTab === 'plus' ? { returnTo: 'plus' } : undefined);
          },
          clearPendingMercato: () => setPendingMercatoView(null),
          pendingProfileView,
          openProfile: (view) => {
            if (view) setPendingProfileView(view);
            handleTabPress('profil');
          },
          clearPendingProfile: () => setPendingProfileView(null),
          pendingAuthIntent,
          pendingChosenPole,
          openAuth: (intent, opts) => {
            if (opts?.pole) setPendingChosenPole(opts.pole);
            if (opts?.productLine) setPendingSignupProductLine(opts.productLine);
            if (opts?.role) setPendingSignupRole(opts.role);
            setPendingAuthIntent(intent);
          },
          clearPendingAuthIntent: () => {
            setPendingAuthIntent(null);
            setPendingChosenPole(null);
          },
          pendingSignupProductLine,
          pendingSignupRole,
          openSponsorSignup: (tier) => {
            void (async () => {
              await setProSignupPresetRole('sponsor');
              await setProductLine('sponsor');
              setPendingSignupProductLine('sponsor');
              setPendingSignupRole('sponsor');
              setPendingAuthIntent('signup');
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
            if (shouldStayOnTabForDashboard(view, sessionProfile?.role)) {
              return;
            }
            const preserveOrigin = activeTab !== 'home';
            handleTabPress(
              'home',
              preserveOrigin ? { returnTo: activeTab } : undefined,
            );
          },
          clearPendingDashboard: () => setPendingDashboardView(null),
          openShop: () =>
            handleTabPress('shop', activeTab === 'plus' ? { returnTo: 'plus' } : undefined),
          pendingCarpoolLink,
          openCarpool: (link) => {
            if (isGuest) {
              setPendingAuthIntent('login');
              return;
            }
            setPendingCarpoolLink(link ?? { chapter: 'reserver' });
            handleTabPress('covoiturage', activeTab === 'plus' ? { returnTo: 'plus' } : undefined);
          },
          clearPendingCarpool: () => setPendingCarpoolLink(null),
        }}
      >
        <LaunchIntroProvider>
          <SafeAreaView
            key={locale}
            style={[
              styles.root,
              { backgroundColor: shellBackground },
              desktopWideTabs ? styles.rootDesktop : null,
            ]}
            edges={previewUserMode ? [] : ['top', 'left', 'right']}
          >
            <StatusBar style="light" />
            {previewUserMode ? (
              <AdminPreviewBanner
                onExitPreview={() => {
                  setPreviewUserMode(false);
                  setAdminPresidentPreview(false);
                  void setClubShellMode('club');
                }}
              />
            ) : null}
            {profile ? <ProdayNotificationBridge /> : null}
            {profile ? <ProdayBrainBridge /> : null}
            {profile ? <ProdayCalendarSyncBridge /> : null}
            {profile && !joueurPoleActive ? <PoleHelpChatbot /> : null}
            {desktopWideTabs ? (
              <JoueurTabBarSlot
                activeTab={activeTab}
                onTabPress={handleTabPress}
                unreadCount={unreadCount}
                visibleTabs={screenTabs}
              />
            ) : null}
            <View
              style={[
                styles.screen,
                desktopWideTabs
                  ? [
                      styles.screenDesktop,
                      { maxWidth: desktopShellChrome.contentMaxWidth },
                    ]
                  : null,
              ]}
            >
              <JoueurGateGuard>
                {isClubShell ? (
                  <PresidentShellBridgeProvider>
                    <ClubPresidentShellSwitch
                      activeTab={activeTab}
                      onTabChange={handleTabPress}
                      adminPreviewBypass={forcePresidentPreview}
                    />
                  </PresidentShellBridgeProvider>
                ) : isCoachShell ? (
                  <CoachAppShell activeTab={activeTab} onTabChange={handleTabPress} />
                ) : (
                  <AnimatedTabContent activeTab={activeTab} tabOrder={screenTabs}>
                    {showFeatureDisabledPanel ? (
                      <FeatureDisabledPanel flag={blockedFlag} />
                    ) : (
                      <Screen />
                    )}
                  </AnimatedTabContent>
                )}
              </JoueurGateGuard>
            </View>
            {usesRoleShell || desktopWideTabs ? null : (
              <JoueurTabBarSlot
                activeTab={activeTab}
                onTabPress={handleTabPress}
                unreadCount={unreadCount}
                visibleTabs={screenTabs}
              />
            )}
            {isGuestAuthOverlayVisible(isGuest, pendingAuthIntent) ? (
              <AuthOverlayHost
                intent={pendingAuthIntent}
                signupProductLine={pendingSignupProductLine ?? undefined}
                signupInitialRole={pendingSignupRole ?? undefined}
                initialPole={pendingChosenPole ?? undefined}
                onDismiss={dismissAuthOverlay}
              />
            ) : null}
          </SafeAreaView>
          <JoueurShellExtras />
          <JoueurDashboardOverlayHost />
        </LaunchIntroProvider>
      </TabNavigationProvider>
    </AppSpaceProvider>
    </JoueurProgressProvider>
    </PlayerThemeProvider>
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
  rootDesktop: { flexDirection: 'row', alignItems: 'stretch' },
  screen: { flex: 1 },
  screenDesktop: {
    flex: 1,
    width: '100%',
    alignSelf: 'center',
    minWidth: 0,
  },
  adminLoader: {
    flex: 1,
    backgroundColor: colors.surfaceInverse,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
});
