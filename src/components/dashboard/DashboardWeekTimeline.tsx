import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { PressableSpring, StaggerReveal } from '../motion';
import type { SeasonCalendarItem } from '../../utils/seasonCalendar';
import { formatCalendarDate } from '../../utils/seasonCalendar';
import { ProDaySurface } from '../ui/ProDaySurface';
import { ProDayText } from '../ui/ProDayText';
import { Icon, type IconName } from '../ui/Icon';
import { useAppTheme } from '../../context/ProductLineContext';
import { spacing, radius } from '../../theme/designTokens';

interface DashboardWeekTimelineProps {
  items: SeasonCalendarItem[];
  pendingConvocations: number;
  onItemPress: (item: SeasonCalendarItem) => void;
  onConvocationsPress: () => void;
  onCarpoolPress?: () => void;
}

function kindIcon(item: SeasonCalendarItem): IconName {
  if (item.kind === 'friendly_match') return 'football';
  return 'calendar';
}

/** Timeline verticale — cette semaine sur l’accueil. */
export const DashboardWeekTimeline: React.FC<DashboardWeekTimelineProps> = ({
  items,
  pendingConvocations,
  onItemPress,
  onConvocationsPress,
  onCarpoolPress,
}) => {
  const { colors } = useAppTheme();

  const weekItems = useMemo(() => {
    const now = new Date();
    const end = new Date(now);
    end.setDate(end.getDate() + 7);
    return items
      .filter((i) => i.starts_at >= now && i.starts_at <= end)
      .slice(0, 6);
  }, [items]);

  return (
    <ProDaySurface variant="module" style={[styles.wrap, { borderColor: colors.border }]}>
      <View style={styles.head}>
        <ProDayText variant="eyebrow" accent>
          Cette semaine
        </ProDayText>
        {pendingConvocations > 0 ? (
          <PressableSpring
            onPress={onConvocationsPress}
            style={[styles.badge, { backgroundColor: colors.accent }]}
            scaleTo={0.96}
            haptic
          >
            <ProDayText variant="caption" inverse style={styles.badgeText}>
              {pendingConvocations} convoc{pendingConvocations > 1 ? 's' : ''}
            </ProDayText>
          </PressableSpring>
        ) : null}
      </View>

      {weekItems.length === 0 ? (
        <ProDayText variant="body" muted style={styles.empty}>
          Aucun événement prévu sur les 7 prochains jours.
        </ProDayText>
      ) : (
        weekItems.map((item, index) => (
          <StaggerReveal key={item.id} index={index}>
            <PressableSpring
              style={[
                styles.row,
                index > 0 && { borderTopWidth: 1, borderTopColor: colors.border },
              ]}
              onPress={() => onItemPress(item)}
              scaleTo={0.99}
              haptic
            >
              <View style={[styles.dotCol, { backgroundColor: colors.accentSoft }]}>
                <Icon name={kindIcon(item)} size={16} color={colors.accent} variant="filled" />
              </View>
              <View style={styles.copy}>
                <ProDayText variant="caption" muted>
                  {formatCalendarDate(item.starts_at)}
                </ProDayText>
                <ProDayText variant="section" numberOfLines={1}>
                  {item.title}
                </ProDayText>
                <ProDayText variant="caption" muted numberOfLines={1}>
                  {item.subtitle || item.city}
                </ProDayText>
              </View>
              <Icon name="chevron-forward" size={16} color={colors.textMuted} />
            </PressableSpring>
          </StaggerReveal>
        ))
      )}

      {onCarpoolPress ? (
        <PressableSpring
          style={[styles.carpoolCta, { borderColor: colors.border, backgroundColor: colors.surfaceMuted }]}
          onPress={onCarpoolPress}
          scaleTo={0.98}
          haptic
        >
          <Icon name="car" size={16} color={colors.accent} />
          <ProDayText variant="caption" accent style={styles.carpoolText}>
            Organiser / réserver un trajet
          </ProDayText>
        </PressableSpring>
      ) : null}
    </ProDaySurface>
  );
};

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.lg, padding: spacing.md },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  badgeText: { fontWeight: '800', fontSize: 10 },
  empty: { textAlign: 'center', paddingVertical: spacing.md },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  dotCol: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: { flex: 1, gap: 2 },
  carpoolCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  carpoolText: { fontWeight: '800' },
});
