import React, { useCallback, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  ActivityIndicator,
  ScrollView,
  type LayoutChangeEvent,
} from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { Logo } from '../Logo';
import { Icon, type IconName } from '../ui/Icon';
import { PressableSpring } from './PressableSpring';
import { MarqueePillars } from './MarqueePillars';
import { ShimmerCTA } from './ShimmerCTA';
import { DiscoverSectionHeader } from './DiscoverSectionHeader';
import { DiscoverHighlightStrip, buildDiscoverHighlights } from './DiscoverHighlightStrip';
import { AnimatedStatCounters } from './AnimatedStatCounters';
import { DiscoverLivePreview } from './DiscoverLivePreview';
import { ProDayPulseIntro } from '../interactive/ProDayPulseInteractive';
import { ExploreLaunchpads } from './ExploreLaunchpads';
import { DiscoverUniverseCarousel } from './DiscoverUniverseCarousel';
import { DiscoverModuleHub } from './DiscoverModuleHub';
import { DiscoverJourney } from './DiscoverJourney';
import { FeatureShowcaseAnimated } from './FeatureShowcaseAnimated';
import {
  DiscoverExperiencesHub,
  type DiscoverExperienceId,
} from './DiscoverExperiencesHub';
import { FoundersInteractive } from './FoundersInteractive';
import { DiscoverParallaxSection } from './DiscoverParallaxSection';
import { StaggerReveal } from '../motion';
import { SHOWCASE_IMAGES } from '../../content/showcaseAssets';
import type { RecruitmentStats } from '../../services/stats.service';
import type { RecruitmentPost } from '../../models/Player';
import type { Tournament } from '../../models/Tournament';
import type { ProDayModuleId } from '../../content/prodayModules';
import { TAB_BAR_CONTENT_INSET } from '../../navigation/tabBarLayout';
import { colors, spacing, radius, shadows, surfaces, BRAND, brandOverlay } from '../../theme/designTokens';

const HERO_HEIGHT = 200;
const STICKY_THRESHOLD = 220;

type SectionId = 'live' | 'universe' | 'journey' | 'join';

const NAV_SECTIONS: { id: SectionId; label: string; icon: IconName }[] = [
  { id: 'live', label: 'Live', icon: 'star-four-points' },
  { id: 'universe', label: 'Univers', icon: 'search' },
  { id: 'journey', label: 'Parcours', icon: 'trophy' },
  { id: 'join', label: 'Rejoindre', icon: 'person' },
];

const QUICK_MODULES: {
  id: ProDayModuleId;
  label: string;
  icon: IconName;
  color: string;
  bg: string;
}[] = [
  { id: 'recrutement', label: 'Mercato', icon: 'search', color: colors.tone1, bg: colors.accentSoft },
  { id: 'matchs', label: 'Matchs', icon: 'handshake', color: colors.tone2, bg: colors.backgroundAlt },
  { id: 'arena', label: 'Arena', icon: 'trophy', color: colors.tone3, bg: colors.surfaceMuted },
  { id: 'sponsors', label: 'Sponsors', icon: 'star', color: colors.tone4, bg: colors.accentSoft },
];

export interface DiscoverInteractiveHomeProps {
  stats: RecruitmentStats | null;
  posts: RecruitmentPost[];
  tournaments: Tournament[];
  loading: boolean;
  statsLabel: string;
  liveRecruitment: boolean;
  onSignup: () => void;
  onPress: () => void;
  onMercato: () => void;
  onMatchs: () => void;
  onModulePress: (id: ProDayModuleId) => void;
  onStepPress: (id: string) => void;
  onFeaturePress: () => void;
  onExperience: (id: DiscoverExperienceId) => void;
}

/**
 * Accueil invité unique — scroll vertical, hero parallax, sections interactives.
 */
export const DiscoverInteractiveHome: React.FC<DiscoverInteractiveHomeProps> = ({
  stats,
  posts,
  tournaments,
  loading,
  statsLabel,
  liveRecruitment,
  onSignup,
  onPress,
  onMercato,
  onMatchs,
  onModulePress,
  onStepPress,
  onFeaturePress,
  onExperience,
}) => {
  const scrollRef = useRef<Animated.ScrollView>(null);
  const scrollY = useSharedValue(0);
  const [activeSection, setActiveSection] = useState<SectionId | null>(null);
  const [sectionY, setSectionY] = useState<Partial<Record<SectionId, number>>>({});
  const sectionOffsets = useRef<Partial<Record<SectionId, number>>>({});

  const highlights = buildDiscoverHighlights(stats, tournaments.length);

  const onScroll = useAnimatedScrollHandler({
    onScroll: (e) => {
      scrollY.value = e.contentOffset.y;
    },
  });

  const heroImageStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(
          scrollY.value,
          [0, HERO_HEIGHT],
          [0, -HERO_HEIGHT * 0.35],
          Extrapolation.CLAMP
        ),
      },
      {
        scale: interpolate(scrollY.value, [-80, 0, HERO_HEIGHT], [1.12, 1, 1.08], Extrapolation.CLAMP),
      },
    ],
  }));

  const heroCardStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(scrollY.value, [0, 120], [0, -24], Extrapolation.CLAMP),
      },
    ],
    opacity: interpolate(scrollY.value, [0, 160], [1, 0.92], Extrapolation.CLAMP),
  }));

  const stickyNavStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      scrollY.value,
      [STICKY_THRESHOLD - 24, STICKY_THRESHOLD + 16],
      [0, 1],
      Extrapolation.CLAMP
    ),
    transform: [
      {
        translateY: interpolate(
          scrollY.value,
          [STICKY_THRESHOLD - 24, STICKY_THRESHOLD + 16],
          [-12, 0],
          Extrapolation.CLAMP
        ),
      },
    ],
  }));

  const recordSection =
    (id: SectionId) =>
    (e: LayoutChangeEvent) => {
      sectionOffsets.current[id] = e.nativeEvent.layout.y;
    };

  const scrollToSection = useCallback((id: SectionId) => {
    setActiveSection(id);
    const y = sectionOffsets.current[id];
    if (y != null) {
      scrollRef.current?.scrollTo({ y: Math.max(0, y - 56), animated: true });
    }
  }, []);

  const handleScrollEnd = useCallback((offsetY: number) => {
    const entries = (Object.entries(sectionOffsets.current) as [SectionId, number][]).sort(
      (a, b) => a[1] - b[1]
    );
    let current: SectionId | null = null;
    for (const [id, y] of entries) {
      if (offsetY >= y - 80) current = id;
    }
    setActiveSection(current);
  }, []);

  return (
    <View style={styles.root}>
      <Animated.View style={[styles.stickyNav, stickyNavStyle]} pointerEvents="box-none">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.stickyNavInner}
        >
          {NAV_SECTIONS.map((s) => {
            const on = activeSection === s.id;
            return (
              <PressableSpring
                key={s.id}
                style={[styles.navChip, on && styles.navChipOn]}
                onPress={() => scrollToSection(s.id)}
                scaleTo={0.94}
              >
                <Icon
                  name={s.icon}
                  size={14}
                  color={on ? colors.brandInverse : colors.accent}
                  variant={on ? 'filled' : 'outline'}
                />
                <Text style={[styles.navChipText, on && styles.navChipTextOn]}>{s.label}</Text>
              </PressableSpring>
            );
          })}
        </ScrollView>
      </Animated.View>

      <Animated.ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={onScroll}
        onMomentumScrollEnd={(e) => handleScrollEnd(e.nativeEvent.contentOffset.y)}
        onScrollEndDrag={(e) => handleScrollEnd(e.nativeEvent.contentOffset.y)}
      >
        <View style={styles.heroBlock}>
          <Animated.View style={[styles.heroPhotoWrap, heroImageStyle]}>
            <ImageBackground
              source={SHOWCASE_IMAGES.discoverHero}
              style={styles.heroPhoto}
              imageStyle={styles.heroPhotoImg}
            >
              <View style={styles.heroOverlay} />
            </ImageBackground>
          </Animated.View>

          <Animated.View style={[styles.heroCard, heroCardStyle, shadows.interactive]}>
            <View style={styles.heroAccent} />
            <View style={styles.heroCardBody}>
              <Logo background="light" width={120} showTagline={false} />
              <Text style={styles.heroTagline}>{BRAND.tagline}</Text>
              <View style={styles.livePill}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>{statsLabel}</Text>
              </View>
            </View>
          </Animated.View>

          <View style={styles.quickRow}>
            {QUICK_MODULES.map((mod) => (
              <PressableSpring
                key={mod.id}
                style={styles.quickBtn}
                onPress={() => onModulePress(mod.id)}
                scaleTo={0.92}
              >
                <View style={[styles.quickIcon, { backgroundColor: mod.bg }]}>
                  <Icon name={mod.icon} size={22} color={mod.color} variant="filled" />
                </View>
                <Text style={styles.quickLabel}>{mod.label}</Text>
              </PressableSpring>
            ))}
          </View>

          <View style={styles.heroCtas}>
            <ShimmerCTA label="Créer mon compte — gratuit" onPress={onSignup} />
            <ShimmerCTA variant="secondary" label="Explorer sans compte" onPress={() => scrollToSection('live')} delay={40} />
          </View>
        </View>

        <View onLayout={recordSection('live')} style={styles.section}>
          <DiscoverParallaxSection sectionId="live" scrollY={scrollY} sectionY={sectionY.live ?? 0}>
            <DiscoverSectionHeader
              label="Communauté"
              title="En direct sur ProDay"
              subtitle="Stats, annonces et tournois — données réelles"
              compact
            />
            <StaggerReveal index={0}>
              <DiscoverHighlightStrip highlights={highlights} />
            </StaggerReveal>
            <StaggerReveal index={1}>
              {loading ? (
                <ActivityIndicator color={colors.accent} style={styles.loader} />
              ) : stats ? (
                <AnimatedStatCounters stats={stats} onPress={onPress} />
              ) : null}
            </StaggerReveal>
            <StaggerReveal index={2}>
              <DiscoverLivePreview
                posts={posts}
                tournaments={tournaments}
                loading={loading}
                onPress={onPress}
              />
            </StaggerReveal>
            <StaggerReveal index={3}>
              <ProDayPulseIntro stats={stats} onPress={onPress} />
            </StaggerReveal>
            <ExploreLaunchpads onMercato={onMercato} onMatchs={onMatchs} />
          </DiscoverParallaxSection>
        </View>

        <View onLayout={recordSection('universe')} style={styles.section}>
          <DiscoverParallaxSection
            sectionId="universe"
            scrollY={scrollY}
            sectionY={sectionY.universe ?? 0}
          >
            <DiscoverSectionHeader
              label="Modules"
              title="Tout ProDay en un tap"
              subtitle="Swipez les univers ou touchez la grille"
              compact
            />
            <StaggerReveal index={0}>
              <DiscoverUniverseCarousel onModulePress={onModulePress} showHeader={false} />
            </StaggerReveal>
            <StaggerReveal index={1}>
              <DiscoverModuleHub
                onModulePress={onModulePress}
                liveRecruitment={liveRecruitment}
              />
            </StaggerReveal>
          </DiscoverParallaxSection>
        </View>

        <View onLayout={recordSection('journey')} style={styles.section}>
          <DiscoverParallaxSection
            sectionId="journey"
            scrollY={scrollY}
            sectionY={sectionY.journey ?? 0}
          >
            <DiscoverSectionHeader
              label="Parcours"
              title="Vivez l'expérience"
              subtitle="Étapes interactives — touchez pour explorer"
              compact
            />
            <DiscoverJourney onStepPress={onStepPress} />
            <StaggerReveal index={0}>
              <View style={styles.featureWrap}>
                <FeatureShowcaseAnimated onFeaturePress={onFeaturePress} />
              </View>
            </StaggerReveal>
          </DiscoverParallaxSection>
        </View>

        <View onLayout={recordSection('join')} style={styles.section}>
          <DiscoverParallaxSection
            sectionId="join"
            scrollY={scrollY}
            sectionY={sectionY.join ?? 0}
          >
            <DiscoverSectionHeader
              label="Expériences"
              title="Pages interactives"
              subtitle="Deck, stories, motion lab"
              compact
            />
            <DiscoverExperiencesHub onPress={onExperience} />
            <StaggerReveal index={0}>
              <View style={styles.foundersWrap}>
                <FoundersInteractive />
              </View>
            </StaggerReveal>
            <View style={styles.finalCtas}>
              <ShimmerCTA label="Créer mon compte — gratuit" onPress={onSignup} />
              <ShimmerCTA variant="secondary" label="J'ai déjà un compte" onPress={onSignup} delay={50} />
              <Text style={styles.footTagline}>{BRAND.tagline}</Text>
            </View>
          </DiscoverParallaxSection>
        </View>

        <MarqueePillars />
      </Animated.ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  content: {
    paddingBottom: TAB_BAR_CONTENT_INSET + spacing.xl,
  },
  stickyNav: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xs,
    backgroundColor: 'rgba(244, 246, 250, 0.94)',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    ...shadows.soft,
  },
  stickyNavInner: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },
  navChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  navChipOn: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  navChipText: { fontSize: 12, fontWeight: '700', color: colors.accent },
  navChipTextOn: { color: colors.brandInverse },
  heroBlock: {
    marginBottom: spacing.lg,
  },
  heroPhotoWrap: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    height: HERO_HEIGHT,
    borderRadius: radius.xl,
    overflow: 'hidden',
    ...shadows.interactive,
  },
  heroPhoto: { flex: 1 },
  heroPhotoImg: { borderRadius: radius.xl },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: brandOverlay(0.28),
  },
  heroCard: {
    marginHorizontal: spacing.lg,
    marginTop: -spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  heroAccent: { height: 4, backgroundColor: colors.accent },
  heroCardBody: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  heroTagline: {
    marginTop: spacing.sm,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    color: colors.textMuted,
  },
  livePill: {
    ...surfaces.pill,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.success,
  },
  liveText: { fontSize: 12, fontWeight: '700', color: colors.accent },
  quickRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  quickBtn: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  quickIcon: {
    width: 56,
    height: 56,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.soft,
  },
  quickLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  heroCtas: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  section: {
    marginTop: spacing.md,
  },
  loader: { marginVertical: spacing.xl },
  featureWrap: { marginTop: spacing.lg },
  foundersWrap: { marginTop: spacing.lg },
  finalCtas: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xl,
    gap: spacing.sm,
  },
  footTagline: {
    textAlign: 'center',
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    marginTop: spacing.sm,
  },
});
