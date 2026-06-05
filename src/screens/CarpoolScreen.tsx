import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTeamEvents } from '../hooks/useAppData';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { Icon } from '../components/ui/Icon';
import { TAB_BAR_CONTENT_INSET } from '../components/navigation/BottomTabBar';
import { TeamEventDetailScreen } from './TeamEventDetailScreen';
import { EVENT_TYPE_LABELS } from '../models/TeamEvent';
import { carpoolEventSummaryForUser } from '../utils/carpoolBalance';
import { formatCalendarDate } from '../utils/seasonCalendar';
import { useAppTheme } from '../context/ProductLineContext';
import { spacing, radius, shadows } from '../theme/designTokens';

export const CarpoolScreen: React.FC = () => {
  const { profile } = useAuth();
  const { colors } = useAppTheme();
  const clubId = profile?.profile.club_id;
  const { events, loading, refresh } = useTeamEvents(profile?.uid, clubId);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const upcoming = useMemo(() => {
    const now = Date.now() - 6 * 60 * 60 * 1000;
    return events
      .filter((e) => e.starts_at.getTime() >= now)
      .sort((a, b) => a.starts_at.getTime() - b.starts_at.getTime());
  }, [events]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  if (selectedEventId && profile) {
    return (
      <TeamEventDetailScreen
        eventId={selectedEventId}
        onBack={() => {
          setSelectedEventId(null);
          void refresh();
        }}
      />
    );
  }

  const subtitle =
    profile?.role === 'player'
      ? 'Proposez un trajet ou réservez une place pour vos matchs et entraînements.'
      : 'Organisez les trajets de votre groupe — propositions spontanées ou assignation.';

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} />
      }
    >
      <ScreenHeader
        label="Déplacements"
        title="Covoiturage"
        subtitle={subtitle}
        showBrandLogo
      />

      <View style={[styles.hintCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Icon name="car" size={22} color={colors.ink} variant="filled" />
        <Text style={[styles.hintText, { color: colors.textSecondary }]}>
          Comme BlaBlaCar entre coéquipiers : proposez votre véhicule ou montez chez un autre.
        </Text>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.ink} style={styles.loader} />
      ) : upcoming.length === 0 ? (
        <View style={[styles.emptyCard, { backgroundColor: colors.surfaceMuted }]}>
          <Icon name="calendar" size={28} color={colors.textMuted} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>Aucun événement à venir</Text>
          <Text style={[styles.emptySub, { color: colors.textMuted }]}>
            Vos convocations (matchs, entraînements, détections) apparaîtront ici pour organiser
            les trajets.
          </Text>
        </View>
      ) : (
        upcoming.map((event) => {
          const summary = profile
            ? carpoolEventSummaryForUser(event, profile.uid)
            : {
                driverCount: (event.carpool_slots ?? []).length,
                seatTotal: 0,
                availableTotal: null,
                isDriver: false,
                myBookingDriverUid: null,
              };

          const statusLabel = summary.isDriver
            ? 'Vous proposez un trajet'
            : summary.myBookingDriverUid
              ? 'Place réservée'
              : summary.driverCount > 0
                ? summary.availableTotal != null && summary.availableTotal > 0
                  ? `${summary.availableTotal} place(s) dispo`
                  : 'Trajets proposés'
                : 'Aucun trajet — proposez le vôtre';

          return (
            <TouchableOpacity
              key={event.id}
              style={[
                styles.eventCard,
                shadows.soft,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
              onPress={() => setSelectedEventId(event.id)}
              activeOpacity={0.85}
            >
              <View style={styles.eventTop}>
                <View style={[styles.typePill, { backgroundColor: colors.accentSoft }]}>
                  <Text style={[styles.typePillText, { color: colors.ink }]}>
                    {EVENT_TYPE_LABELS[event.event_type]}
                  </Text>
                </View>
                <Text style={[styles.eventDate, { color: colors.textMuted }]}>
                  {formatCalendarDate(event.starts_at)}
                </Text>
              </View>

              <Text style={[styles.eventTitle, { color: colors.text }]}>{event.title}</Text>
              <Text style={[styles.eventMeta, { color: colors.textSecondary }]}>
                {event.city}
                {event.location_label ? ` · ${event.location_label}` : ''}
              </Text>

              <View style={[styles.statusRow, { borderTopColor: colors.border }]}>
                <Icon name="car" size={16} color={colors.accent} />
                <Text style={[styles.statusText, { color: colors.text }]}>{statusLabel}</Text>
                <Icon name="chevron-forward" size={16} color={colors.textMuted} />
              </View>
            </TouchableOpacity>
          );
        })
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: {
    paddingBottom: TAB_BAR_CONTENT_INSET + spacing.xl,
  },
  hintCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  hintText: { flex: 1, fontSize: 13, lineHeight: 19 },
  loader: { marginTop: spacing.xxl },
  emptyCard: {
    marginHorizontal: spacing.lg,
    padding: spacing.xl,
    borderRadius: radius.lg,
    alignItems: 'center',
    gap: spacing.sm,
  },
  emptyTitle: { fontSize: 16, fontWeight: '800' },
  emptySub: { fontSize: 13, lineHeight: 19, textAlign: 'center' },
  eventCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  eventTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  typePill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  typePillText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  eventDate: { fontSize: 12, fontWeight: '600' },
  eventTitle: { fontSize: 16, fontWeight: '900', marginBottom: 4 },
  eventMeta: { fontSize: 13 },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  statusText: { flex: 1, fontSize: 13, fontWeight: '700' },
});
