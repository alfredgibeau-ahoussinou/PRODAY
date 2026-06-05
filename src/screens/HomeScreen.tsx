import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useSessionProfile } from '../hooks/useSessionProfile';
import { DiscoverScreen } from './DiscoverScreen';
import { DashboardScreen } from './DashboardScreen';
import { PhysioDashboardScreen } from './medical/PhysioDashboardScreen';
import { SponsorDashboardScreen } from './sponsor/SponsorDashboardScreen';
import { CrossfadeSwitch } from '../components/motion';
import { useExperienceTheme } from '../hooks/useExperienceTheme';
import { SPONSOR_THEME } from '../content/sponsorExperience';

/**
 * Accueil : découverte interactive avant connexion, dashboard personnel après.
 */
export const HomeScreen: React.FC = () => {
  const { loading } = useAuth();
  const profile = useSessionProfile();
  const { colors, isSponsorExperience } = useExperienceTheme();

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
