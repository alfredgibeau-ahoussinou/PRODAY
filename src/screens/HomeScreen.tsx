import React, { useCallback, useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useSessionProfile } from '../hooks/useSessionProfile';
import { useAppTheme } from '../context/ProductLineContext';
import { useUnreadMessageCount } from '../hooks/useUnreadMessages';
import { useDashboardData } from '../hooks/useDashboardData';
import { useTabNavigation } from '../context/TabNavigationContext';
import { DiscoverScreen } from './DiscoverScreen';
import { PhysioDashboardScreen } from './medical/PhysioDashboardScreen';
import { HomeIaDashboard } from '../features/home/HomeIaDashboard';
import { SupporterHomeDashboard } from '../features/home/roles/SupporterHomeDashboard';
import { AmateurPlayerHomeDashboard } from '../features/home/roles/AmateurPlayerHomeDashboard';
import { resolveRoleHomeDashboard } from '../features/home/roles/resolveRoleHomeDashboard';
import { getUserProductLine } from '../utils/productLineAccess';
import { TeamManagementScreen } from './TeamManagementScreen';
import { SponsorsScreen } from './SponsorsScreen';
import { SponsorHubScreen } from './sponsor/SponsorHubScreen';
import { CrossfadeSwitch, PushScreenTransition } from '../components/motion';
import { ProDayScreenCanvas } from '../components/ui/ProDayScreenCanvas';
import { WeeklyQuestionHomePopup } from '../components/weeklyQuestion/WeeklyQuestionHomePopup';
import { canParticipateWeeklyQuestion } from '../utils/weeklyQuestionAccess';

type HomeOverlay = 'team' | 'sponsors' | 'partner-hub' | null;

/**
 * Accueil : découverte interactive avant connexion, dashboard personnel après.
 */
export const HomeScreen: React.FC = () => {
  const { loading } = useAuth();
  const profile = useSessionProfile();
  const { colors } = useAppTheme();
  const { productLine } = useAppTheme();
  const { count: unreadMessages } = useUnreadMessageCount();
  const { refresh } = useDashboardData(profile);
  const { pendingDashboardView, clearPendingDashboard } = useTabNavigation();
  const [refreshing, setRefreshing] = useState(false);
  const [overlay, setOverlay] = useState<HomeOverlay>(null);

  useEffect(() => {
    if (!pendingDashboardView || !profile) return;
    if (pendingDashboardView === 'gestion') setOverlay('team');
    else if (pendingDashboardView === 'sponsors') setOverlay('partner-hub');
    clearPendingDashboard();
  }, [pendingDashboardView, clearPendingDashboard, profile]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refresh();
    } finally {
      setRefreshing(false);
    }
  }, [refresh]);

  if (loading) {
    return (
      <View
        style={[
          styles.loader,
          { backgroundColor: colors.background },
        ]}
      >
        <ActivityIndicator size="large" color={colors.brand} />
      </View>
    );
  }

  const switchKey = profile?.uid ?? 'guest';

  const renderHomeDashboard = () => {
    if (!profile) return null;
    if (profile.role === 'physio') {
      return <PhysioDashboardScreen profile={profile} />;
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
    const userLine = getUserProductLine(profile);
    if (
      profile.role === 'player' &&
      (userLine === 'amateur' || userLine === 'homme' || userLine === 'woman')
    ) {
      return (
        <AmateurPlayerHomeDashboard
          profile={profile}
          unreadMessages={unreadMessages}
          onRefresh={handleRefresh}
          refreshing={refreshing}
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

  const isPhysioHome = profile?.role === 'physio';

  return (
    <CrossfadeSwitch switchKey={switchKey}>
      {profile ? (
        <View style={styles.root}>
          {isPhysioHome ? (
            renderHomeDashboard()
          ) : (
            <ProDayScreenCanvas>{renderHomeDashboard()}</ProDayScreenCanvas>
          )}

          <PushScreenTransition active={overlay === 'team'}>
            {overlay === 'team' ? (
              <TeamManagementScreen profile={profile} onBack={() => setOverlay(null)} />
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
