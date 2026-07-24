import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { PressableSpring, SkeletonList, StaggerReveal } from '../motion';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Logo } from '../Logo';
import { spacing, radius, shadows } from '../../theme/designTokens';
import { useAppTheme } from '../../context/ProductLineContext';
import { useLaunchIntro } from '../../context/LaunchIntroContext';
import { UniverseBadge } from '../branding/UniverseBadge';
import { getUniverseIdentity, PRODAY_BRAND_DNA } from '../../content/brandExperience';
import { getDiscoverHomeCopy, getHomeModules } from '../../content/homeExperience';
import { HomeModuleRail } from './HomeModuleRail';
import { HomeQuickStrip, type HomeQuickItem } from './HomeQuickStrip';
import { ProDayShopButton } from '../shop/ProDayShopButton';
import { Icon } from '../ui/Icon';
import { GUEST_SCROLL_INSET } from '../../navigation/tabBarLayout';
import type { ProDayModuleId } from '../../content/prodayModules';
import type { RecruitmentStats } from '../../services/stats.service';

interface DiscoverHomeScrollProps {
  stats: RecruitmentStats | null;
  loading: boolean;
  liveRecruitment: boolean;
  onSignup: () => void;
  onLogin: () => void;
  onModulePress: (id: ProDayModuleId) => void;
}

export const DiscoverHomeScroll: React.FC<DiscoverHomeScrollProps> = ({
  stats,
  loading,
  liveRecruitment,
  onSignup,
  onLogin,
  onModulePress,
}) => {
  const insets = useSafeAreaInsets();
  const { colors, productLine } = useAppTheme();
  const { openSpacePicker } = useLaunchIntro();
  const brand = getUniverseIdentity(productLine);
  const copy = useMemo(() => getDiscoverHomeCopy(productLine), [productLine]);
  const heroLines = copy.heroTitle.split('\n');

  const quickItems = useMemo((): HomeQuickItem[] => {
    const items: HomeQuickItem[] = [
      {
        id: 'mercato',
        label: copy.secondaryMercato,
        icon: 'search',
        onPress: onSignup,
      },
      { id: 'matchs', label: 'Matchs', icon: 'handshake', onPress: onSignup },
      { id: 'covoiturage', label: 'Covoiturage', icon: 'car', onPress: onSignup },
    ];
    if (productLine !== 'pro') {
      items.push({ id: 'sante', label: 'Santé', icon: 'heart', onPress: onSignup });
    }
    return items;
  }, [copy.secondaryMercato, onSignup, productLine]);

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.content,
        { paddingTop: Math.max(insets.top, spacing.md) },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Logo background="light" width={156} showTagline={false} productLine={productLine} />
        <UniverseBadge productLine={productLine} colors={colors} />
        <Text style={[styles.tagline, { color: colors.textMuted }]}>{brand.tagline}</Text>
      </View>

      <View style={styles.hero}>
        {heroLines.map((line, i) => (
          <Text
            key={`${line}-${i}`}
            style={[
              styles.heroTitle,
              { color: colors.text },
              i > 0 && styles.heroTitleSecond,
            ]}
          >
            {line}
          </Text>
        ))}
        <Text style={[styles.heroSub, { color: colors.textSecondary }]}>{copy.heroSub}</Text>
      </View>

      {loading ? (
        <SkeletonList count={1} variant="card" />
      ) : stats ? (
        <StaggerReveal index={0}>
          <View
            style={[
              styles.statsCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <StatCell value={String(stats.players)} label={copy.playersStatLabel} colors={colors} />
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <StatCell value={String(stats.clubs)} label="Clubs" colors={colors} />
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <StatCell value={String(stats.recruitment_posts_open)} label="Annonces" colors={colors} />
          </View>
        </StaggerReveal>
      ) : null}

      <View style={styles.pillars}>
        {PRODAY_BRAND_DNA.pillars.map((pillar, index) => (
          <StaggerReveal key={pillar} index={index + 1}>
            <View
              style={[styles.pillar, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}
            >
              <Text style={[styles.pillarText, { color: colors.textSecondary }]}>{pillar}</Text>
            </View>
          </StaggerReveal>
        ))}
      </View>

      <StaggerReveal index={5}>
        <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>{copy.sectionExplore}</Text>
        <HomeQuickStrip items={quickItems} />
        <HomeModuleRail
          modules={getHomeModules(productLine)}
          onModulePress={onModulePress}
          liveRecruitment={liveRecruitment}
          style={styles.railPad}
        />
      </StaggerReveal>

      <StaggerReveal index={6}>
        <PressableSpring
          style={[styles.cta, { backgroundColor: colors.accent }, shadows.interactive]}
          onPress={onSignup}
          scaleTo={0.97}
          haptic
        >
          <Text style={[styles.ctaText, { color: colors.brandInverse }]}>{copy.ctaText}</Text>
          <Icon name="chevron-forward" size={20} color={colors.brandInverse} />
        </PressableSpring>

        <PressableSpring style={styles.loginLink} onPress={onLogin} scaleTo={0.99}>
          <Text style={[styles.loginText, { color: colors.textSecondary }]}>
            J’ai déjà un compte. {' '}
            <Text style={[styles.loginAccent, { color: colors.ink }]}>Se connecter</Text>
          </Text>
        </PressableSpring>

        <View style={[styles.trust, { backgroundColor: colors.surfaceMuted }]}>
          <Icon name="shield" size={16} color={colors.textMuted} />
          <Text style={[styles.trustText, { color: colors.textSecondary }]}>{copy.trustText}</Text>
        </View>

        <PressableSpring
          style={[styles.spaceLink, { borderColor: colors.borderStrong, backgroundColor: colors.surface }]}
          onPress={openSpacePicker}
          scaleTo={0.99}
        >
          <Text style={[styles.spaceLinkText, { color: colors.textSecondary }]}>
            {brand.productName}. Changer d’univers
          </Text>
          <Icon name="chevron-down" size={14} color={colors.accent} />
        </PressableSpring>
      </StaggerReveal>
    </ScrollView>
  );
};

const StatCell: React.FC<{
  value: string;
  label: string;
  colors: { text: string; textMuted: string };
}> = ({ value, label, colors }) => (
  <View style={styles.statCell}>
    <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
    <Text style={[styles.statLabel, { color: colors.textMuted }]}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: GUEST_SCROLL_INSET + spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
    gap: spacing.sm,
  },
  headerTop: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: spacing.xs,
  },
  headerSpacer: { flex: 1 },
  tagline: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  hero: {
    marginBottom: spacing.lg,
  },
  heroTitle: {
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: -1,
    lineHeight: 38,
  },
  heroTitleSecond: {
    marginTop: 2,
  },
  heroSub: {
    fontSize: 15,
    lineHeight: 22,
    marginTop: spacing.md,
  },
  loader: { marginVertical: spacing.xl },
  statsCard: {
    flexDirection: 'row',
    borderRadius: radius.xl,
    paddingVertical: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    ...shadows.card,
  },
  statCell: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: '900' },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  statDivider: {
    width: 1,
    marginVertical: spacing.xs,
  },
  pillars: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.xl,
  },
  pillar: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  pillarText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
  },
  railPad: { paddingLeft: 0, marginBottom: spacing.lg },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    marginBottom: spacing.sm,
  },
  ctaText: {
    fontSize: 16,
    fontWeight: '800',
  },
  loginLink: {
    alignItems: 'center',
    marginBottom: spacing.lg,
    paddingVertical: spacing.sm,
  },
  loginText: { fontSize: 14 },
  loginAccent: { fontWeight: '800' },
  trust: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
    marginBottom: spacing.md,
  },
  trustText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
  },
  spaceLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    alignSelf: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1.5,
  },
  spaceLinkText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
