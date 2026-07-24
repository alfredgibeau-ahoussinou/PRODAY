import React from 'react';
import { View, StyleSheet } from 'react-native';
import { PressableSpring } from '../motion/PressableSpring';
import { prodayHaptics } from '../../utils/prodayHaptics';
import type { TeamEvent } from '../../models/TeamEvent';
import { EVENT_TYPE_LABELS } from '../../models/TeamEvent';
import {
  carpoolEventSummaryForUser,
  totalCarpoolAvailableSeats,
} from '../../utils/carpoolBalance';
import { ProDayText } from '../ui/ProDayText';
import { Icon } from '../ui/Icon';
import { useAppTheme } from '../../context/ProductLineContext';
import { useTranslation } from '../../context/LocaleContext';
import type { TranslateFn } from '../../i18n/types';
import { tr } from '../../i18n/translate';
import { spacing, radius, shadows } from '../../theme/designTokens';
import { CarpoolCardAccent } from './carpoolUi';

interface CarpoolEventCardProps {
  event: TeamEvent;
  profileUid: string;
  onPress: () => void;
  onQuickBook?: () => void;
}

export function carpoolStatusLabel(
  event: TeamEvent,
  profileUid: string,
  t?: TranslateFn
): string {
  const summary = carpoolEventSummaryForUser(event, profileUid);
  if (summary.isDriver) return tr(t, 'carpool.event.youOffer', 'You are offering a trip');
  if (summary.myBookingDriverUid) return tr(t, 'carpool.event.booked', 'Seat booked');
  if (summary.driverCount > 0) {
    if (summary.availableTotal != null && summary.availableTotal > 0) {
      return t
        ? t('carpool.event.seats', { n: summary.availableTotal })
        : `${summary.availableTotal} place(s) dispo`;
    }
    return tr(t, 'carpool.event.offers', 'Trips offered');
  }
  return tr(t, 'carpool.event.none', 'No trip. Offer yours');
}

export const CarpoolEventCard: React.FC<CarpoolEventCardProps> = ({
  event,
  profileUid,
  onPress,
  onQuickBook,
}) => {
  const { colors } = useAppTheme();
  const { t } = useTranslation();
  const statusLabel = carpoolStatusLabel(event, profileUid, t);
  const summary = carpoolEventSummaryForUser(event, profileUid);
  const available = totalCarpoolAvailableSeats(event.carpool_slots);
  const needsRide = !summary.isDriver && !summary.myBookingDriverUid;

  return (
    <PressableSpring
      style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }, shadows.soft]}
      onPress={onPress}
      scaleTo={0.98}
      haptic
    >
      <CarpoolCardAccent />
      <View style={styles.body}>
        <View style={styles.top}>
          <View style={[styles.dateBlock, { backgroundColor: colors.accentSoft }]}>
            <ProDayText variant="caption" accent style={styles.dateDay}>
              {event.starts_at.toLocaleDateString('fr-FR', { day: 'numeric' })}
            </ProDayText>
            <ProDayText variant="caption" accent style={styles.dateMonth}>
              {event.starts_at.toLocaleDateString('fr-FR', { month: 'short' })}
            </ProDayText>
          </View>
          <View style={styles.topCopy}>
            <View style={[styles.kindPill, { backgroundColor: colors.surfaceMuted }]}>
              <ProDayText variant="caption" muted style={styles.kindText}>
                {EVENT_TYPE_LABELS[event.event_type]}
              </ProDayText>
            </View>
            <ProDayText variant="section" numberOfLines={2}>
              {event.title}
            </ProDayText>
          </View>
        </View>
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
                {t('carpool.event.book')}
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
    paddingLeft: spacing.sm,
  },
  body: { padding: spacing.md, paddingLeft: spacing.sm },
  top: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  dateBlock: {
    width: 52,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
  },
  dateDay: { fontWeight: '900', fontSize: 18, lineHeight: 20 },
  dateMonth: { fontWeight: '800', fontSize: 11, textTransform: 'capitalize' },
  topCopy: { flex: 1, gap: 4 },
  kindPill: {
    alignSelf: 'flex-start',
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
