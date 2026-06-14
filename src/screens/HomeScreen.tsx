import React, { useCallback, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useSessionProfile } from '../hooks/useSessionProfile';
import { useAppTheme } from '../context/ProductLineContext';
import { useUnreadMessageCount } from '../hooks/useUnreadMessages';
import { useDashboardData } from '../hooks/useDashboardData';
import { isV3ShellEnabled } from '../config/featureFlags';
import { DiscoverScreen } from './DiscoverScreen';
import { DashboardScreen } from './DashboardScreen';
import { PhysioDashboardScreen } from './medical/PhysioDashboardScreen';
import { SponsorDashboardScreen } from './sponsor/SponsorDashboardScreen';
import { HomeIaDashboard } from '../features/home/HomeIaDashboard';
import { CrossfadeSwitch } from '../components/motion';
import { useExperienceTheme } from '../hooks/useExperienceTheme';
import { SPONSOR_THEME } from '../content/sponsorExperience';
import { ProDayScreenCanvas } from '../components/ui/ProDayScreenCanvas';

/**
 * Accueil : découverte interactive avant connexion, dashboard personnel après.
 * Phase 0 : pilote HomeIaDashboard si EXPO_PUBLIC_V3_SHELL=1.
 */
export const HomeScreen: React.FC = () => {
  const { loading } = useAuth();
  const profile = useSessionProfile();
  const { colors, isSponsorExperience } = useExperienceTheme();
  const { productLine } = useAppTheme();
  const { count: unreadMessages } = useUnreadMessageCount();
  const { refresh } = useDashboardData(profile);
  const [refreshing, setRefreshing] = useState(false);
  const v3Home = isV3ShellEnabled();

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
        profile.role === 'physio' ? (
          <PhysioDashboardScreen profile={profile} />
        ) : profile.role === 'sponsor' ? (
          <SponsorDashboardScreen profile={profile} />
        ) : v3Home ? (
          <ProDayScreenCanvas>
            <HomeIaDashboard
              profile={profile}
              productLine={productLine}
              unreadMessages={unreadMessages}
              onRefresh={handleRefresh}
              refreshing={refreshing}
            />
          </ProDayScreenCanvas>
        ) : (
          <DashboardScreen profile={profile} />
        )
      ) : (
        <DiscoverScreen />
      )}
    </CrossfadeSwitch>
  );
};

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
