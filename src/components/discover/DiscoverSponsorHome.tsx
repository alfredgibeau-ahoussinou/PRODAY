import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Platform, Image, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { DiscoverGuestHero } from './DiscoverGuestHero';
import { DiscoverSectionLabel } from './DiscoverSectionLabel';
import { DiscoverGuestJourney } from './DiscoverGuestJourney';
import { Icon } from '../ui/Icon';
import { PressableSpring } from '../motion';
import { useDiscoverStyles } from './discoverStyles';
import type { ProductLineId } from '../../models/ProductLine';
import { useTranslation } from '../../context/LocaleContext';
import { getLocalizedDiscoverCopy } from '../../i18n/localizedContent';
import { LanguageSettingControl } from '../settings/LanguageSettingControl';
import { spacing, radius, shadows } from '../../theme/designTokens';
import { ProDayScreenCanvas } from '../ui/ProDayScreenCanvas';
import { ProDayGradient } from '../ui/ProDayGradient';
import { DISCOVER_UNIVERSE_CARDS_SPONSOR } from '../../content/discoverSponsorContent';
import { SPONSOR_THEME } from '../../content/sponsorExperience';
import type { AppColors } from '../../theme/universeTheme';
import type { ProDayModuleId } from '../../content/prodayModules';

const STICKY_CTA_HEIGHT = 56;

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
 * Accueil invité Sponsor — campagnes / ROI / clubs (pas Mercato ni Reels).
 */
export const DiscoverSponsorHome: React.FC<DiscoverSponsorHomeProps> = ({
  productLine,
  onSignup,
  onLogin,
  onModulePress,
  onStepPress,
  universeLabel,
  onUniversePress,
}) => {
  const { colors: c } = useDiscoverStyles();
  const { t } = useTranslation();
  const homeCopy = getLocalizedDiscoverCopy(productLine, t);
  const local = useMemo(() => createLocalStyles(c), [c]);

  return (
    <ProDayScreenCanvas>
      <View style={local.canvas}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          bounces
          contentContainerStyle={{
            paddingBottom: STICKY_CTA_HEIGHT + spacing.xl * 2,
          }}
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
                    <Icon name={card.icon} size={18} color={card.accent} />
                    <Text style={local.pillarTitle}>{card.title}</Text>
                    <Text style={local.pillarSub}>{card.subtitle}</Text>
                  </View>
                </PressableSpring>
              ))}
            </View>
          </View>

          <View style={[local.section, { paddingHorizontal: spacing.lg }]}>
            <DiscoverSectionLabel>{t('preferences.language')}</DiscoverSectionLabel>
            <LanguageSettingControl variant="card" />
          </View>

          <View style={[local.section, { paddingHorizontal: spacing.lg }]}>
            <DiscoverSectionLabel>{t('discover.journey')}</DiscoverSectionLabel>
            <DiscoverGuestJourney productLine={productLine} onStepPress={onStepPress} />
          </View>

          <View style={[local.trust, { marginHorizontal: spacing.lg }]}>
            <Icon name="shield" size={18} color={SPONSOR_THEME.gold} variant="filled" />
            <Text style={local.trustText}>{homeCopy.trustText}</Text>
          </View>
        </ScrollView>

        <View style={local.stickyDock}>
          <LinearGradient
            colors={['transparent', c.background]}
            style={local.stickyFade}
            pointerEvents="none"
          />
          <View style={[local.stickyBar, { backgroundColor: c.background, borderTopColor: c.border }]}>
            <PressableSpring onPress={onSignup} scaleTo={0.98} haptic style={[local.stickyBtnWrap, shadows.soft]}>
              <ProDayGradient kind="cta" style={local.stickyBtn}>
                <Text style={local.stickyBtnText}>{homeCopy.ctaText}</Text>
                <Icon name="chevron-forward" size={18} color={SPONSOR_THEME.goldInk} />
              </ProDayGradient>
            </PressableSpring>
          </View>
        </View>
      </View>
    </ProDayScreenCanvas>
  );
};

function createLocalStyles(c: AppColors) {
  return StyleSheet.create({
    canvas: { flex: 1 },
    section: {
      marginBottom: spacing.xl,
      gap: spacing.md,
    },
    pillars: {
      gap: spacing.md,
    },
    pillar: {
      height: 128,
      borderRadius: radius.xl,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: SPONSOR_THEME.border,
      ...shadows.soft,
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
      fontSize: 17,
      fontWeight: '800',
      color: '#FAFAF9',
      letterSpacing: -0.3,
    },
    pillarSub: {
      fontSize: 13,
      fontWeight: '500',
      color: 'rgba(250,250,249,0.72)',
    },
    trust: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.sm,
      padding: spacing.md,
      borderRadius: radius.xl,
      backgroundColor: SPONSOR_THEME.goldSurface,
      borderWidth: 1.5,
      borderColor: SPONSOR_THEME.border,
      marginBottom: spacing.xl,
    },
    trustText: {
      flex: 1,
      fontSize: 13,
      lineHeight: 19,
      fontWeight: '500',
      color: c.textSecondary,
    },
    stickyDock: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
    },
    stickyFade: {
      height: 28,
    },
    stickyBar: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.sm,
      paddingBottom: spacing.md,
      borderTopWidth: StyleSheet.hairlineWidth,
    },
    stickyBtnWrap: {
      borderRadius: radius.pill,
      overflow: 'hidden',
    },
    stickyBtn: {
      minHeight: STICKY_CTA_HEIGHT,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.xs,
      paddingHorizontal: spacing.lg,
      borderRadius: radius.pill,
    },
    stickyBtnText: {
      fontSize: 15,
      fontWeight: '800',
      color: SPONSOR_THEME.goldInk,
      flexShrink: 1,
      ...Platform.select({ android: { includeFontPadding: false } }),
    },
  });
}
