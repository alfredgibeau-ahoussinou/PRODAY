import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Platform, Image, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { DiscoverGuestHero } from './DiscoverGuestHero';
import { DiscoverSectionLabel } from './DiscoverSectionLabel';
import { Icon } from '../ui/Icon';
import { PressableSpring } from '../motion';
import { spacing, radius } from '../../theme/designTokens';
import { ProDayScreenCanvas } from '../ui/ProDayScreenCanvas';
import { DISCOVER_UNIVERSE_CARDS_SPONSOR } from '../../content/discoverSponsorContent';
import { SPONSOR_THEME } from '../../content/sponsorExperience';
import { poleAccent } from '../../theme/prodayBrand';
import type { ProductLineId } from '../../models/ProductLine';
import type { ProDayModuleId } from '../../content/prodayModules';
import { useTranslation } from '../../context/LocaleContext';
import { getLocalizedDiscoverCopy } from '../../i18n/localizedContent';
import type { DiscoverHomeChrome } from './discoverPoleHome';
import { useDiscoverMetrics } from './useDiscoverMetrics';

interface DiscoverSponsorHomeProps {
  productLine: ProductLineId;
  onSignup: () => void;
  onLogin: () => void;
  onModulePress: (id: ProDayModuleId) => void;
  onStepPress: (id: import('../../content/discoverGuestJourney').DiscoverJourneyStepId) => void;
  universeLabel?: string;
  onUniversePress?: () => void;
}

/**
 * Accueil invité Sponsor — aperçu espace marque, un accent violet.
 */
export const DiscoverSponsorHome: React.FC<DiscoverSponsorHomeProps> = ({
  productLine,
  onSignup,
  onLogin,
  onModulePress,
  universeLabel,
  onUniversePress,
}) => {
  const { t } = useTranslation();
  const homeCopy = getLocalizedDiscoverCopy(productLine, t);
  const metrics = useDiscoverMetrics();
  const local = useMemo(
    () => createLocalStyles(metrics.homeChrome),
    [metrics.homeChrome],
  );
  const accent = poleAccent('sponsor');

  return (
    <ProDayScreenCanvas>
      <View style={local.canvas}>
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

          <View style={[local.section, { paddingHorizontal: spacing.lg }]}>
            <DiscoverSectionLabel>{homeCopy.sectionExplore}</DiscoverSectionLabel>
            <View style={local.pillars}>
              {DISCOVER_UNIVERSE_CARDS_SPONSOR.map((card) => (
                <PressableSpring
                  key={card.id}
                  onPress={() => onModulePress(card.id)}
                  scaleTo={0.98}
                  style={local.pillar}
                >
                  <Image source={card.image} style={local.pillarImage} />
                  <LinearGradient
                    colors={['transparent', 'rgba(7,6,5,0.92)']}
                    style={StyleSheet.absoluteFill}
                  />
                  <View style={local.pillarCopy}>
                    <Icon name={card.icon} size={18} color={accent} />
                    <Text style={local.pillarTitle}>{card.title}</Text>
                    <Text style={local.pillarSub}>{card.subtitle}</Text>
                  </View>
                </PressableSpring>
              ))}
            </View>
          </View>
        </ScrollView>
      </View>
    </ProDayScreenCanvas>
  );
};

function createLocalStyles(chrome: DiscoverHomeChrome) {
  return StyleSheet.create({
    canvas: { flex: 1 },
    section: {
      marginBottom: chrome.sectionMarginBottom,
      gap: chrome.sectionGap,
    },
    pillars: {
      gap: chrome.sectionGap,
    },
    pillar: {
      height: 100,
      borderRadius: radius.xl,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: SPONSOR_THEME.border,
    },
    pillarImage: {
      ...StyleSheet.absoluteFillObject,
      width: '100%',
      height: '100%',
    },
    pillarCopy: {
      flex: 1,
      justifyContent: 'flex-end',
      padding: spacing.md,
      gap: 2,
    },
    pillarTitle: {
      fontSize: 16,
      fontWeight: '800',
      color: '#FAFAF9',
      letterSpacing: -0.3,
      ...Platform.select({ android: { includeFontPadding: false } }),
    },
    pillarSub: {
      fontSize: 13,
      fontWeight: '500',
      color: 'rgba(250,250,249,0.72)',
    },
  });
}
