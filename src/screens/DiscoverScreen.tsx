import React, { useState } from 'react';
import { StyleSheet, View, Pressable, Text } from 'react-native';
import { ArenaScreen } from './ArenaScreen';
import { SponsorsScreen } from './SponsorsScreen';
import { DiscoverInteractiveHome } from '../components/discover/DiscoverInteractiveHome';
import type { DiscoverExperienceId } from '../components/discover/DiscoverExperiencesHub';
import { AnimatedModalShell } from '../components/motion';
import { useLaunchIntro } from '../context/LaunchIntroContext';
import type { ProDayModuleId } from '../content/prodayModules';
import { useTabNavigation } from '../context/TabNavigationContext';
import { useDiscoverLiveData } from '../hooks/useAppData';
import { colors, spacing } from '../theme/designTokens';
import { useAppTheme } from '../context/ProductLineContext';
import { DiscoverExperienceDeckScreen } from './discover/DiscoverExperienceDeckScreen';
import { DiscoverStoryShowcaseScreen } from './discover/DiscoverStoryShowcaseScreen';
import { DiscoverMotionLabScreen } from './discover/DiscoverMotionLabScreen';

export const DiscoverScreen: React.FC = () => {
  const { setActiveTab } = useTabNavigation();
  const { openSpacePicker } = useLaunchIntro();
  const { isWoman } = useAppTheme();
  const { stats, posts, tournaments, loading } = useDiscoverLiveData();
  const [guestModule, setGuestModule] = useState<'arena' | 'sponsors' | null>(null);
  const [experience, setExperience] = useState<DiscoverExperienceId | null>(null);

  const goSignup = () => setActiveTab('profil');

  const onModulePress = (id: ProDayModuleId) => {
    if (id === 'recrutement') setActiveTab('recrutement');
    else if (id === 'matchs') setActiveTab('matchs');
    else if (id === 'arena' || id === 'sponsors') setGuestModule(id);
    else goSignup();
  };

  const statsLabel = stats
    ? `${stats.players} joueur${stats.players !== 1 ? 's' : ''} · ${stats.recruitment_posts_open} annonce${stats.recruitment_posts_open !== 1 ? 's' : ''}`
    : loading
      ? 'Chargement…'
      : 'Communauté ProDay';

  return (
    <View style={styles.root}>
      <Pressable style={styles.universeBar} onPress={openSpacePicker}>
        <Text style={styles.universeBarText}>
          {isWoman ? 'ProDay for Women' : 'ProDay Classic'} · Changer d’univers
        </Text>
      </Pressable>
      <DiscoverInteractiveHome
        stats={stats}
        posts={posts}
        tournaments={tournaments}
        loading={loading}
        statsLabel={statsLabel}
        liveRecruitment={Boolean(stats && stats.recruitment_posts_open > 0)}
        onSignup={goSignup}
        onPress={goSignup}
        onMercato={() => setActiveTab('recrutement')}
        onMatchs={() => setActiveTab('matchs')}
        onModulePress={onModulePress}
        onStepPress={goSignup}
        onFeaturePress={goSignup}
        onExperience={setExperience}
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
  universeBar: {
    alignItems: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  universeBarText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.ink,
    textDecorationLine: 'underline',
  },
});
