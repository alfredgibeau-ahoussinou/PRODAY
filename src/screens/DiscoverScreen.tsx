import React, { useMemo, useState, useEffect } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
import { useProductLine } from '../context/ProductLineContext';
import { useDiscoverLiveData } from '../hooks/useAppData';
import { useThemedScreen } from '../hooks/useThemedScreen';
import { useTranslation } from '../context/LocaleContext';
import { getLocalizedUniverseLabel } from '../i18n/localizedContent';
import { formatCount } from '../services/stats.service';
import { OnboardingPriorityScreen, type OnboardingPriorityChoice } from './OnboardingPriorityScreen';
import { VideoDemoModal } from '../components/discover/VideoDemoModal';
import { PoleHelpChatbot } from '../components/help/PoleHelpChatbot';
import { Icon } from '../components/ui/Icon';
import { PressableSpring } from '../components/motion';
import { ProDayGradient } from '../components/ui/ProDayGradient';
import { spacing, radius, shadows } from '../theme/designTokens';

const ONBOARDING_PRIORITY_KEY = 'proday_onboarding_priority_seen_v1';

export const DiscoverScreen: React.FC = () => {
  const { setActiveTab, openAuth, openMercato, openMatchs } = useTabNavigation();
  const { openSpacePicker } = useLaunchIntro();
  const { setProductLine, setProSignupPresetRole } = useProductLine();
  const { stats, posts, loading } = useDiscoverLiveData();
  const [guestModule, setGuestModule] = useState<'partner-hub' | 'sponsors-offers' | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showVideoDemo, setShowVideoDemo] = useState(false);
  const { rootStyle, productLine } = useThemedScreen();
  const { t } = useTranslation();

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const seen = await AsyncStorage.getItem(ONBOARDING_PRIORITY_KEY);
        if (!cancelled && seen !== '1') {
          setShowOnboarding(true);
        }
      } catch {
        // If storage fails, don't show onboarding
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

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
    else if (id === 'smart_tactics') goSignup();
    else goSignup();
  };

  const handleOnboardingChoice = async (choice: OnboardingPriorityChoice) => {
    try {
      await AsyncStorage.setItem(ONBOARDING_PRIORITY_KEY, '1');
      setShowOnboarding(false);
      
      // Set the product line and role based on the choice
      await setProductLine(choice.targetProductLine);
      if (choice.targetRole) {
        await setProSignupPresetRole(choice.targetRole);
      }
      
      // Open signup with the preset values
      openAuth('signup');
    } catch {
      // If storage fails, just close onboarding and continue
      setShowOnboarding(false);
    }
  };

  const handleOnboardingSkip = async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_PRIORITY_KEY, '1');
      setShowOnboarding(false);
    } catch {
      setShowOnboarding(false);
    }
  };

  return (
    <View style={[styles.root, rootStyle]}>
      {!isFirebaseConfigured() ? (
        <View style={styles.configBanner}>
          <ProDayConfigNotice compact />
        </View>
      ) : null}
      {showOnboarding ? (
        <OnboardingPriorityScreen
          onChoice={handleOnboardingChoice}
          onSkip={handleOnboardingSkip}
        />
      ) : (
        <>
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
        </>
      )}

      <VideoDemoModal
        visible={showVideoDemo}
        onClose={() => setShowVideoDemo(false)}
      />

      {!showOnboarding && <PoleHelpChatbot />}

      {!showOnboarding && (
        <PressableSpring
          onPress={() => setShowVideoDemo(true)}
          style={[styles.demoButton, shadows.soft]}
          scaleTo={0.95}
        >
          <ProDayGradient kind="cta" style={styles.demoButtonInner}>
            <Icon name="football" size={20} color="#FFFFFF" />
            <Text style={styles.demoButtonText}>{t('videoDemo.button') || 'Voir la démo'}</Text>
          </ProDayGradient>
        </PressableSpring>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  configBanner: { paddingHorizontal: 16, paddingTop: 8 },
  demoButton: {
    position: 'absolute',
    bottom: spacing.xl + 60,
    right: spacing.lg,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  demoButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
  },
  demoButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
