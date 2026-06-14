import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import type { HealthSnapshot } from '../../../core/types/health';
import { GlassCard } from '../../../components/aurora/GlassCard';
import { ProDayText } from '../../../components/ui/ProDayText';
import { Icon } from '../../../components/ui/Icon';
import { useAppTheme } from '../../../context/ProductLineContext';
import { spacing, radius } from '../../../theme/designTokens';

interface HealthSummaryCardProps {
  health: HealthSnapshot;
  onExplainPress?: () => void;
}

const STATE_LABELS: Record<HealthSnapshot['state'], string> = {
  OPTIMAL: 'Optimal',
  ACTIVE: 'Actif',
  FATIGUED: 'Fatigué',
  OVERLOADED: 'Surchargé',
  INJURY_RISK: 'Risque blessure',
  RECOVERY: 'Récupération',
};

/** Résumé santé temps réel — fatigue, récupération, conseil coach. */
export const HealthSummaryCard: React.FC<HealthSummaryCardProps> = ({
  health,
  onExplainPress,
}) => {
  const { colors } = useAppTheme();

  return (
    <GlassCard variant="default" style={styles.card}>
      <View style={styles.header}>
        <View style={[styles.iconWrap, { backgroundColor: colors.accentSoft }]}>
          <Icon name="heart" size={18} color={colors.accent} />
        </View>
        <View style={styles.copy}>
          <ProDayText variant="section">État santé</ProDayText>
          <ProDayText variant="caption" muted>
            {STATE_LABELS[health.state]}
          </ProDayText>
        </View>
        {onExplainPress ? (
          <Pressable onPress={onExplainPress} style={styles.explainBtn} hitSlop={8}>
            <Icon name="alert-circle" size={18} color={colors.accent} />
            <ProDayText variant="caption" accent style={styles.explainText}>
              Pourquoi ?
            </ProDayText>
          </Pressable>
        ) : null}
      </View>

      <View style={styles.metrics}>
        <Metric label="Fatigue" value={health.fatigueScore} colors={colors} />
        <Metric label="Récup." value={health.recoveryScore} colors={colors} accent />
        <Metric label="Charge" value={health.trainingLoad} colors={colors} />
      </View>

      <ProDayText variant="body" muted style={styles.hint}>
        {health.dailyPlanHint}
      </ProDayText>
      <ProDayText variant="caption" style={styles.message}>
        {health.coachMessage}
      </ProDayText>
    </GlassCard>
  );
};

const Metric: React.FC<{
  label: string;
  value: number;
  colors: ReturnType<typeof useAppTheme>['colors'];
  accent?: boolean;
}> = ({ label, value, colors, accent }) => (
  <View style={styles.metric}>
    <ProDayText variant="caption" muted style={styles.metricLabel}>
      {label}
    </ProDayText>
    <ProDayText variant="section" accent={accent}>
      {value}
    </ProDayText>
    <View style={[styles.track, { backgroundColor: colors.surfaceMuted }]}>
      <View
        style={[
          styles.fill,
          {
            width: `${Math.min(100, value)}%`,
            backgroundColor: accent ? colors.accent : colors.accentLight,
          },
        ]}
      />
    </View>
  </View>
);

const styles = StyleSheet.create({
  card: { padding: spacing.lg, gap: spacing.sm, marginBottom: spacing.md, marginHorizontal: spacing.lg },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: { flex: 1, gap: 2 },
  explainBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  explainText: { fontWeight: '700' },
  metrics: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  metric: { flex: 1, gap: 2 },
  metricLabel: { fontSize: 9, textTransform: 'uppercase', letterSpacing: 0.5 },
  track: { height: 3, borderRadius: 2, overflow: 'hidden', marginTop: 2 },
  fill: { height: '100%', borderRadius: 2 },
  hint: { marginTop: spacing.xs, fontWeight: '600' },
  message: { lineHeight: 18, color: undefined },
});
