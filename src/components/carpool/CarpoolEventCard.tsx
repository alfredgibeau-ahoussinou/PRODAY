import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { PressableSpring } from '../motion/PressableSpring';
import { prodayHaptics } from '../../utils/prodayHaptics';
import type { TeamEvent } from '../../models/TeamEvent';
import { EVENT_TYPE_LABELS } from '../../models/TeamEvent';
import {
  carpoolEventSummaryForUser,
  totalCarpoolAvailableSeats,
} from '../../utils/carpoolBalance';
import { Icon } from '../ui/Icon';
import { useTranslation } from '../../context/LocaleContext';
import type { TranslateFn } from '../../i18n/types';
import { tr } from '../../i18n/translate';
import { spacing } from '../../theme/designTokens';
import { CARPOOL_SITE } from '../../content/carpoolSite';
import {
  type CarpoolUiPalette,
  useCarpoolThemedStyles,
  useCarpoolUi,
} from './CarpoolUiContext';

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
  const { t } = useTranslation();
  const palette = useCarpoolUi();
  const styles = useCarpoolThemedStyles(createStyles);
  const statusLabel = carpoolStatusLabel(event, profileUid, t);
  const summary = carpoolEventSummaryForUser(event, profileUid);
  const available = totalCarpoolAvailableSeats(event.carpool_slots);
  const needsRide = !summary.isDriver && !summary.myBookingDriverUid;

  return (
    <PressableSpring style={styles.card} onPress={onPress} scaleTo={0.98} haptic>
      <View style={styles.dateBlock}>
        <Text style={styles.dateDay}>
          {event.starts_at.toLocaleDateString('fr-FR', { day: 'numeric' })}
        </Text>
        <Text style={styles.dateMonth}>
          {event.starts_at.toLocaleDateString('fr-FR', { month: 'short' })}
        </Text>
      </View>
      <View style={styles.body}>
        <Text style={styles.kind}>{EVENT_TYPE_LABELS[event.event_type]}</Text>
        <Text style={styles.title} numberOfLines={2}>
          {event.title}
        </Text>
        <Text style={styles.place} numberOfLines={1}>
          {event.city}
          {event.location_label ? ` · ${event.location_label}` : ''}
        </Text>
        <View style={styles.metaRow}>
          <View style={styles.meta}>
            <Icon name="car" size={12} color={palette.signal} />
            <Text style={styles.metaText}>
              {summary.driverCount} conducteur{summary.driverCount !== 1 ? 's' : ''}
            </Text>
          </View>
          {available != null && available > 0 ? (
            <Text style={styles.seats}>{available} place{available !== 1 ? 's' : ''}</Text>
          ) : null}
        </View>
        <Text style={styles.status}>{statusLabel}</Text>
        {needsRide && onQuickBook ? (
          <PressableSpring
            onPress={() => {
              prodayHaptics.confirm();
              onQuickBook();
            }}
            scaleTo={0.97}
            haptic
            style={styles.cta}
          >
            <Text style={styles.ctaText}>{t('carpool.event.book')}</Text>
          </PressableSpring>
        ) : null}
      </View>
    </PressableSpring>
  );
};

function createStyles(palette: CarpoolUiPalette) {
  return StyleSheet.create({
    card: {
      flexDirection: 'row',
      marginBottom: spacing.md,
      backgroundColor: palette.surface,
      borderWidth: 1.5,
      borderColor: palette.fog,
      borderRadius: 18,
      overflow: 'hidden',
    },
    dateBlock: {
      width: 58,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: palette.signal,
      paddingVertical: spacing.md,
    },
    dateDay: {
      fontFamily: CARPOOL_SITE.display,
      fontSize: 22,
      fontWeight: '800',
      color: palette.onSignal,
    },
    dateMonth: {
      fontSize: 11,
      fontWeight: '800',
      textTransform: 'uppercase',
      color: palette.onSignal,
    },
    body: { flex: 1, padding: spacing.md, gap: 4 },
    kind: {
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 1,
      textTransform: 'uppercase',
      color: palette.inkDim,
    },
    title: {
      fontFamily: CARPOOL_SITE.display,
      fontSize: 16,
      lineHeight: 20,
      fontWeight: '800',
      color: palette.ink,
    },
    place: { fontSize: 13, color: palette.inkMuted },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginTop: 4,
    },
    meta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    metaText: { fontSize: 12, color: palette.inkMuted, fontWeight: '600' },
    seats: {
      fontSize: 11,
      fontWeight: '900',
      color: palette.onSignal,
      backgroundColor: palette.signal,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 999,
      overflow: 'hidden',
    },
    status: { fontSize: 12, fontWeight: '700', color: palette.signalDeep, marginTop: 2 },
    cta: {
      alignSelf: 'flex-start',
      marginTop: spacing.xs,
      paddingHorizontal: spacing.md,
      paddingVertical: 8,
      borderRadius: 999,
      borderWidth: 1.5,
      borderColor: palette.signal,
      backgroundColor: palette.signalSoft,
    },
    ctaText: { fontWeight: '800', fontSize: 12, color: palette.signalDeep },
  });
}
