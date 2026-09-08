import React, { useEffect, useRef } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useSessionProfile } from '../hooks/useSessionProfile';
import { useTabNavigation } from '../context/TabNavigationContext';
import { useAppTheme } from '../context/ProductLineContext';
import { ProDayConfigNotice } from '../components/ui/ProDayConfigNotice';
import { ProfileScreen } from './ProfileScreen';
import { AuthScreen } from './AuthScreen';

/** Onglet Profil — fiche connectée. Invité : overlay App exclusif (pas de double Auth). */
export const ProfilTabScreen: React.FC = () => {
  const { profile, loading, configured, refreshProfile, signOut } = useAuth();
  const sessionProfile = useSessionProfile();
  const {
    pendingAuthIntent,
    clearPendingAuthIntent,
    setActiveTab,
    pendingSignupProductLine,
    pendingSignupRole,
    clearSignupPreset,
  } = useTabNavigation();
  const { colors } = useAppTheme();
  const wasGuestRef = useRef(!profile);

  useEffect(() => {
    if (!profile) {
      wasGuestRef.current = true;
      return;
    }
    if (wasGuestRef.current) {
      wasGuestRef.current = false;
      setActiveTab('home');
    }
    clearPendingAuthIntent();
    clearSignupPreset();
  }, [profile, clearPendingAuthIntent, clearSignupPreset, setActiveTab]);

  if (!configured) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ProDayConfigNotice blockingOnly />
      </View>
    );
  }

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
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

  // Overlay App déjà ouvert → placeholder vide (évite AuthScreen en double).
  if (pendingAuthIntent) {
    return <View style={[styles.centered, { backgroundColor: '#000000' }]} />;
  }

  // Fallback invité sans overlay (ex. deep link onglet profil).
  return (
    <AuthScreen
      key="profil-fallback-login"
      initialIntent="login"
      signupProductLine={pendingSignupProductLine ?? undefined}
      signupInitialRole={pendingSignupRole ?? undefined}
      onDismiss={() => {
        clearPendingAuthIntent();
        clearSignupPreset();
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
  },
});
