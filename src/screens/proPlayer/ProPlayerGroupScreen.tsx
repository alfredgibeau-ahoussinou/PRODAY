import React, { useCallback, useMemo, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useSessionProfile } from '../../hooks/useSessionProfile';
import { useDashboardData } from '../../hooks/useDashboardData';
import { useTabNavigationActions } from '../../hooks/useTabNavigationActions';
import { ProPlayerShell } from './proPlayerShell';
import { ProDaySurface } from '../../components/ui/ProDaySurface';
import { ProDayText } from '../../components/ui/ProDayText';
import { PressableSpring } from '../../components/motion';
import { Icon } from '../../components/ui/Icon';
import { useAppTheme } from '../../context/ProductLineContext';
import { spacing, radius } from '../../theme/designTokens';
import { getUpcomingTeamEvents } from '../../utils/amateurPlayerHome';
import { EVENT_TYPE_LABELS } from '../../models/TeamEvent';
import { formatCalendarDate } from '../../utils/seasonCalendar';
import {
  ConvocationsMiniCalendar,
  buildConvocationMarks,
  isSameCalendarDay,
} from '../../components/proPlayer/ConvocationsMiniCalendar';

const STAFF_EVENT_TYPES = new Set(['training', 'friendly', 'meeting', 'tournament']);

/** Onglet Groupe — convocations staff et logistique déplacement. */
export const ProPlayerGroupScreen: React.FC = () => {
  const profile = useSessionProfile();
  const { colors } = useAppTheme();
  const nav = useTabNavigationActions();
  const { data, refresh } = useDashboardData(profile);
  const [refreshing, setRefreshing] = useState(false);
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const staffEvents = useMemo(
    () =>
      [...data.teamEvents]
        .filter((e) => STAFF_EVENT_TYPES.has(e.event_type))
        .sort((a, b) => a.starts_at.getTime() - b.starts_at.getTime()),
    [data.teamEvents],
  );

  const marks = useMemo(() => buildConvocationMarks(staffEvents), [staffEvents]);

  const upcoming = useMemo(
    () => getUpcomingTeamEvents(staffEvents),
    [staffEvents],
  );

  const displayed = useMemo(() => {
    if (!selectedDay) return upcoming;
    return staffEvents.filter((e) => isSameCalendarDay(e.starts_at, selectedDay));
  }, [selectedDay, upcoming, staffEvents]);

  const listTitle = selectedDay
    ? selectedDay.toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      })
    : 'Prochaines convocations';

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refresh();
    } finally {
      setRefreshing(false);
    }
  }, [refresh]);

  if (!profile) return null;

  return (
    <ProPlayerShell
      caption="Groupe"
      title="Convocations staff"
      subtitle="Entraînements, matchs officiels et transport groupe"
      profile={profile}
      refreshing={refreshing}
      onRefresh={handleRefresh}
    >
      <ConvocationsMiniCalendar
        month={month}
        onMonthChange={setMonth}
        marks={marks}
        selectedDate={selectedDay}
        onSelectDate={setSelectedDay}
      />

      <ProDaySurface style={styles.banner}>
        <ProDayText variant="caption" muted>
          Logistique déplacement — consultez le détail de chaque convocation pour le transport
          groupe.
        </ProDayText>
      </ProDaySurface>

      <ProDayText variant="eyebrow" accent style={styles.listTitle}>
        {listTitle}
      </ProDayText>

      {displayed.length === 0 ? (
        <ProDaySurface style={styles.empty}>
          <ProDayText variant="body" muted>
            {selectedDay
              ? 'Aucune convocation ce jour-là.'
              : 'Aucune convocation staff à venir.'}
          </ProDayText>
        </ProDaySurface>
      ) : (
        displayed.map((event) => (
          <PressableSpring
            key={event.id}
            style={[styles.card, { borderColor: colors.border, backgroundColor: colors.surface }]}
            onPress={() => nav.openTeamEvent(event.id)}
            scaleTo={0.98}
            haptic
          >
            <ProDayText variant="body" style={styles.cardTitle}>
              {event.title}
            </ProDayText>
            <ProDayText variant="caption" muted>
              {EVENT_TYPE_LABELS[event.event_type]} · {formatCalendarDate(event.starts_at)}
            </ProDayText>
            <ProDayText variant="caption" muted>
              {event.city}
              {event.location_label ? ` · ${event.location_label}` : ''}
            </ProDayText>
          </PressableSpring>
        ))
      )}

      <PressableSpring
        style={[styles.calendarLink, { borderColor: colors.border }]}
        onPress={() => nav.openMatchs({ homeTab: 'convocations' })}
        haptic
      >
        <Icon name="calendar" size={16} color={colors.accent} />
        <ProDayText variant="caption" accent>
          Voir le calendrier complet
        </ProDayText>
      </PressableSpring>
    </ProPlayerShell>
  );
};

const styles = StyleSheet.create({
  banner: {
    padding: spacing.md,
    gap: spacing.xs,
  },
  listTitle: {
    marginTop: spacing.xs,
    textTransform: 'capitalize',
  },
  empty: {
    padding: spacing.lg,
  },
  card: {
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 2,
  },
  cardTitle: { fontWeight: '700' },
  calendarLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    marginTop: spacing.xs,
  },
});
