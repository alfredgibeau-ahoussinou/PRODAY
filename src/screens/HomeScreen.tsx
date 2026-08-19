import React, { useCallback, useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useSessionProfile } from '../hooks/useSessionProfile';
import { useAppTheme } from '../context/ProductLineContext';
import { useUnreadMessageCount } from '../hooks/useUnreadMessages';
import { useDashboardData } from '../hooks/useDashboardData';
import { useTabNavigation } from '../context/TabNavigationContext';
import { DiscoverScreen } from './DiscoverScreen';
import { RetiredRoleScreen } from './RetiredRoleScreen';
import { isRetiredUserRole } from '../utils/retiredRoles';
import { HomeIaDashboard } from '../features/home/HomeIaDashboard';
import { SupporterHomeDashboard } from '../features/home/roles/SupporterHomeDashboard';
import { AmateurPlayerHomeDashboard } from '../features/home/roles/AmateurPlayerHomeDashboard';
import { resolveRoleHomeDashboard } from '../features/home/roles/resolveRoleHomeDashboard';
import { getUserProductLine } from '../utils/productLineAccess';
import { TeamManagementScreen } from './TeamManagementScreen';
import { SponsorsScreen } from './SponsorsScreen';
import { SponsorHubScreen } from './sponsor/SponsorHubScreen';
import { SmartTacticsPortalScreen } from './smartTactics/SmartTacticsPortalScreen';
import { TrainHubScreen } from './training/TrainHubScreen';
import { JoueurTacticsCoachScreen } from './joueur/JoueurTacticsCoachScreen';
import { JoueurWhoAreYouGateScreen } from './joueur/JoueurWhoAreYouGateScreen';
import { CrossfadeSwitch, PushScreenTransition } from '../components/motion';
import { ProDayScreenCanvas } from '../components/ui/ProDayScreenCanvas';
import { WeeklyQuestionHomePopup } from '../components/weeklyQuestion/WeeklyQuestionHomePopup';
import { canParticipateWeeklyQuestion } from '../utils/weeklyQuestionAccess';
import {
  type JoueurGateProfile,
} from '../utils/joueurGateStorage';
import { useJoueurSession } from '../context/JoueurSessionContext';
import { isJoueurPolePlayer } from '../utils/joueurPoleAccess';

type HomeOverlay =
  | 'team'
  | 'sponsors'
  | 'partner-hub'
  | 'smart_tactics'
  | 'train'
  | 'train_ai'
  | 'train_coach'
  | 'tactics_coach'
  | null;

/**
 * Accueil : découverte interactive avant connexion, dashboard personnel après.
 */
export const HomeScreen: React.FC = () => {
  const { loading, refreshProfile } = useAuth();
  const profile = useSessionProfile();
  const { colors } = useAppTheme();
  const { productLine } = useAppTheme();
  const { count: unreadMessages } = useUnreadMessageCount();
  const { refresh } = useDashboardData(profile);
  const { pendingDashboardView, clearPendingDashboard, goBackTab, returnTab } = useTabNavigation();
  const [refreshing, setRefreshing] = useState(false);
  const [overlay, setOverlay] = useState<HomeOverlay>(null);
  const joueurSession = useJoueurSession();

  const userLine = profile ? getUserProductLine(profile) : null;
  const isJoueurPlayer = isJoueurPolePlayer(profile);
  const isAmateurPlayer = isJoueurPlayer;

  const joueurGate = joueurSession?.gate ?? null;
  const joueurGateReady = !isJoueurPlayer || Boolean(joueurSession?.ready);
  const needsJoueurGate = Boolean(isJoueurPlayer && joueurSession?.needsGate);

  useEffect(() => {
    if (!pendingDashboardView || !profile) return;
    if (pendingDashboardView === 'gestion') setOverlay('team');
    else if (pendingDashboardView === 'smart_tactics') setOverlay('smart_tactics');
    else if (pendingDashboardView === 'train') setOverlay('train');
    else if (pendingDashboardView === 'train_ai') setOverlay('train_ai');
    else if (pendingDashboardView === 'train_coach') setOverlay('train_coach');
    else if (pendingDashboardView === 'tactics_coach') setOverlay('tactics_coach');
    else if (pendingDashboardView === 'sponsors') {
      setOverlay(profile.role === 'sponsor' ? 'partner-hub' : 'sponsors');
    }
    clearPendingDashboard();
  }, [pendingDashboardView, clearPendingDashboard, profile]);

  const closeDashboardOverlay = useCallback(() => {
    setOverlay(null);
    if (returnTab) goBackTab();
  }, [goBackTab, returnTab]);

  const trainInitialView =
    overlay === 'train_ai' ? 'ai' : overlay === 'train_coach' ? 'coach' : 'hub';

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refresh();
    } finally {
      setRefreshing(false);
    }
  }, [refresh]);

  if (loading || (isAmateurPlayer && !joueurGateReady)) {
    return (
      <View style={[styles.loader, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.brand} />
      </View>
    );
  }

  if (profile && needsJoueurGate) {
    return (
      <JoueurWhoAreYouGateScreen
        uid={profile.uid}
        onComplete={(gate: JoueurGateProfile) => {
          joueurSession?.completeGate(gate);
          void refreshProfile();
        }}
      />
    );
  }

  const switchKey = profile?.uid ?? 'guest';

  const renderHomeDashboard = () => {
    if (!profile) return null;
    if (isRetiredUserRole(profile.role)) {
      return <RetiredRoleScreen />;
    }
    if (profile.role === 'supporter') {
      return (
        <SupporterHomeDashboard
          profile={profile}
          unreadMessages={unreadMessages}
          onRefresh={handleRefresh}
          refreshing={refreshing}
        />
      );
    }
    if (isAmateurPlayer) {
      return (
        <AmateurPlayerHomeDashboard
          profile={profile}
          unreadMessages={unreadMessages}
          onRefresh={handleRefresh}
          refreshing={refreshing}
          joueurGate={joueurGate}
        />
      );
    }
    const roleHome = resolveRoleHomeDashboard(profile.role);
    if (roleHome) {
      const RoleHome = roleHome;
      return (
        <RoleHome
          profile={profile}
          unreadMessages={unreadMessages}
          onRefresh={handleRefresh}
          refreshing={refreshing}
        />
      );
    }
    return (
      <HomeIaDashboard
        profile={profile}
        productLine={productLine}
        unreadMessages={unreadMessages}
        onRefresh={handleRefresh}
        refreshing={refreshing}
      />
    );
  };

  return (
    <CrossfadeSwitch switchKey={switchKey}>
      {profile ? (
        <View style={styles.root}>
          <ProDayScreenCanvas>{renderHomeDashboard()}</ProDayScreenCanvas>

          <PushScreenTransition active={overlay === 'team'}>
            {overlay === 'team' ? (
              <TeamManagementScreen profile={profile} onBack={() => setOverlay(null)} />
            ) : null}
          </PushScreenTransition>

          <PushScreenTransition active={overlay === 'smart_tactics'}>
            {overlay === 'smart_tactics' ? (
              <SmartTacticsPortalScreen onBack={() => setOverlay(null)} />
            ) : null}
          </PushScreenTransition>

          <PushScreenTransition active={overlay === 'train' || overlay === 'train_ai' || overlay === 'train_coach'}>
            {overlay === 'train' || overlay === 'train_ai' || overlay === 'train_coach' ? (
              <TrainHubScreen
                onBack={closeDashboardOverlay}
                initialView={trainInitialView}
              />
            ) : null}
          </PushScreenTransition>

          <PushScreenTransition active={overlay === 'tactics_coach'}>
            {overlay === 'tactics_coach' ? (
              <JoueurTacticsCoachScreen onBack={closeDashboardOverlay} />
            ) : null}
          </PushScreenTransition>

          <PushScreenTransition active={overlay === 'partner-hub'}>
            {overlay === 'partner-hub' ? (
              <SponsorHubScreen
                onBack={() => setOverlay(null)}
                onBrowseOffers={() => setOverlay('sponsors')}
              />
            ) : null}
          </PushScreenTransition>

          <PushScreenTransition active={overlay === 'sponsors'}>
            {overlay === 'sponsors' ? (
              <SponsorsScreen
                onBack={() => setOverlay('partner-hub')}
                onPartnerHub={() => setOverlay('partner-hub')}
              />
            ) : null}
          </PushScreenTransition>

          {profile && canParticipateWeeklyQuestion(profile.role) ? (
            <WeeklyQuestionHomePopup profile={profile} />
          ) : null}
        </View>
      ) : (
        <DiscoverScreen />
      )}
    </CrossfadeSwitch>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
