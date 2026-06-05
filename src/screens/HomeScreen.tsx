import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { DiscoverScreen } from './DiscoverScreen';
import { DashboardScreen } from './DashboardScreen';
import { CrossfadeSwitch } from '../components/motion';
import { useAppTheme } from '../context/ProductLineContext';

/**
 * Accueil : découverte interactive avant connexion, dashboard personnel après.
 */
export const HomeScreen: React.FC = () => {
  const { profile, loading } = useAuth();
  const { colors } = useAppTheme();

  if (loading) {
    return (
      <View style={[styles.loader, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.brand} />
      </View>
    );
  }

  const switchKey = profile?.uid ?? 'guest';

  return (
    <CrossfadeSwitch switchKey={switchKey}>
      {profile ? <DashboardScreen profile={profile} /> : <DiscoverScreen />}
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
