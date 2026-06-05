import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { ArenaScreen } from './ArenaScreen';
import { SponsorsScreen } from './SponsorsScreen';
import { DiscoverHomeScroll } from '../components/home/DiscoverHomeScroll';
import { AnimatedModalShell } from '../components/motion';
import type { ProDayModuleId } from '../content/prodayModules';
import { useTabNavigation } from '../context/TabNavigationContext';
import { useDiscoverLiveData } from '../hooks/useAppData';
import { colors } from '../theme/designTokens';

export const DiscoverScreen: React.FC = () => {
  const { setActiveTab } = useTabNavigation();
  const { stats, loading } = useDiscoverLiveData();
  const [guestModule, setGuestModule] = useState<'arena' | 'sponsors' | null>(null);

  const goAuth = () => setActiveTab('profil');

  const onModulePress = (id: ProDayModuleId) => {
    if (id === 'arena' || id === 'sponsors') setGuestModule(id);
    else goAuth();
  };

  return (
    <View style={styles.root}>
      <DiscoverHomeScroll
        stats={stats}
        loading={loading}
        liveRecruitment={Boolean(stats && stats.recruitment_posts_open > 0)}
        onSignup={goAuth}
        onLogin={goAuth}
        onModulePress={onModulePress}
      />

      <AnimatedModalShell
        visible={guestModule !== null}
        onClose={() => setGuestModule(null)}
        closeLabel="Fermer l’aperçu"
      >
        {guestModule === 'arena' ? (
          <ArenaScreen guestMode onLoginRequired={goAuth} onBack={() => setGuestModule(null)} />
        ) : null}
        {guestModule === 'sponsors' ? (
          <SponsorsScreen guestMode onLoginRequired={goAuth} onBack={() => setGuestModule(null)} />
        ) : null}
      </AnimatedModalShell>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
});
