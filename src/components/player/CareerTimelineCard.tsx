import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { GlassCard } from '../aurora/GlassCard';
import { ProDayText } from '../ui/ProDayText';
import { Icon } from '../ui/Icon';
import { AnimatedEntrance } from '../motion';
import { useAppTheme } from '../../context/ProductLineContext';
import { useTranslation } from '../../context/LocaleContext';
import type { PlayerActivity } from '../../models/PlayerActivity';
import {
  activityTypeIcon,
  formatActivityScoreSnippet,
  recentActivitiesForTimeline,
} from '../../utils/careerTimeline';
import { spacing, radius } from '../../theme/designTokens';

interface CareerTimelineCardProps {
  activities: PlayerActivity[];
  loading?: boolean;
}

function formatTimelineDate(date: Date): string {
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

/** Chronologie carrière — dernières séances réelles (max 8). */
export const CareerTimelineCard: React.FC<CareerTimelineCardProps> = ({
  activities,
  loading = false,
}) => {
  const { colors } = useAppTheme();
  const { t } = useTranslation();

  const timeline = useMemo(() => recentActivitiesForTimeline(activities), [activities]);

  return (
    <AnimatedEntrance kind="fadeUp">
      <GlassCard variant="default" style={styles.card}>
        <ProDayText variant="section">{t('career.timeline.title')}</ProDayText>
        <ProDayText variant="caption" muted style={styles.sub}>
          {t('career.timeline.subtitle')}
        </ProDayText>

        {loading ? (
          <ProDayText variant="body" muted>
            {t('common.loading')}
          </ProDayText>
        ) : timeline.length === 0 ? (
          <View style={styles.empty}>
            <Icon name="football-outline" size={24} color={colors.textMuted} />
            <ProDayText variant="body" muted style={styles.emptyText}>
              {t('career.timeline.empty')}
            </ProDayText>
          </View>
        ) : (
          <View style={styles.list}>
            {timeline.map((act, index) => {
              const scoreSnippet = formatActivityScoreSnippet(act);
              return (
                <View
                  key={act.id}
                  style={[
                    styles.item,
                    index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
                  ]}
                >
                  <View style={[styles.dot, { backgroundColor: colors.accent, borderColor: colors.accentSoft }]} />
                  <View style={[styles.iconWrap, { backgroundColor: colors.surfaceMuted }]}>
                    <Icon name={activityTypeIcon(act.type)} size={14} color={colors.accent} />
                  </View>
                  <View style={styles.body}>
                    <ProDayText variant="caption" style={styles.dateLine}>
                      {formatTimelineDate(act.date)} · {t(`activity.type.${act.type}`)}
                    </ProDayText>
                    <ProDayText variant="caption" muted>
                      {act.duration_min} min
                      {scoreSnippet ? ` · ${scoreSnippet}` : ''}
                    </ProDayText>
                    {act.analysis_status === 'analyzed' && act.analysis_summary_fr ? (
                      <ProDayText variant="caption" muted numberOfLines={1} style={styles.analysis}>
                        {act.analysis_summary_fr}
                      </ProDayText>
                    ) : null}
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </GlassCard>
    </AnimatedEntrance>
  );
};

const styles = StyleSheet.create({
  card: { padding: spacing.lg, gap: spacing.xs, marginBottom: spacing.md },
  sub: { marginBottom: spacing.sm },
  empty: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.lg },
  emptyText: { textAlign: 'center' },
  list: { gap: 0 },
  item: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
    borderWidth: 2,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1, gap: 2 },
  dateLine: { fontWeight: '700' },
  analysis: { marginTop: 2, fontStyle: 'italic' },
});
