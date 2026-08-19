import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { DiscoverSponsorHome } from './DiscoverSponsorHome';
import { DiscoverGuestHero } from './DiscoverGuestHero';
import { DiscoverQuickAccess, type DiscoverQuickId } from './DiscoverQuickAccess';
import { DiscoverActivityStrip } from './DiscoverActivityStrip';
import { DiscoverGuestJourney } from './DiscoverGuestJourney';
import { DiscoverSectionLabel } from './DiscoverSectionLabel';
import { ProDayModuleGrid } from '../ui/ProDayModuleGrid';
import { Icon } from '../ui/Icon';
import { PressableSpring } from '../motion';
import { useDiscoverStyles } from './discoverStyles';
import { useDiscoverMetrics } from './useDiscoverMetrics';
import type { RecruitmentStats } from '../../services/stats.service';
import type { RecruitmentPost } from '../../models/Player';
import type { ProDayModuleId } from '../../content/prodayModules';
import type { ProductLineId } from '../../models/ProductLine';
import { useTranslation } from '../../context/LocaleContext';
import { getLocalizedDiscoverCopy } from '../../i18n/localizedContent';
import { LanguageSettingControl } from '../settings/LanguageSettingControl';
import { spacing, BRAND, radius, shadows } from '../../theme/designTokens';
import { ProDayScreenCanvas } from '../ui/ProDayScreenCanvas';
import { ProDayGradient } from '../ui/ProDayGradient';
import type { AppColors } from '../../theme/universeTheme';
import { isJoueurProductLine } from '../../utils/playerLevelBadge';
import { JOUEUR_DISCOVER, JOUEUR_SITE } from '../../theme/joueurDesignSystem';
import { JoueurScreenChrome } from '../joueur/JoueurScreenChrome';
import { resolveJoueurPageIdentity } from '../../content/joueurPageIdentity';

const STICKY_CTA_HEIGHT = 56;

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
 * Accueil invité — hero immersif + scroll vertical unique.
 */
export const DiscoverInteractiveHome: React.FC<DiscoverInteractiveHomeProps> = ({
  productLine,
  stats,
  posts,
  loading,
  statsLabel,
  liveRecruitment,
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
  const { styles: discoverStyles, palette: discoverPalette, colors: c } = useDiscoverStyles();
  const { t } = useTranslation();
  const metrics = useDiscoverMetrics();
  const homeCopy = getLocalizedDiscoverCopy(productLine, t);
  const joueurLine = isJoueurProductLine(productLine);
  const local = useMemo(() => createLocalStyles(c, joueurLine), [c, joueurLine]);
  const guestIdentity = useMemo(
    () =>
      joueurLine
        ? resolveJoueurPageIdentity({
            ageGroup: 'adult',
            gender: productLine === 'woman' ? 'female' : 'male',
          })
        : null,
    [joueurLine, productLine],
  );

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

  const showHeaderStats = Boolean(stats) && !loading;
  const hasActivity = posts.length > 0;

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

  const scrollBody = (
    <>
      <ScrollView
        showsVerticalScrollIndicator={false}
        bounces
        contentContainerStyle={{
          paddingBottom: STICKY_CTA_HEIGHT + spacing.xl * 2,
        }}
      >
        <DiscoverGuestHero
          productLine={productLine}
          statsLabel={showHeaderStats ? statsLabel : undefined}
          loading={loading && !stats}
          onSignup={onSignup}
          onLogin={onLogin}
          onStatsPress={showHeaderStats ? onPress : undefined}
          universeLabel={universeLabel}
          onUniversePress={onUniversePress}
        />

        <View style={[local.section, { paddingHorizontal: metrics.pad }]}>
          <DiscoverSectionLabel>{t('discover.quickAccess')}</DiscoverSectionLabel>
          <DiscoverQuickAccess onPress={onQuickPress} hideReels={productLine === 'sante'} />
        </View>

        <View style={[local.section, { paddingHorizontal: metrics.pad }]}>
          <DiscoverSectionLabel>{t('preferences.language')}</DiscoverSectionLabel>
          <LanguageSettingControl variant="card" />
        </View>

        <View style={[local.section, { paddingHorizontal: metrics.pad }]}>
          <DiscoverSectionLabel>{t('discover.journey')}</DiscoverSectionLabel>
          <DiscoverGuestJourney productLine={productLine} onStepPress={onStepPress} />
        </View>

        <View style={[local.section, { paddingHorizontal: metrics.pad }]}>
          <DiscoverSectionLabel>{homeCopy.sectionExplore}</DiscoverSectionLabel>
          <ProDayModuleGrid
            onModulePress={onModulePress}
            liveRecruitment={liveRecruitment}
            animated
            fullWidthModuleId="gestion"
          />
        </View>

        {hasActivity || loading ? (
          <View style={[local.section, { paddingHorizontal: metrics.pad }]}>
            <DiscoverSectionLabel>{t('discover.live')}</DiscoverSectionLabel>
            {!loading && stats ? (
              <PressableSpring
                style={discoverStyles.statsRow}
                onPress={onPress}
                scaleTo={0.98}
              >
                <View style={discoverStyles.liveDot} />
                <Text style={discoverStyles.statsRowText} numberOfLines={2}>
                  {statsLabel}
                </Text>
                <Icon name="chevron-forward" size={16} color={discoverPalette.faint} />
              </PressableSpring>
            ) : loading ? (
              <ActivityIndicator color={discoverPalette.ink} style={local.loader} />
            ) : null}
            <DiscoverActivityStrip
              posts={posts}
              loading={loading}
              onPress={onPress}
              variant="editorial"
            />
          </View>
        ) : null}

        <View style={[local.trust, { marginHorizontal: metrics.pad }]}>
          <Icon name="shield" size={18} color={discoverPalette.ink} variant="filled" />
          <Text style={local.trustText}>{homeCopy.trustText}</Text>
        </View>

        <View style={[local.finalCta, { paddingHorizontal: metrics.pad }]}>
          <Text style={local.foot}>{BRAND.tagline}</Text>
        </View>
      </ScrollView>

      <View style={local.stickyDock}>
        <LinearGradient
          colors={['transparent', joueurLine ? JOUEUR_SITE.bg : c.background]}
          style={local.stickyFade}
          pointerEvents="none"
        />
        <View
          style={[
            local.stickyBar,
            {
              backgroundColor: joueurLine ? JOUEUR_SITE.bg : c.background,
              borderTopColor: joueurLine ? JOUEUR_SITE.border : c.border,
            },
          ]}
        >
          <PressableSpring onPress={onSignup} scaleTo={0.98} haptic style={[local.stickyBtnWrap, shadows.soft]}>
            <ProDayGradient kind="cta" style={local.stickyBtn}>
              <Text style={local.stickyBtnText}>{t('discover.signupFree')}</Text>
              <Icon name="chevron-forward" size={18} color={c.brandInverse} />
            </ProDayGradient>
          </PressableSpring>
        </View>
      </View>
    </>
  );

  if (joueurLine && guestIdentity) {
    return (
      <JoueurScreenChrome identity={guestIdentity} variant="tab">
        <View style={discoverStyles.canvas}>{scrollBody}</View>
      </JoueurScreenChrome>
    );
  }

  return (
    <ProDayScreenCanvas>
      <View style={discoverStyles.canvas}>{scrollBody}</View>
    </ProDayScreenCanvas>
  );
};

function createLocalStyles(c: AppColors, joueurLine = false) {
  return StyleSheet.create({
    section: {
      marginBottom: spacing.xl,
      gap: spacing.md,
    },
    loader: {
      marginVertical: spacing.md,
    },
    trust: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.sm,
      padding: spacing.md,
      borderRadius: radius.xl,
      backgroundColor: joueurLine ? JOUEUR_DISCOVER.tileBg : c.surfaceMuted,
      borderWidth: 1.5,
      borderColor: joueurLine ? JOUEUR_DISCOVER.tileBorder : c.borderStrong,
      marginBottom: spacing.xl,
      ...shadows.soft,
    },
    trustText: {
      flex: 1,
      fontSize: 13,
      lineHeight: 19,
      fontWeight: '500',
      color: joueurLine ? JOUEUR_DISCOVER.heroMuted : c.textSecondary,
    },
    finalCta: {
      marginBottom: spacing.md,
    },
    foot: {
      textAlign: 'center',
      color: c.textMuted,
      fontSize: 10,
      fontWeight: '700',
      letterSpacing: 2,
      textTransform: 'uppercase',
      ...Platform.select({ android: { includeFontPadding: false } }),
    },
    stickyDock: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
    },
    stickyFade: {
      position: 'absolute',
      left: 0,
      right: 0,
      top: -32,
      height: 32,
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
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.xs,
      minHeight: STICKY_CTA_HEIGHT,
      paddingHorizontal: spacing.lg,
      borderRadius: radius.pill,
    },
    stickyBtnText: {
      fontSize: 15,
      fontWeight: '800',
      color: c.brandInverse,
    },
  });
}
