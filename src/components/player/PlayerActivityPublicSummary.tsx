import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import type { PlayerActivity } from '../../models/PlayerActivity';
import { GlassCard } from '../aurora/GlassCard';
import { ProDayText } from '../ui/ProDayText';
import { useAppTheme } from '../../context/ProductLineContext';
import { useTranslation } from '../../context/LocaleContext';
import { aggregatePerformanceTags, PERFORMANCE_TAGS } from '../../utils/performanceTags';
import { spacing, radius } from '../../theme/designTokens';

interface PlayerActivityPublicSummaryProps {
  activities: PlayerActivity[];
  loading?: boolean;
  maxItems?: number;
}

/** Résumé activités récentes — vue staff recruteur (lecture seule). */
export const PlayerActivityPublicSummary: React.FC<PlayerActivityPublicSummaryProps> = ({
  activities,
  loading = false,
  maxItems = 5,
}) => {
  const { colors } = useAppTheme();
  const { t } = useTranslation();

  const tagCounts = useMemo(() => aggregatePerformanceTags(activities), [activities]);
  const hasTags = PERFORMANCE_TAGS.some((tag) => tagCounts[tag] > 0);

  const formatDate = (d: Date) =>
    d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });

  return (
    <GlassCard variant="default" style={styles.card}>
      <ProDayText variant="section">{t('activity.summary.title')}</ProDayText>
      <ProDayText variant="caption" muted style={styles.sub}>
        {t('activity.summary.subtitle')}
      </ProDayText>

      {loading ? (
        <ProDayText variant="body" muted>
          {t('common.loading')}
        </ProDayText>
      ) : activities.length === 0 ? (
        <ProDayText variant="body" muted>
          {t('activity.summary.empty')}
        </ProDayText>
      ) : (
        activities.slice(0, maxItems).map((act) => (
          <View
            key={act.id}
            style={[styles.row, { borderBottomColor: colors.border }]}
          >
            <View style={[styles.typeBadge, { backgroundColor: colors.surfaceMuted }]}>
              <ProDayText variant="caption" accent style={styles.typeText}>
                {t(`activity.type.${act.type}`)}
              </ProDayText>
            </View>
            <View style={styles.rowCopy}>
              <ProDayText variant="caption" style={styles.rowTitle}>
                {formatDate(act.date)} · {act.duration_min} min
                {act.source === 'team_event' ? ` · ${t('activity.summary.teamEvent')}` : ''}
              </ProDayText>
              {act.notes ? (
                <ProDayText variant="caption" muted numberOfLines={1}>
                  {act.notes}
                </ProDayText>
              ) : null}
            </View>
          </View>
        ))
      )}

      {hasTags ? (
        <View style={styles.tagsBlock}>
          <ProDayText variant="caption" muted style={styles.tagsLabel}>
            {t('activity.performance.title')}
          </ProDayText>
          <View style={styles.tagsRow}>
            {PERFORMANCE_TAGS.filter((tag) => tagCounts[tag] > 0).map((tag) => (
              <View
                key={tag}
                style={[styles.tagChip, { backgroundColor: colors.accentSoft, borderColor: colors.accentMuted }]}
              >
                <ProDayText variant="caption" accent>
                  {t(`activity.performance.${tag}`)} · {tagCounts[tag]}
                </ProDayText>
              </View>
            ))}
          </View>
        </View>
      ) : null}
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  card: { padding: spacing.lg, gap: spacing.sm, marginBottom: spacing.md },
  sub: { marginBottom: spacing.xs },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  typeBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
  typeText: { fontWeight: '700', fontSize: 10 },
  rowCopy: { flex: 1, gap: 2 },
  rowTitle: { fontWeight: '700' },
  tagsBlock: { marginTop: spacing.sm, gap: spacing.xs },
  tagsLabel: { fontWeight: '700' },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  tagChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
});
