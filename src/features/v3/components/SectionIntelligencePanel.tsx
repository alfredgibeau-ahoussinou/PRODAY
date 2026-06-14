import React from 'react';
import { View, StyleSheet } from 'react-native';
import { GlassCard } from '../../../components/aurora/GlassCard';
import { ProDayText } from '../../../components/ui/ProDayText';
import { Icon } from '../../../components/ui/Icon';
import { PressableSpring } from '../../../components/motion';
import { useAppTheme } from '../../../context/ProductLineContext';
import type { SectionIntelligence } from '../models/sectionIntelligence';
import { spacing, radius } from '../../../theme/designTokens';

interface SectionIntelligencePanelProps {
  data: SectionIntelligence;
  compact?: boolean;
  embedded?: boolean;
  onInsightPress?: (insightId: string) => void;
}

/** Panneau IA par section — insight contextuel (spec §6, §11). */
export const SectionIntelligencePanel: React.FC<SectionIntelligencePanelProps> = ({
  data,
  compact = false,
  embedded = false,
  onInsightPress,
}) => {
  const { colors } = useAppTheme();
  const top = data.insights[0];

  if (!top && compact) return null;

  return (
    <GlassCard variant="accent" style={[styles.card, compact && styles.compact, embedded && styles.embedded]}>
      <View style={styles.header}>
        <View style={[styles.icon, { backgroundColor: colors.accentSoft }]}>
          <Icon name="star-four-points" size={16} color={colors.accent} variant="filled" />
        </View>
        <View style={styles.copy}>
          <ProDayText variant="caption" muted style={styles.eyebrow}>
            Intelligence ProDay
          </ProDayText>
          <ProDayText variant="section" numberOfLines={1} style={styles.headline}>
            {data.headline}
          </ProDayText>
          <ProDayText variant="body" muted numberOfLines={compact ? 2 : 3} style={styles.summary}>
            {data.summary}
          </ProDayText>
        </View>
      </View>

      {!compact && data.insights.length > 1 ? (
        <View style={styles.insights}>
          {data.insights.slice(1, 4).map((insight) => (
            <PressableSpring
              key={insight.id}
              onPress={() => onInsightPress?.(insight.id)}
              style={[styles.chip, { borderColor: colors.border, backgroundColor: colors.surfaceMuted }]}
              scaleTo={0.98}
            >
              <ProDayText variant="caption" accent style={styles.chipLabel}>
                {insight.label}
              </ProDayText>
            </PressableSpring>
          ))}
        </View>
      ) : null}

      {data.primaryAction && onInsightPress ? (
        <PressableSpring
          onPress={() => onInsightPress(data.primaryAction!.insightId)}
          style={[styles.cta, { backgroundColor: colors.accent }]}
          scaleTo={0.98}
          haptic
        >
          <ProDayText variant="caption" inverse style={styles.ctaLabel}>
            {data.primaryAction.label}
          </ProDayText>
          <Icon name="chevron-forward" size={14} color="#fff" />
        </PressableSpring>
      ) : null}
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.md,
    gap: spacing.sm,
  },
  compact: { marginBottom: spacing.sm },
  embedded: { marginHorizontal: 0, marginBottom: 0 },
  header: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  icon: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: { flex: 1, minWidth: 0, gap: 2 },
  eyebrow: { fontSize: 9, letterSpacing: 1.6, textTransform: 'uppercase' },
  headline: { fontWeight: '700', fontSize: 16 },
  summary: { fontSize: 13, lineHeight: 19 },
  insights: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  chip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  chipLabel: { fontWeight: '600', fontSize: 11 },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    marginTop: spacing.xs,
  },
  ctaLabel: { fontWeight: '700' },
});
