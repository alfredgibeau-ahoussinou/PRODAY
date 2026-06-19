import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SponsorsScreen } from './SponsorsScreen';
import { SponsorHubScreen } from './sponsor/SponsorHubScreen';
import { DiscoverInteractiveHome } from '../components/discover/DiscoverInteractiveHome';
import { ProDayConfigNotice } from '../components/ui/ProDayConfigNotice';
import { isFirebaseConfigured } from '../config/firebase';
import { AnimatedModalShell } from '../components/motion';
import type { ProDayModuleId } from '../content/prodayModules';
import type { DiscoverJourneyStepId } from '../content/discoverGuestJourney';
import { useTabNavigation } from '../context/TabNavigationContext';
import { useLaunchIntro } from '../context/LaunchIntroContext';
import { useDiscoverLiveData } from '../hooks/useAppData';
import { useThemedScreen } from '../hooks/useThemedScreen';
import { useTranslation } from '../context/LocaleContext';
import { getLocalizedUniverseLabel } from '../i18n/localizedContent';
import { formatCount } from '../services/stats.service';

export const DiscoverScreen: React.FC = () => {
  const { setActiveTab, openAuth, openMercato, openMatchs } = useTabNavigation();
  const { openSpacePicker } = useLaunchIntro();
  const { stats, posts, loading } = useDiscoverLiveData();
  const [guestModule, setGuestModule] = useState<'partner-hub' | 'sponsors-offers' | null>(null);
  const { rootStyle, productLine } = useThemedScreen();
  const { t } = useTranslation();

  const goLogin = () => openAuth('login');
  const goSignup = () => openAuth('signup');

  const statsLabel = useMemo(() => {
    if (!stats) return t('discover.stats.community');
    return t('discover.stats.players', {
      players: formatCount(stats.players, 'joueur'),
      posts: stats.recruitment_posts_open,
    });
  }, [stats, t]);

  const onJourneyStep = (id: DiscoverJourneyStepId) => {
    if (id === 'profile') goLogin();
    else if (id === 'mercato') openMercato('home');
    else openMatchs({ homeTab: 'season' });
  };

  const onModulePress = (id: ProDayModuleId) => {
    if (id === 'sponsors') setGuestModule('partner-hub');
    else if (id === 'recrutement') openMercato('home');
    else if (id === 'matchs') openMatchs({ homeTab: 'season' });
    else goSignup();
  };

  return (
    <View style={[styles.root, rootStyle]}>
      {!isFirebaseConfigured() ? (
        <View style={styles.configBanner}>
          <ProDayConfigNotice compact />
        </View>
      ) : null}
      <DiscoverInteractiveHome
        productLine={productLine}
        stats={stats}
        posts={posts}
        loading={loading}
        statsLabel={statsLabel}
        liveRecruitment={Boolean(stats && stats.recruitment_posts_open > 0)}
        onSignup={goSignup}
        onLogin={goLogin}
        onPress={goSignup}
        onMercato={() => openMercato('home')}
        onMatchs={() => openMatchs({ homeTab: 'season' })}
        onOpenReels={() => setActiveTab('reels')}
        onOpenShop={() => setActiveTab('shop')}
        onModulePress={onModulePress}
        onStepPress={onJourneyStep}
        universeLabel={getLocalizedUniverseLabel(productLine, t)}
        onUniversePress={openSpacePicker}
      />

      <AnimatedModalShell
        visible={guestModule !== null}
        onClose={() => setGuestModule(null)}
        closeLabel={t('common.close')}
      >
        {guestModule === 'partner-hub' ? (
          <SponsorHubScreen
            onBack={() => setGuestModule(null)}
            onBrowseOffers={() => setGuestModule('sponsors-offers')}
          />
        ) : guestModule === 'sponsors-offers' ? (
          <SponsorsScreen
            guestMode
            onLoginRequired={goLogin}
            onBack={() => setGuestModule('partner-hub')}
          />
        ) : null}
      </AnimatedModalShell>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  configBanner: { paddingHorizontal: 16, paddingTop: 8 },
});
