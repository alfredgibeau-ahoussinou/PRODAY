import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { MAIN_TABS, type MainTabId } from './src/navigation/MainTabs';
import { isGuestTabAllowed } from './src/navigation/guestAccess';
import { TabNavigationProvider } from './src/context/TabNavigationContext';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { AppSpaceProvider } from './src/context/AppSpaceContext';
import { BottomTabBar } from './src/components/navigation/BottomTabBar';
import { AnimatedTabContent } from './src/components/motion';
import { colors, spacing } from './src/theme/designTokens';
import { EmailVerificationScreen } from './src/screens/EmailVerificationScreen';
import { useUnreadMessageCount } from './src/hooks/useUnreadMessages';
import { AdminAppShell } from './src/navigation/AdminAppShell';
import { AdminPreviewBanner } from './src/components/admin/AdminPreviewBanner';
import { useIsAdmin } from './src/hooks/useIsAdmin';
import type {
  DashboardDeepLink,
  MercatoDeepLink,
} from './src/utils/navigationDeepLink';

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AppShell />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

function AppShell() {
  const {
    profile,
    loading: authLoading,
    needsEmailVerification,
    refreshFirebaseUser,
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
  const [pendingProfileView, setPendingProfileView] = useState<'applications' | null>(
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

  useEffect(() => {
    if (activeTab === 'messages') refreshUnread();
  }, [activeTab, refreshUnread]);

  useEffect(() => {
    if (isGuest && !isGuestTabAllowed(activeTab)) {
      setActiveTab('home');
    }
  }, [isGuest, activeTab]);

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
      Alert.alert(
        'Connexion requise',
        'Connectez-vous pour envoyer des messages.',
        [
          { text: 'Annuler', style: 'cancel' },
          { text: 'Se connecter', onPress: () => setActiveTab('profil') },
        ]
      );
      return;
    }
    setPendingChatThreadId(threadId);
    setActiveTab('messages');
  };

  const handleTabPress = (tab: MainTabId) => {
    if (isGuest && !isGuestTabAllowed(tab)) {
      const labels: Record<MainTabId, string> = {
        home: 'Accueil',
        recrutement: 'Recrutement',
        matchs: 'Matchs',
        messages: 'Messagerie',
        profil: 'Profil',
      };
      Alert.alert(
        'Connexion requise',
        `L'onglet ${labels[tab]} est réservé aux membres. Créez un compte gratuit pour y accéder.`,
        [
          { text: 'Plus tard', style: 'cancel' },
          { text: 'Créer mon compte', onPress: () => setActiveTab('profil') },
        ]
      );
      return;
    }
    setActiveTab(tab);
  };

  const current = MAIN_TABS.find((t) => t.id === activeTab)!;
  const Screen = current.screen;

  return (
    <AppSpaceProvider>
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
      }}
    >
      <SafeAreaView style={styles.root} edges={previewUserMode ? [] : ['top', 'left', 'right']}>
        <StatusBar style="dark" />
        {previewUserMode ? (
          <AdminPreviewBanner onExitPreview={() => setPreviewUserMode(false)} />
        ) : null}
        <View style={styles.screen}>
          <AnimatedTabContent activeTab={activeTab}>
            <Screen />
          </AnimatedTabContent>
        </View>
        <BottomTabBar
          activeTab={activeTab}
          onTabPress={handleTabPress}
          unreadCount={isGuest ? 0 : unreadCount}
          guestMode={isGuest}
        />
      </SafeAreaView>
    </TabNavigationProvider>
    </AppSpaceProvider>
  );
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
