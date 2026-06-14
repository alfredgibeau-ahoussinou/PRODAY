import React from 'react';
import { View, StyleSheet } from 'react-native';
import { PressableSpring } from '../motion/PressableSpring';
import { prodayHaptics } from '../../utils/prodayHaptics';
import type { TeamEvent } from '../../models/TeamEvent';
import { EVENT_TYPE_LABELS } from '../../models/TeamEvent';
import { formatCalendarDate } from '../../utils/seasonCalendar';
import {
  carpoolEventSummaryForUser,
  totalCarpoolAvailableSeats,
} from '../../utils/carpoolBalance';
import { ProDayGradient } from '../ui/ProDayGradient';
import { ProDayText } from '../ui/ProDayText';
import { Icon } from '../ui/Icon';
import { useAppTheme } from '../../context/ProductLineContext';
import { spacing, radius, shadows } from '../../theme/designTokens';

interface CarpoolEventCardProps {
  event: TeamEvent;
  profileUid: string;
  onPress: () => void;
  onQuickBook?: () => void;
}

export function carpoolStatusLabel(
  event: TeamEvent,
  profileUid: string
): string {
  const summary = carpoolEventSummaryForUser(event, profileUid);
  if (summary.isDriver) return 'Vous proposez un trajet';
  if (summary.myBookingDriverUid) return 'Place réservée';
  if (summary.driverCount > 0) {
    if (summary.availableTotal != null && summary.availableTotal > 0) {
      return `${summary.availableTotal} place(s) dispo`;
    }
    return 'Trajets proposés';
  }
  return 'Aucun trajet — proposez le vôtre';
}

export const CarpoolEventCard: React.FC<CarpoolEventCardProps> = ({
  event,
  profileUid,
  onPress,
  onQuickBook,
}) => {
  const { colors } = useAppTheme();
  const statusLabel = carpoolStatusLabel(event, profileUid);
  const summary = carpoolEventSummaryForUser(event, profileUid);
  const available = totalCarpoolAvailableSeats(event.carpool_slots);
  const needsRide = !summary.isDriver && !summary.myBookingDriverUid;

  return (
    <PressableSpring
      style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }, shadows.soft]}
      onPress={onPress}
      scaleTo={0.96}
      haptic
    >
      <ProDayGradient kind="card" style={styles.accent} />
      <View style={styles.body}>
        <View style={styles.top}>
          <View style={[styles.kindPill, { backgroundColor: colors.accentSoft }]}>
            <ProDayText variant="caption" accent style={styles.kindText}>
              {EVENT_TYPE_LABELS[event.event_type]}
            </ProDayText>
          </View>
          <ProDayText variant="caption" muted>
            {formatCalendarDate(event.starts_at)}
          </ProDayText>
        </View>
        <ProDayText variant="section" numberOfLines={2}>
          {event.title}
        </ProDayText>
        <ProDayText variant="body" muted numberOfLines={1}>
          {event.city}
          {event.location_label ? ` · ${event.location_label}` : ''}
        </ProDayText>
        <View style={styles.metaRow}>
          <View style={[styles.metaPill, { backgroundColor: colors.surfaceMuted }]}>
            <Icon name="car" size={12} color={colors.accent} />
            <ProDayText variant="caption" muted>
              {summary.driverCount} conducteur{summary.driverCount !== 1 ? 's' : ''}
            </ProDayText>
          </View>
          {available != null && available > 0 ? (
            <View style={[styles.metaPill, { backgroundColor: colors.accentSoft }]}>
              <ProDayText variant="caption" accent style={styles.metaBold}>
                {available} place{available !== 1 ? 's' : ''}
              </ProDayText>
            </View>
          ) : null}
        </View>

        <View style={[styles.statusRow, { borderTopColor: colors.border }]}>
          <Icon name="car" size={16} color={colors.accent} variant="filled" />
          <ProDayText variant="caption" style={styles.statusText}>
            {statusLabel}
          </ProDayText>
          {needsRide && onQuickBook && (event.carpool_slots?.length ?? 0) > 0 ? (
            <PressableSpring
              onPress={() => {
                prodayHaptics.confirm();
                onQuickBook();
              }}
              scaleTo={0.96}
              haptic
            >
              <ProDayText variant="caption" accent style={styles.quickBook}>
                Réserver →
              </ProDayText>
            </PressableSpring>
          ) : (
            <Icon name="chevron-forward" size={16} color={colors.textMuted} />
          )}
        </View>
      </View>
    </PressableSpring>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.xl,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  accent: { height: 3, width: '100%' },
  body: { padding: spacing.md },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  kindPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  kindText: { fontWeight: '800', fontSize: 10 },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  metaBold: { fontWeight: '800' },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  statusText: { flex: 1, fontWeight: '700' },
  quickBook: { fontWeight: '800' },
});
