import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Platform, ScrollView } from 'react-native';
import { DiscoverGuestHero } from './DiscoverGuestHero';
import { Icon } from '../ui/Icon';
import { spacing } from '../../theme/designTokens';
import { ProDayScreenCanvas } from '../ui/ProDayScreenCanvas';
import { SPONSOR_SPACE_LINES } from '../../content/discoverSponsorContent';
import { SPONSOR_THEME } from '../../content/sponsorExperience';
import { poleAccent } from '../../theme/prodayBrand';
import type { ProductLineId } from '../../models/ProductLine';
import type { ProDayModuleId } from '../../content/prodayModules';
import { AnimatedEntrance } from '../motion';
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
 * Accueil invité Sponsor — espace marque minimal (noir + violet).
 * Un CTA principal via DiscoverGuestHero, lignes éditoriales sans clutter landing.
 */
export const DiscoverSponsorHome: React.FC<DiscoverSponsorHomeProps> = ({
  productLine,
  onSignup,
  onLogin,
  universeLabel,
  onUniversePress,
}) => {
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

          <AnimatedEntrance kind="fadeUp" index={1} style={local.linesWrap}>
            <Text style={local.linesEyebrow}>Dans l’espace</Text>
            <View style={local.lines}>
              {SPONSOR_SPACE_LINES.map((line, index) => (
                <AnimatedEntrance key={line.id} kind="fadeUp" index={index + 2}>
                  <View
                    style={[
                      local.line,
                      index < SPONSOR_SPACE_LINES.length - 1 && local.lineDivider,
                    ]}
                  >
                    <View style={[local.lineIcon, { borderColor: accent }]}>
                      <Icon name={line.icon} size={16} color={accent} />
                    </View>
                    <View style={local.lineCopy}>
                      <Text style={local.lineTitle}>{line.title}</Text>
                      <Text style={local.lineSub}>{line.subtitle}</Text>
                    </View>
                  </View>
                </AnimatedEntrance>
              ))}
            </View>
          </AnimatedEntrance>
        </ScrollView>
      </View>
    </ProDayScreenCanvas>
  );
};

function createLocalStyles(chrome: DiscoverHomeChrome) {
  return StyleSheet.create({
    canvas: { flex: 1, backgroundColor: SPONSOR_THEME.background },
    linesWrap: {
      paddingHorizontal: spacing.lg,
      marginTop: chrome.sectionGap,
      gap: chrome.sectionGap,
    },
    linesEyebrow: {
      fontSize: 10,
      fontWeight: '700',
      letterSpacing: 1.6,
      textTransform: 'uppercase',
      color: SPONSOR_THEME.sectionLabel,
      ...Platform.select({ android: { includeFontPadding: false } }),
    },
    lines: {
      gap: 0,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: SPONSOR_THEME.borderSubtle,
    },
    line: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      paddingVertical: chrome.sectionGap + 4,
    },
    lineDivider: {
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: SPONSOR_THEME.borderSubtle,
    },
    lineIcon: {
      width: 36,
      height: 36,
      borderRadius: 18,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: SPONSOR_THEME.primarySoft,
    },
    lineCopy: { flex: 1, minWidth: 0, gap: 2 },
    lineTitle: {
      fontSize: 15,
      fontWeight: '800',
      color: SPONSOR_THEME.text,
      letterSpacing: -0.2,
      ...Platform.select({ android: { includeFontPadding: false } }),
    },
    lineSub: {
      fontSize: 13,
      fontWeight: '500',
      color: SPONSOR_THEME.textMuted,
      lineHeight: 17,
    },
  });
}
