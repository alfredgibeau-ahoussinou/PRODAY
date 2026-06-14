import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useSessionProfile } from '../hooks/useSessionProfile';
import { useTabNavigation } from '../context/TabNavigationContext';
import { useAppTheme } from '../context/ProductLineContext';
import { ProDayConfigNotice } from '../components/ui/ProDayConfigNotice';
import { ProfileScreen } from './ProfileScreen';
import { AuthScreen } from './AuthScreen';

/** Onglet Profil — fiche connectée ou connexion directe pour les invités. */
export const ProfilTabScreen: React.FC = () => {
  const { profile, loading, configured, refreshProfile, signOut } = useAuth();
  const sessionProfile = useSessionProfile();
  const { pendingAuthIntent, clearPendingAuthIntent, setActiveTab } = useTabNavigation();
  const { colors } = useAppTheme();

  useEffect(() => {
    if (profile) clearPendingAuthIntent();
  }, [profile, clearPendingAuthIntent]);

  if (!configured) {
    return (
      <View style={styles.centered}>
        <ProDayConfigNotice blockingOnly />
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.ink} />
      </View>
    );
  }

  if (profile && sessionProfile) {
    return (
      <ProfileScreen
        profile={sessionProfile}
        onRefresh={refreshProfile}
        onSignOut={async () => {
          await signOut();
          clearPendingAuthIntent();
        }}
      />
    );
  }

  const authIntent = pendingAuthIntent ?? 'login';

  return (
    <AuthScreen
      key={authIntent}
      initialIntent={authIntent}
      onDismiss={() => {
        clearPendingAuthIntent();
        setActiveTab('home');
      }}
    />
  );
};

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
});
