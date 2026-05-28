import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import type { ProdayPulseResult, PulseBreakdownItem } from '../../utils/prodayPulse';
import type { RecruitmentStats } from '../../services/stats.service';
import { PressableSpring } from '../discover/PressableSpring';
import { Icon } from '../ui/Icon';
import { colors, spacing, radius } from '../../theme/designTokens';
import { SPRING_BOUNCY } from '../discover/animationConfig';

interface ProDayPulseInteractiveProps {
  pulse: ProdayPulseResult;
  breakdown: PulseBreakdownItem[];
  variant?: 'dark' | 'light';
  onExpand?: () => void;
}

const BreakdownBar: React.FC<{
  item: PulseBreakdownItem;
  delay: number;
  dark: boolean;
}> = ({ item, delay, dark }) => {
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
  onExpand,
}) => {
  const [expanded, setExpanded] = useState(false);
  const ringScale = useSharedValue(1);
  const dark = variant === 'dark';

  const ringAnim = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale.value }],
  }));

  const toggle = () => {
    const next = !expanded;
    setExpanded(next);
    ringScale.value = withSpring(next ? 1.06 : 1, SPRING_BOUNCY);
    if (next) onExpand?.();
  };

  return (
    <View>
      <View style={styles.row}>
        <View style={styles.copy}>
          <Text style={[styles.hint, dark && styles.hintDark]}>
            {pulse.label} — {pulse.hint}
          </Text>
        </View>
        <PressableSpring onPress={toggle} scaleTo={0.9}>
          <Animated.View style={[styles.ring, dark && styles.ringDark, ringAnim]}>
            <Text style={[styles.score, dark && styles.scoreDark]}>{pulse.score}</Text>
            <Text style={[styles.scoreLabel, dark && styles.scoreLabelDark]}>PULSE</Text>
            <View style={styles.tapBadge}>
              <Icon
                name={expanded ? 'chevron-up' : 'chevron-down'}
                size={12}
                color={colors.accent}
              />
            </View>
          </Animated.View>
        </PressableSpring>
      </View>

      <View style={[styles.barBg, dark && styles.barBgDark]}>
        <View style={[styles.barFill, { width: `${pulse.score}%` }]} />
      </View>

      {expanded ? (
        <Animated.View entering={FadeInDown.springify()} style={styles.breakdown}>
          <Text style={[styles.breakdownTitle, dark && styles.breakdownTitleDark]}>
            Détail Pulse ProDay
          </Text>
          {breakdown.map((item, i) => (
            <BreakdownBar key={item.key} item={item} delay={i * 80} dark={dark} />
          ))}
          <Text style={[styles.breakdownFoot, dark && styles.breakdownFootDark]}>
            Touchez l’anneau pour replier
          </Text>
        </Animated.View>
      ) : (
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
}> = ({ stats, onPress }) => (
  <PressableSpring style={styles.teaserWrap} onPress={onPress} scaleTo={0.98}>
    <View style={styles.teaserHead}>
      <Icon name="star-four-points" size={18} color={colors.accent} />
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

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  copy: { flex: 1, paddingTop: spacing.sm },
  hint: { fontSize: 11, lineHeight: 16, color: colors.textSecondary },
  hintDark: { color: colors.heroMuted },
  ring: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 3,
    borderColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accentSoft,
  },
  ringDark: {
    backgroundColor: 'rgba(0,51,153,0.35)',
  },
  score: { fontSize: 24, fontWeight: '900', color: colors.text },
  scoreDark: { color: colors.brandInverse },
  scoreLabel: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1,
    color: colors.textMuted,
  },
  scoreLabelDark: { color: colors.heroMuted },
  tapBadge: {
    position: 'absolute',
    bottom: -4,
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.accent,
    padding: 2,
  },
  barBg: {
    height: 4,
    backgroundColor: colors.surfaceMuted,
    marginTop: spacing.md,
    borderRadius: 2,
    overflow: 'hidden',
  },
  barBgDark: { backgroundColor: 'rgba(255,255,255,0.2)' },
  barFill: { height: '100%', backgroundColor: colors.accent },
  tapHint: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.accent,
    marginTop: spacing.sm,
  },
  tapHintDark: { color: 'rgba(255,255,255,0.55)' },
  breakdown: {
    marginTop: spacing.md,
    backgroundColor: colors.accentSoft,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  breakdownTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: colors.accent,
    marginBottom: spacing.sm,
    letterSpacing: 0.5,
  },
  breakdownTitleDark: { color: colors.accent },
  factor: { marginBottom: spacing.sm },
  factorHead: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  factorLabel: { fontSize: 11, fontWeight: '800', color: colors.text },
  factorLabelDark: { color: colors.brandInverse },
  factorPts: { fontSize: 11, fontWeight: '800', color: colors.accent },
  factorPtsDark: { color: colors.accent },
  factorTrack: {
    height: 6,
    backgroundColor: colors.surface,
    borderRadius: 3,
    overflow: 'hidden',
  },
  factorTrackDark: { backgroundColor: 'rgba(255,255,255,0.15)' },
  factorFill: { height: '100%', backgroundColor: colors.accent, borderRadius: 3 },
  factorTip: { fontSize: 10, color: colors.textMuted, marginTop: 3 },
  factorTipDark: { color: colors.heroMuted },
  breakdownFoot: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: spacing.xs,
    fontStyle: 'italic',
  },
  breakdownFootDark: { color: colors.heroMuted },
  teaserWrap: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  teaserHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  teaserTitle: { fontSize: 15, fontWeight: '900', color: colors.text },
  teaserBody: {
    fontSize: 13,
    lineHeight: 20,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  teaserStats: {
    flexDirection: 'row',
    backgroundColor: colors.accentSoft,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.accent,
    marginBottom: spacing.md,
  },
  teaserStat: { flex: 1, alignItems: 'center', paddingVertical: spacing.md },
  teaserStatValue: { fontSize: 22, fontWeight: '900', color: colors.accent },
  teaserStatLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.textMuted,
    marginTop: 4,
    letterSpacing: 0.5,
  },
  teaserStatSep: { width: 1, backgroundColor: 'rgba(0,51,153,0.2)' },
  teaserCta: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.accent,
  },
});
