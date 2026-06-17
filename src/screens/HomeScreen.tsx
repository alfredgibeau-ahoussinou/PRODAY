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
import { SponsorDashboardScreen } from './sponsor/SponsorDashboardScreen';
import { HomeIaDashboard } from '../features/home/HomeIaDashboard';
import { TeamManagementScreen } from './TeamManagementScreen';
import { SponsorsScreen } from './SponsorsScreen';
import { CrossfadeSwitch, PushScreenTransition } from '../components/motion';
import { useExperienceTheme } from '../hooks/useExperienceTheme';
import { SPONSOR_THEME } from '../content/sponsorExperience';
import { ProDayScreenCanvas } from '../components/ui/ProDayScreenCanvas';

type HomeOverlay = 'team' | 'sponsors' | null;

/**
 * Accueil : découverte interactive avant connexion, dashboard personnel après.
 */
export const HomeScreen: React.FC = () => {
  const { loading } = useAuth();
  const profile = useSessionProfile();
  const { colors, isSponsorExperience } = useExperienceTheme();
  const { productLine } = useAppTheme();
  const { count: unreadMessages } = useUnreadMessageCount();
  const { refresh } = useDashboardData(profile);
  const { pendingDashboardView, clearPendingDashboard } = useTabNavigation();
  const [refreshing, setRefreshing] = useState(false);
  const [overlay, setOverlay] = useState<HomeOverlay>(null);

  useEffect(() => {
    if (!pendingDashboardView || !profile) return;
    if (pendingDashboardView === 'gestion') setOverlay('team');
    else if (pendingDashboardView === 'sponsors') setOverlay('sponsors');
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
          { backgroundColor: isSponsorExperience ? SPONSOR_THEME.background : colors.background },
        ]}
      >
        <ActivityIndicator
          size="large"
          color={isSponsorExperience ? SPONSOR_THEME.primary : colors.brand}
        />
      </View>
    );
  }

  const switchKey = profile?.uid ?? 'guest';

  return (
    <CrossfadeSwitch switchKey={switchKey}>
      {profile ? (
        <View style={styles.root}>
          {profile.role === 'physio' ? (
            <PhysioDashboardScreen profile={profile} />
          ) : profile.role === 'sponsor' ? (
            <SponsorDashboardScreen profile={profile} />
          ) : (
            <ProDayScreenCanvas>
              <HomeIaDashboard
                profile={profile}
                productLine={productLine}
                unreadMessages={unreadMessages}
                onRefresh={handleRefresh}
                refreshing={refreshing}
              />
            </ProDayScreenCanvas>
          )}

          <PushScreenTransition active={overlay === 'team'}>
            {overlay === 'team' ? (
              <TeamManagementScreen profile={profile} onBack={() => setOverlay(null)} />
            ) : null}
          </PushScreenTransition>

          <PushScreenTransition active={overlay === 'sponsors'}>
            {overlay === 'sponsors' ? (
              <SponsorsScreen onBack={() => setOverlay(null)} />
            ) : null}
          </PushScreenTransition>
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
