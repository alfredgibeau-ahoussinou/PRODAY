import React, { useMemo } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useSessionProfile } from '../hooks/useSessionProfile';
import { useTabNavigation } from '../context/TabNavigationContext';
import { TabScreenShell } from '../components/app/TabScreenShell';
import { ParentalControlScreen } from './ParentalControlScreen';
import { GuardianPortalScreen } from './GuardianPortalScreen';
import { AuthScreen } from './AuthScreen';
import { isMinorUser } from '../utils/minor';
import { useThemedScreen } from '../hooks/useThemedScreen';
import { useTranslation } from '../context/LocaleContext';

/** Onglet Famille — espace dédié mineurs (protégé) ou tuteurs (supervision). */
export const FamilleTabScreen: React.FC = () => {
  const { profile, loading } = useAuth();
  const sessionProfile = useSessionProfile();
  const { pendingAuthIntent, clearPendingAuthIntent, setActiveTab } = useTabNavigation();
  const { colors: c, rootStyle } = useThemedScreen();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(), []);

  if (loading) {
    return (
      <View style={[styles.centered, rootStyle]}>
        <ActivityIndicator size="large" color={c.brand} />
      </View>
    );
  }

  if (!profile || !sessionProfile) {
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
  }

  const isMinor = isMinorUser(sessionProfile);

  if (isMinor) {
    return (
      <TabScreenShell
        caption={t('family.tab.captionMinor')}
        title={t('family.tab.titleMinor')}
        subtitle={t('family.tab.subtitleMinor')}
        flat
      >
        <ParentalControlScreen embedded />
      </TabScreenShell>
    );
  }

  return (
    <TabScreenShell
      caption={t('family.tab.captionGuardian')}
      title={t('family.tab.titleGuardian')}
      subtitle={t('family.tab.subtitleGuardian')}
      flat
    >
      <GuardianPortalScreen embedded />
    </TabScreenShell>
  );
};

function createStyles() {
  return StyleSheet.create({
    centered: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });
}
