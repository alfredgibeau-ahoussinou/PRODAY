import React from 'react';
import { View, StyleSheet } from 'react-native';
import { GlassCard } from '../../../components/aurora/GlassCard';
import { ProDayText } from '../../../components/ui/ProDayText';
import { AnimatedEntrance } from '../../../components/motion';
import { useAppTheme } from '../../../context/ProductLineContext';
import { useTranslation } from '../../../context/LocaleContext';
import type { GamificationState } from '../../../features/v3/models/gamification';
import { spacing, radius } from '../../../theme/designTokens';

interface ProgressionBlockProps {
  progression: GamificationState;
  weeklyGoalPercent?: number;
}

/** Bloc progression XP / niveau / streak (spec §4.6). */
export const ProgressionBlock: React.FC<ProgressionBlockProps> = ({
  progression,
  weeklyGoalPercent = 0,
}) => {
  const { colors } = useAppTheme();
  const { t } = useTranslation();

  return (
    <AnimatedEntrance kind="fadeUp">
      <GlassCard variant="default" style={styles.card}>
        <View style={styles.header}>
          <View>
            <ProDayText variant="caption" muted style={styles.rank}>
              {progression.rankLabel}
            </ProDayText>
            <ProDayText variant="section">Niveau {progression.level}</ProDayText>
          </View>
          <View
            style={[
              styles.streak,
              { backgroundColor: colors.accentSoft, borderColor: colors.accentMuted },
            ]}
          >
            <ProDayText variant="hero" accent style={styles.streakNum}>
              {progression.streakDays}
            </ProDayText>
            <ProDayText variant="caption" muted style={styles.streakLabel}>
              {t('progression.streakDays')}
            </ProDayText>
          </View>
        </View>

        <View style={styles.xpRow}>
          <ProDayText variant="caption" muted>
            {progression.xp} XP
          </ProDayText>
          <ProDayText variant="caption" muted>
            {progression.xpToNext} XP restants
          </ProDayText>
        </View>
        <View style={[styles.track, { backgroundColor: colors.surfaceMuted }]}>
          <View
            style={[
              styles.fill,
              {
                width: `${Math.round(progression.xpProgress * 100)}%`,
                backgroundColor: colors.accent,
              },
            ]}
          />
        </View>

        <View style={styles.goalRow}>
          <ProDayText variant="caption" muted>
            {t('progression.weeklyGoal')}
          </ProDayText>
          <ProDayText variant="caption" accent style={styles.goalValue}>
            {weeklyGoalPercent}%
          </ProDayText>
        </View>
        <View style={[styles.track, { backgroundColor: colors.surfaceMuted }]}>
          <View
            style={[
              styles.fill,
              { width: `${weeklyGoalPercent}%`, backgroundColor: colors.accentLight },
            ]}
          />
        </View>
      </GlassCard>
    </AnimatedEntrance>
  );
};

const styles = StyleSheet.create({
  card: { padding: spacing.lg, gap: spacing.sm, marginBottom: spacing.md },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rank: { textTransform: 'uppercase', letterSpacing: 1, fontSize: 9 },
  streak: {
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    minWidth: 56,
  },
  streakNum: { fontSize: 22, fontWeight: '800', lineHeight: 24 },
  streakLabel: { fontSize: 9 },
  xpRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.xs },
  track: { height: 4, borderRadius: 2, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 2 },
  goalRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.sm },
  goalValue: { fontWeight: '700' },
});
