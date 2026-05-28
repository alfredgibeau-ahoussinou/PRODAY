import React, { useState } from 'react';
import { StyleSheet, View, Alert } from 'react-native';
import { ArenaScreen } from './ArenaScreen';
import { SponsorsScreen } from './SponsorsScreen';
import { DiscoverInteractiveHome } from '../components/discover/DiscoverInteractiveHome';
import { DiscoverLoginPrompt } from '../components/discover/DiscoverLoginPrompt';
import type { DiscoverExperienceId } from '../components/discover/DiscoverExperiencesHub';
import { AnimatedModalShell } from '../components/motion';
import type { ProDayModuleId } from '../content/prodayModules';
import { useTabNavigation } from '../context/TabNavigationContext';
import { useDiscoverLiveData } from '../hooks/useAppData';
import { colors } from '../theme/designTokens';
import { DiscoverExperienceDeckScreen } from './discover/DiscoverExperienceDeckScreen';
import { DiscoverStoryShowcaseScreen } from './discover/DiscoverStoryShowcaseScreen';
import { DiscoverMotionLabScreen } from './discover/DiscoverMotionLabScreen';

export const DiscoverScreen: React.FC = () => {
  const { setActiveTab } = useTabNavigation();
  const { stats, posts, tournaments, loading } = useDiscoverLiveData();
  const [loginPrompt, setLoginPrompt] = useState(false);
  const [guestModule, setGuestModule] = useState<'arena' | 'sponsors' | null>(null);
  const [experience, setExperience] = useState<DiscoverExperienceId | null>(null);

  const goSignup = () => {
    setLoginPrompt(false);
    setActiveTab('profil');
  };

  const promptLogin = () => setLoginPrompt(true);

  const teaseTab = (tab: 'recrutement' | 'matchs') => {
    Alert.alert(
      'Connexion requise',
      'Créez un compte gratuit pour accéder au Mercato, aux matchs et à la messagerie.',
      [
        { text: 'Plus tard', style: 'cancel' },
        { text: 'Se connecter', onPress: goSignup },
      ]
    );
    if (tab === 'recrutement') setActiveTab('recrutement');
  };

  const onModulePress = (id: ProDayModuleId) => {
    if (id === 'recrutement') teaseTab('recrutement');
    else if (id === 'matchs') teaseTab('matchs');
    else if (id === 'arena' || id === 'sponsors') setGuestModule(id);
    else promptLogin();
  };

  const statsLabel = stats
    ? `${stats.players} joueur${stats.players !== 1 ? 's' : ''} · ${stats.recruitment_posts_open} annonce${stats.recruitment_posts_open !== 1 ? 's' : ''}`
    : loading
      ? 'Chargement…'
      : 'Communauté ProDay';

  return (
    <View style={styles.root}>
      <DiscoverInteractiveHome
        stats={stats}
        posts={posts}
        tournaments={tournaments}
        loading={loading}
        statsLabel={statsLabel}
        liveRecruitment={Boolean(stats && stats.recruitment_posts_open > 0)}
        onSignup={goSignup}
        onPress={promptLogin}
        onMercato={() => teaseTab('recrutement')}
        onMatchs={() => teaseTab('matchs')}
        onModulePress={onModulePress}
        onStepPress={promptLogin}
        onFeaturePress={promptLogin}
        onExperience={setExperience}
      />

      <DiscoverLoginPrompt
        visible={loginPrompt}
        onLogin={goSignup}
        onDismiss={() => setLoginPrompt(false)}
      />

      <AnimatedModalShell
        visible={guestModule !== null}
        onClose={() => setGuestModule(null)}
        closeLabel="Fermer l’aperçu"
      >
        {guestModule === 'arena' ? (
          <ArenaScreen guestMode onLoginRequired={goSignup} onBack={() => setGuestModule(null)} />
        ) : null}
        {guestModule === 'sponsors' ? (
          <SponsorsScreen guestMode onLoginRequired={goSignup} onBack={() => setGuestModule(null)} />
        ) : null}
      </AnimatedModalShell>

      <AnimatedModalShell
        visible={experience !== null}
        onClose={() => setExperience(null)}
        closeLabel="Fermer l’expérience"
      >
        {experience === 'deck' ? (
          <DiscoverExperienceDeckScreen onBack={() => setExperience(null)} />
        ) : null}
        {experience === 'stories' ? (
          <DiscoverStoryShowcaseScreen onBack={() => setExperience(null)} />
        ) : null}
        {experience === 'motion' ? (
          <DiscoverMotionLabScreen onBack={() => setExperience(null)} />
        ) : null}
      </AnimatedModalShell>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
});
