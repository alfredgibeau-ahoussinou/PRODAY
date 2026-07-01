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

const STAFF_EVENT_TYPES = new Set(['training', 'friendly', 'meeting', 'tournament']);

/** Onglet Groupe — convocations staff et logistique déplacement. */
export const ProPlayerGroupScreen: React.FC = () => {
  const profile = useSessionProfile();
  const { colors } = useAppTheme();
  const nav = useTabNavigationActions();
  const { data, refresh } = useDashboardData(profile);
  const [refreshing, setRefreshing] = useState(false);

  const convocations = useMemo(
    () =>
      getUpcomingTeamEvents(data.teamEvents)
        .filter((e) => STAFF_EVENT_TYPES.has(e.event_type))
        .slice(0, 5),
    [data.teamEvents],
  );

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
      <ProDaySurface style={styles.banner}>
        <ProDayText variant="caption" muted>
          Logistique déplacement — pas de gestion compo (réservée au coach staff)
        </ProDayText>
        <PressableSpring
          style={[styles.transport, { borderColor: colors.border }]}
          onPress={() => nav.setActiveTab('covoiturage')}
          haptic
        >
          <Icon name="car" size={16} color={colors.accent} />
          <ProDayText variant="caption">Transport groupe</ProDayText>
        </PressableSpring>
      </ProDaySurface>

      {convocations.length === 0 ? (
        <ProDaySurface style={styles.empty}>
          <ProDayText variant="body" muted>
            Aucune convocation staff à venir.
          </ProDayText>
        </ProDaySurface>
      ) : (
        convocations.map((event) => (
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
    marginBottom: spacing.sm,
  },
  transport: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  empty: {
    padding: spacing.lg,
    marginBottom: spacing.sm,
  },
  card: {
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: spacing.sm,
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
