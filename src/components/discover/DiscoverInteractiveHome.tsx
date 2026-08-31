import React, { useMemo } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { DiscoverSponsorHome } from './DiscoverSponsorHome';
import { DiscoverGuestHero } from './DiscoverGuestHero';
import { DiscoverQuickAccess, type DiscoverQuickId } from './DiscoverQuickAccess';
import { DiscoverActivityStrip } from './DiscoverActivityStrip';
import { DiscoverSectionLabel } from './DiscoverSectionLabel';
import { useDiscoverStyles } from './discoverStyles';
import { useDiscoverMetrics } from './useDiscoverMetrics';
import { discoverQuickIdsForLine, discoverShowsMercatoPreview } from './discoverPoleHome';
import type { RecruitmentStats } from '../../services/stats.service';
import type { RecruitmentPost } from '../../models/Player';
import type { ProDayModuleId } from '../../content/prodayModules';
import type { ProductLineId } from '../../models/ProductLine';
import { useTranslation } from '../../context/LocaleContext';
import type { DiscoverHomeChrome } from './discoverPoleHome';
import { ProDayScreenCanvas } from '../ui/ProDayScreenCanvas';

export interface DiscoverInteractiveHomeProps {
  productLine: ProductLineId;
  stats: RecruitmentStats | null;
  posts: RecruitmentPost[];
  loading: boolean;
  statsLabel: string;
  liveRecruitment: boolean;
  onSignup: () => void;
  onLogin: () => void;
  onPress: () => void;
  onMercato: () => void;
  onMatchs: () => void;
  onOpenReels: () => void;
  onOpenShop: () => void;
  onModulePress: (id: ProDayModuleId) => void;
  onStepPress: (id: import('../../content/discoverGuestJourney').DiscoverJourneyStepId) => void;
  universeLabel?: string;
  onUniversePress?: () => void;
}

/**
 * Accueil invité — home de pôle minimaliste (aperçu compte).
 */
export const DiscoverInteractiveHome: React.FC<DiscoverInteractiveHomeProps> = ({
  productLine,
  posts,
  loading,
  onSignup,
  onLogin,
  onPress,
  onMercato,
  onMatchs,
  onOpenReels,
  onOpenShop,
  onModulePress,
  onStepPress,
  universeLabel,
  onUniversePress,
}) => {
  const { styles: discoverStyles } = useDiscoverStyles();
  const { t } = useTranslation();
  const metrics = useDiscoverMetrics();
  const local = useMemo(
    () => createLocalStyles(metrics.homeChrome),
    [metrics.homeChrome],
  );
  const showActivity = discoverShowsMercatoPreview(productLine) && (posts.length > 0 || loading);
  const showQuick = discoverQuickIdsForLine(productLine).length > 0;

  if (productLine === 'sponsor') {
    return (
      <DiscoverSponsorHome
        productLine={productLine}
        onSignup={onSignup}
        onLogin={onLogin}
        onModulePress={onModulePress}
        onStepPress={onStepPress}
        universeLabel={universeLabel}
        onUniversePress={onUniversePress}
      />
    );
  }

  const onQuickPress = (id: DiscoverQuickId) => {
    switch (id) {
      case 'mercato':
        onMercato();
        break;
      case 'matchs':
        onMatchs();
        break;
      case 'reels':
        onOpenReels();
        break;
      case 'shop':
        onOpenShop();
        break;
      default:
        break;
    }
  };

  return (
    <ProDayScreenCanvas>
      <View style={discoverStyles.canvas}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          bounces
          contentContainerStyle={{ paddingBottom: metrics.homeChrome.scrollBottom }}
        >
          <DiscoverGuestHero
            productLine={productLine}
            onSignup={onSignup}
            onLogin={onLogin}
            universeLabel={universeLabel}
            onUniversePress={onUniversePress}
          />

          {showQuick ? (
            <View style={[local.section, { paddingHorizontal: metrics.pad }]}>
              <DiscoverSectionLabel>{t('discover.quickAccess')}</DiscoverSectionLabel>
              <DiscoverQuickAccess productLine={productLine} onPress={onQuickPress} />
            </View>
          ) : null}

          {showActivity ? (
            <View style={[local.section, { paddingHorizontal: metrics.pad }]}>
              <DiscoverSectionLabel>{t('discover.live')}</DiscoverSectionLabel>
              <DiscoverActivityStrip
                posts={posts}
                loading={loading}
                onPress={onPress}
                variant="editorial"
              />
            </View>
          ) : null}
        </ScrollView>
      </View>
    </ProDayScreenCanvas>
  );
};

function createLocalStyles(chrome: DiscoverHomeChrome) {
  return StyleSheet.create({
    section: {
      marginBottom: chrome.sectionMarginBottom,
      gap: chrome.sectionGap,
    },
  });
}
