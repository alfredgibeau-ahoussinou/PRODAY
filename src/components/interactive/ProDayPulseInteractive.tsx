import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { ProDayGradient } from '../ui/ProDayGradient';
import type { ProdayPulseResult, PulseBreakdownItem } from '../../utils/prodayPulse';
import type { RecruitmentStats } from '../../services/stats.service';
import { PressableSpring } from '../discover/PressableSpring';
import { Icon } from '../ui/Icon';
import { useAppTheme } from '../../context/ProductLineContext';
import { spacing, radius } from '../../theme/designTokens';
import type { AppColors } from '../../theme/universeTheme';
import { fontFamily } from '../../theme/typography';
import { profileType } from '../profile/profileTypography';
import { SPRING_BOUNCY } from '../discover/animationConfig';

interface ProDayPulseInteractiveProps {
  pulse: ProdayPulseResult;
  breakdown: PulseBreakdownItem[];
  variant?: 'dark' | 'light';
  /** Profil / cartes denses — anneau et textes réduits. */
  density?: 'default' | 'compact';
  /** Centrage vertical (onglet Profil mobile). */
  align?: 'start' | 'center';
  onExpand?: () => void;
}

const BreakdownBar: React.FC<{
  item: PulseBreakdownItem;
  delay: number;
  dark: boolean;
  styles: ReturnType<typeof createStyles>;
}> = ({ item, delay, dark, styles }) => {
  const width = useSharedValue(0);

  useEffect(() => {
    width.value = withTiming(
      item.maxPoints > 0 ? item.points / item.maxPoints : 0,
      { duration: 700 + delay }
    );
  }, [delay, item.maxPoints, item.points, width]);

  const barStyle = useAnimatedStyle(() => ({
    width: `${width.value * 100}%`,
  }));

  return (
    <View style={styles.factor}>
      <View style={styles.factorHead}>
        <Text style={[styles.factorLabel, dark && styles.factorLabelDark]}>
          {item.label}
        </Text>
        <Text style={[styles.factorPts, dark && styles.factorPtsDark]}>
          {item.points}/{item.maxPoints}
        </Text>
      </View>
      <View style={[styles.factorTrack, dark && styles.factorTrackDark]}>
        <Animated.View style={[styles.factorFill, barStyle]} />
      </View>
      <Text style={[styles.factorTip, dark && styles.factorTipDark]}>{item.tip}</Text>
    </View>
  );
};

export const ProDayPulseInteractive: React.FC<ProDayPulseInteractiveProps> = ({
  pulse,
  breakdown,
  variant = 'dark',
  density = 'default',
  align = 'start',
  onExpand,
}) => {
  const { colors: c } = useAppTheme();
  const compact = density === 'compact';
  const centered = align === 'center';
  const styles = useMemo(() => createStyles(c, compact, centered), [c, compact, centered]);
  const [expanded, setExpanded] = useState(false);
  const ringScale = useSharedValue(1);
  const glowPulse = useSharedValue(1);
  const dark = variant === 'dark';

  useEffect(() => {
    glowPulse.value = withRepeat(
      withSequence(
        withTiming(1.12, { duration: 1400 }),
        withTiming(1, { duration: 1400 })
      ),
      -1,
      false
    );
  }, [glowPulse]);

  const ringAnim = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale.value }],
  }));

  const glowAnim = useAnimatedStyle(() => ({
    transform: [{ scale: glowPulse.value }],
    opacity: 0.35 + (glowPulse.value - 1) * 2,
  }));

  const toggle = () => {
    const next = !expanded;
    setExpanded(next);
    ringScale.value = withSpring(next ? 1.08 : 1, SPRING_BOUNCY);
    if (next) onExpand?.();
  };

  const ringControl = (
    <PressableSpring onPress={toggle} scaleTo={0.92}>
      <View style={styles.ringWrap}>
        <Animated.View style={[styles.ringGlow, glowAnim]}>
          <ProDayGradient kind="cta" style={styles.ringGlowFill} />
        </Animated.View>
        <Animated.View style={[styles.ring, dark && styles.ringDark, ringAnim]}>
          <Text style={[styles.score, dark && styles.scoreDark, profileType.pulseScore]}>
            {pulse.score}
          </Text>
          <Text style={[styles.scoreLabel, dark && styles.scoreLabelDark, profileType.pulseLabel]}>
            PULSE
          </Text>
          <View style={styles.tapBadge}>
            <Icon
              name={expanded ? 'chevron-up' : 'chevron-down'}
              size={12}
              color={c.accent}
            />
          </View>
        </Animated.View>
      </View>
    </PressableSpring>
  );

  return (
    <View style={centered ? styles.centerRoot : undefined}>
      {centered ? (
        <View style={styles.centerStack}>
          <Text style={[styles.hint, dark && styles.hintDark, profileType.pulseHint]}>
            {pulse.label} — {pulse.hint}
          </Text>
          {ringControl}
        </View>
      ) : (
        <View style={styles.row}>
          <View style={styles.copy}>
            <Text style={[styles.hint, dark && styles.hintDark]}>
              {pulse.label} — {pulse.hint}
            </Text>
          </View>
          {ringControl}
        </View>
      )}

      <View style={[styles.barBg, dark && styles.barBgDark, centered && styles.barBgCentered]}>
        <ProDayGradient
          kind="cta"
          style={[styles.barFill, { width: `${pulse.score}%` }]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
        />
      </View>

      {expanded ? (
        <Animated.View entering={FadeInDown.springify()} style={styles.breakdown}>
          <Text style={[styles.breakdownTitle, dark && styles.breakdownTitleDark]}>
            Détail Pulse ProDay
          </Text>
          {breakdown.map((item, i) => (
            <BreakdownBar key={item.key} item={item} delay={i * 80} dark={dark} styles={styles} />
          ))}
          <Text style={[styles.breakdownFoot, dark && styles.breakdownFootDark]}>
            Touchez l'anneau pour replier
          </Text>
        </Animated.View>
      ) : compact ? null : (
        <Text style={[styles.tapHint, dark && styles.tapHintDark]}>
          Touchez le Pulse pour le détail →
        </Text>
      )}
    </View>
  );
};

/** Intro Pulse — chiffres communauté réels, sans score inventé. */
export const ProDayPulseIntro: React.FC<{
  stats: RecruitmentStats | null;
  onPress: () => void;
}> = ({ stats, onPress }) => {
  const { colors: c } = useAppTheme();
  const styles = useMemo(() => createStyles(c, false, false), [c]);

  return (
    <PressableSpring style={styles.teaserWrap} onPress={onPress} scaleTo={0.98}>
      <View style={styles.teaserHead}>
        <ProDayGradient kind="cta" style={styles.teaserIconWrap}>
          <Icon name="star-four-points" size={16} color="#FFFFFF" variant="filled" />
        </ProDayGradient>
        <Text style={styles.teaserTitle}>Pulse ProDay — exclusif</Text>
      </View>
      <Text style={styles.teaserBody}>
        Votre score de visibilité se calcule à partir de votre profil, vos stats saison et
        votre activité sur la plateforme. Connectez-vous pour voir votre Pulse personnel.
      </Text>
      {stats ? (
        <View style={styles.teaserStats}>
          <View style={styles.teaserStat}>
            <Text style={styles.teaserStatValue}>{stats.players}</Text>
            <Text style={styles.teaserStatLabel}>Joueurs</Text>
          </View>
          <View style={styles.teaserStatSep} />
          <View style={styles.teaserStat}>
            <Text style={styles.teaserStatValue}>{stats.recruitment_posts_open}</Text>
            <Text style={styles.teaserStatLabel}>Annonces</Text>
          </View>
          <View style={styles.teaserStatSep} />
          <View style={styles.teaserStat}>
            <Text style={styles.teaserStatValue}>{stats.clubs}</Text>
            <Text style={styles.teaserStatLabel}>Clubs</Text>
          </View>
        </View>
      ) : null}
      <Text style={styles.teaserCta}>Créer mon compte pour activer mon Pulse →</Text>
    </PressableSpring>
  );
};

function createStyles(c: AppColors, compact: boolean, centered: boolean) {
  const ringOuter = compact ? 72 : 92;
  const ringInner = compact ? 64 : 84;
  return StyleSheet.create({
    centerRoot: { alignItems: 'center' },
    centerStack: { alignItems: 'center', gap: spacing.sm, width: '100%' },
    row: {
      flexDirection: 'row',
      alignItems: compact ? 'center' : 'flex-start',
      gap: compact ? spacing.sm : spacing.md,
    },
    copy: { flex: 1, paddingTop: compact ? 0 : spacing.sm },
    hint: {
      fontFamily: fontFamily.regular,
      fontSize: centered ? 12 : 11,
      lineHeight: centered ? 17 : 16,
      color: c.textSecondary,
      textAlign: centered ? 'center' : 'left',
    },
    hintDark: { color: c.heroMuted },
    ringWrap: {
      width: ringOuter,
      height: ringOuter,
      alignItems: 'center',
      justifyContent: 'center',
    },
    ringGlow: {
      position: 'absolute',
      width: ringOuter,
      height: ringOuter,
      borderRadius: ringOuter / 2,
      overflow: 'hidden',
    },
    ringGlowFill: {
      flex: 1,
      borderRadius: ringOuter / 2,
    },
    ring: {
      width: ringInner,
      height: ringInner,
      borderRadius: ringInner / 2,
      borderWidth: 3,
      borderColor: c.accent,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.brandSoft,
    },
    ringDark: {
      backgroundColor: 'rgba(0,51,153,0.35)',
      borderColor: c.accent,
    },
    score: { fontSize: compact ? 22 : 28, fontWeight: '900', color: c.text },
    scoreDark: { color: c.brandInverse },
    scoreLabel: {
      fontSize: 8,
      fontWeight: '800',
      letterSpacing: 1,
      color: c.textMuted,
    },
    scoreLabelDark: { color: c.heroMuted },
    tapBadge: {
      position: 'absolute',
      bottom: -4,
      backgroundColor: c.surface,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: c.brand,
      padding: 2,
    },
    barBg: {
      height: 4,
      backgroundColor: c.surfaceMuted,
      marginTop: spacing.md,
      borderRadius: 2,
      overflow: 'hidden',
      alignSelf: 'stretch',
    },
    barBgCentered: { width: '100%' },
    barBgDark: { backgroundColor: 'rgba(255,255,255,0.2)' },
    barFill: { height: '100%' },
    tapHint: {
      fontSize: 10,
      fontWeight: '700',
      color: c.brand,
      marginTop: spacing.sm,
    },
    tapHintDark: { color: 'rgba(255,255,255,0.55)' },
    breakdown: {
      marginTop: spacing.md,
      backgroundColor: c.brandSoft,
      borderRadius: radius.md,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: c.brand,
    },
    breakdownTitle: {
      fontSize: 12,
      fontWeight: '900',
      color: c.brand,
      marginBottom: spacing.sm,
      letterSpacing: 0.5,
    },
    breakdownTitleDark: { color: c.brand },
    factor: { marginBottom: spacing.sm },
    factorHead: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
    factorLabel: { fontSize: 11, fontWeight: '800', color: c.text },
    factorLabelDark: { color: c.brandInverse },
    factorPts: { fontSize: 11, fontWeight: '800', color: c.brand },
    factorPtsDark: { color: c.brand },
    factorTrack: {
      height: 6,
      backgroundColor: c.surface,
      borderRadius: 3,
      overflow: 'hidden',
    },
    factorTrackDark: { backgroundColor: 'rgba(255,255,255,0.15)' },
    factorFill: { height: '100%', backgroundColor: c.brand, borderRadius: 3 },
    factorTip: { fontSize: 10, color: c.textMuted, marginTop: 3 },
    factorTipDark: { color: c.heroMuted },
    breakdownFoot: {
      fontSize: 10,
      color: c.textMuted,
      marginTop: spacing.xs,
      fontStyle: 'italic',
    },
    breakdownFootDark: { color: c.heroMuted },
    teaserWrap: {
      marginHorizontal: spacing.lg,
      marginTop: spacing.lg,
      backgroundColor: c.surface,
      borderRadius: radius.lg,
      padding: spacing.lg,
      borderWidth: 1,
      borderColor: c.border,
    },
    teaserHead: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginBottom: spacing.md,
    },
    teaserIconWrap: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    teaserTitle: { fontSize: 15, fontWeight: '900', color: c.text },
    teaserBody: {
      fontSize: 13,
      lineHeight: 20,
      color: c.textSecondary,
      marginBottom: spacing.md,
    },
    teaserStats: {
      flexDirection: 'row',
      backgroundColor: c.brandSoft,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: c.brand,
      marginBottom: spacing.md,
    },
    teaserStat: { flex: 1, alignItems: 'center', paddingVertical: spacing.md },
    teaserStatValue: { fontSize: 22, fontWeight: '900', color: c.brand },
    teaserStatLabel: {
      fontSize: 9,
      fontWeight: '800',
      color: c.textMuted,
      marginTop: 4,
      letterSpacing: 0.5,
    },
    teaserStatSep: { width: 1, backgroundColor: 'rgba(0,51,153,0.2)' },
    teaserCta: {
      fontSize: 13,
      fontWeight: '800',
      color: c.brand,
    },
  });
}
