import React, { useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { PressableSpring } from '../motion/PressableSpring';
import { prodayHaptics } from '../../utils/prodayHaptics';
import type { TeamEvent } from '../../models/TeamEvent';
import type { CarpoolSlot } from '../../models/TeamEvent';
import type { User } from '../../models/User';
import {
  carpoolAvailableSeats,
  findCarpoolBooking,
  isCarpoolPassenger,
} from '../../utils/carpoolBalance';
import { formatCalendarDate } from '../../utils/seasonCalendar';
import { teamEventsService } from '../../services/teamEvents.service';
import { CarpoolLocationCapture } from './CarpoolLocationCapture';
import { openMapsAt } from '../../utils/geoLocation';
import { pickupDistanceFromMeeting } from '../../utils/carpoolGeo';
import { formatDistanceKm } from '../../utils/geoLocation';
import { ProDayGradient } from '../ui/ProDayGradient';
import { ProDayText } from '../ui/ProDayText';
import { Icon } from '../ui/Icon';
import { useAppTheme } from '../../context/ProductLineContext';
import { useTranslation } from '../../context/LocaleContext';
import { useTabNavigationOptional } from '../../context/TabNavigationContext';
import { spacing, radius, shadows } from '../../theme/designTokens';
import { CarpoolCardAccent } from './carpoolUi';
import {
  type CarpoolUiPalette,
  useCarpoolThemedStyles,
  useCarpoolUi,
} from './CarpoolUiContext';
import { CarpoolTripTicket } from './CarpoolTripTicket';
import { openCarpoolDriverChat } from '../../utils/openCarpoolDriverChat';
import { CarpoolLiveTripPanel } from './CarpoolLiveTripPanel';
import {
  eventTripId,
  slotTripStatus,
} from '../../utils/carpoolLiveTrip';
import { isPassengerConfirmed } from '../../utils/standaloneCarpool';

interface CarpoolRideCardProps {
  event: TeamEvent;
  slot: CarpoolSlot;
  profile: User;
  onUpdated: () => void;
  onOpenDetail: () => void;
  iaScore?: number;
  distanceKm?: number | null;
  etaLabel?: string | null;
  /** Layout allégé hub Passager. */
  compact?: boolean;
}

export const CarpoolRideCard: React.FC<CarpoolRideCardProps> = ({
  event,
  slot,
  profile,
  onUpdated,
  onOpenDetail,
  iaScore,
  distanceKm,
  etaLabel,
  compact = false,
}) => {
  const { colors } = useAppTheme();
  const palette = useCarpoolUi();
  const styles = useCarpoolThemedStyles(createTicketStyles);
  const { t } = useTranslation();
  const tabNav = useTabNavigationOptional();
  const [busy, setBusy] = useState(false);
  const [contactBusy, setContactBusy] = useState(false);
  const [pickupPlace, setPickupPlace] = useState('');
  const [pickupLocation, setPickupLocation] = useState<
    import('../../models/User').GeoPoint | undefined
  >();
  const available = carpoolAvailableSeats(slot);
  const bookedHere = isCarpoolPassenger(slot, profile.uid);
  const myBooking = findCarpoolBooking(event, profile.uid);
  const isMine = slot.driver_uid === profile.uid;
  const destination = [event.location_label, event.city].filter(Boolean).join(' · ');

  const canBook =
    !isMine &&
    !myBooking &&
    (available === null || available > 0);

  const handleContactDriver = async () => {
    if (!tabNav) return;
    setContactBusy(true);
    try {
      await openCarpoolDriverChat(
        profile,
        slot.driver_uid,
        slot.driver_name,
        tabNav.openChat,
      );
    } finally {
      setContactBusy(false);
    }
  };

  const handleBook = async (forceDirect = false) => {
    const effectivePlace = pickupPlace.trim() || profile.city || (forceDirect ? 'Point de RDV par défaut' : '');
    const effectiveLocation = pickupLocation ?? profile.location;

    if (!forceDirect && !pickupPlace.trim() && !pickupLocation && !profile.city && !profile.location) {
      Alert.alert(t('carpool.standalone.form.pickupRequired'), t('carpool.ride.pickupRequired'));
      return;
    }
    setBusy(true);
    try {
      await teamEventsService.requestCarpoolSeat(
        event.id,
        slot.driver_uid,
        profile.uid,
        profile.display_name,
        {
          pickup_place: effectivePlace || undefined,
          pickup_location: effectiveLocation,
        }
      );
      onUpdated();
      Alert.alert(t('carpool.ride.booked'), t('carpool.ride.bookedBody', { name: slot.driver_name }));
    } catch (e) {
      Alert.alert(t('common.error'), e instanceof Error ? e.message : t('carpool.ride.bookFailed'));
    } finally {
      setBusy(false);
    }
  };


  const handleCancel = async () => {
    setBusy(true);
    try {
      await teamEventsService.cancelCarpoolSeat(event.id, slot.driver_uid, profile.uid);
      onUpdated();
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Annulation impossible.');
    } finally {
      setBusy(false);
    }
  };

  const fromLabel = slot.meeting_place?.trim() || t('carpool.ride.meetingTbd');
  const toLabel = destination || event.city || event.title;
  const seatsLabel =
    available != null ? `${available} place${available !== 1 ? 's' : ''}` : undefined;
  const metaRight = [
    distanceKm != null ? formatDistanceKm(distanceKm) : null,
    etaLabel,
  ]
    .filter(Boolean)
    .join(' · ');

  const ticketActions = (
    <View style={styles.ticketActions}>
      {!isMine && tabNav ? (
        <PressableSpring
          style={styles.ticketGhost}
          onPress={() => void handleContactDriver()}
          disabled={contactBusy}
          scaleTo={0.97}
        >
          {contactBusy ? (
            <ActivityIndicator color={palette.signal} size="small" />
          ) : (
            <>
              <Icon name="chat" size={14} color={palette.signal} />
              <ProDayText variant="caption" style={styles.ticketGhostText}>
                {t('carpool.ride.contactDriver')}
              </ProDayText>
            </>
          )}
        </PressableSpring>
      ) : null}
      {bookedHere ? (
        <PressableSpring
          style={styles.ticketGhost}
          onPress={() => void handleCancel()}
          disabled={busy}
          scaleTo={0.97}
        >
          {busy ? (
            <ActivityIndicator color={palette.signal} size="small" />
          ) : (
            <ProDayText variant="caption" style={styles.ticketGhostText}>
              Annuler ma place
            </ProDayText>
          )}
        </PressableSpring>
      ) : canBook ? (
        <>
          <CarpoolLocationCapture
            label={t('carpool.standalone.pickupPoint')}
            place={pickupPlace}
            location={pickupLocation}
            onPlaceChange={setPickupPlace}
            onLocationChange={setPickupLocation}
            disabled={busy}
            compact
          />
          <View style={styles.bookButtonsRow}>
            <PressableSpring
              onPress={() => {
                prodayHaptics.confirm();
                void handleBook(true);
              }}
              disabled={busy}
              scaleTo={0.96}
              haptic={!busy}
              style={[styles.ticketCta, styles.ticketDirectCta]}
            >
              {busy ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <View style={styles.directBtnContent}>
                  <Icon name="star-four-points" size={14} color={palette.onSignal} />
                  <ProDayText variant="caption" style={styles.ticketCtaText}>
                    Réserver en 1 tap
                  </ProDayText>
                </View>
              )}
            </PressableSpring>
            <PressableSpring
              onPress={() => {
                prodayHaptics.confirm();
                void handleBook(false);
              }}
              disabled={busy}
              scaleTo={0.96}
              haptic={!busy}
              style={[styles.ticketGhost, { flex: 1 }]}
            >
              <ProDayText variant="caption" style={styles.ticketGhostText}>
                Confirmer avec GPS
              </ProDayText>
            </PressableSpring>
          </View>
        </>
      ) : isMine ? (
        <ProDayText variant="caption" style={styles.ticketGhostText}>
          Votre trajet
        </ProDayText>
      ) : null}

    </View>
  );

  
  const fullFooter = (
    <View style={styles.ticketActions}>
      {ticketActions}
      
      {!compact && (
        <View style={{ marginTop: spacing.md, gap: spacing.sm }}>
          {slot.meeting_location && (
            <PressableSpring
              onPress={() => openMapsAt(slot.meeting_location!, slot.meeting_place)}
              scaleTo={0.98}
            >
              <ProDayText variant="caption" accent style={cardStyles.mapLink}>
                Voir le RDV ({slot.meeting_place?.trim() || 'GPS'}) sur Maps
              </ProDayText>
            </PressableSpring>
          )}

          {(slot.passengers?.length ?? 0) > 0 && (
            <View style={cardStyles.passengers}>
              <ProDayText variant="caption" muted>
                Passagers : {(slot.passengers ?? []).map((p) => p.name).join(', ')}
              </ProDayText>
            </View>
          )}

          {!isMine && tabNav && (
            <PressableSpring
              style={styles.ticketGhost}
              onPress={() => void handleContactDriver()}
              disabled={contactBusy}
            >
              {contactBusy ? <ActivityIndicator color={palette.signal} size="small" /> : (
                <>
                  <Icon name="chat" size={14} color={palette.signal} />
                  <ProDayText variant="caption" style={styles.ticketGhostText}>
                    {t('carpool.ride.contactDriver')}
                  </ProDayText>
                </>
              )}
            </PressableSpring>
          )}

          {canBook && !compact && (
             <CarpoolLocationCapture
               label={t('carpool.standalone.pickupPoint')}
               place={pickupPlace}
               location={pickupLocation}
               onPlaceChange={setPickupPlace}
               onLocationChange={setPickupLocation}
               disabled={busy}
               compact
             />
          )}
        </View>
      )}
    </View>
  );

  return (
    <CarpoolTripTicket
      meta={`${formatCalendarDate(event.starts_at)} · ${event.title}`}
      metaRight={metaRight || null}
      from={fromLabel}
      to={toLabel}
      driver={slot.driver_name}
      seatsLabel={seatsLabel}
      timeLabel={slot.meeting_time ? `Départ ${slot.meeting_time}` : null}
      onPress={onOpenDetail}
      footer={fullFooter}
    />
  );
}

const cardStyles = StyleSheet.create({
  card: {},
  body: {},
  driverRow: {},
  avatar: {},
  driverCopy: {},
  seatsPill: {},
  seatsText: {},
  scorePill: {},
  etaRow: {},
  etaText: {},
  route: {},
  routeText: {},
  mapLink: { fontWeight: '700', marginTop: 2 },
  passengers: { gap: 2 },
  time: {},
  notes: {},
  actions: { marginTop: spacing.sm },
  primaryBtn: {},
  ghostBtn: {},
  btnText: {},
});

function createTicketStyles(palette: CarpoolUiPalette) {
  return StyleSheet.create({
    ticketActions: { gap: spacing.sm },
    ticketGhost: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      alignSelf: 'flex-start',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderWidth: 1.5,
      borderColor: palette.fog,
      borderRadius: 999,
      backgroundColor: palette.surfaceMuted,
    },
    ticketGhostText: { fontWeight: '800', color: palette.ink },
    ticketCta: {
      alignSelf: 'stretch',
      alignItems: 'center',
      paddingVertical: 14,
      borderRadius: 999,
      backgroundColor: palette.signal,
    },
    ticketCtaText: { fontWeight: '800', color: palette.onSignal },
    bookButtonsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    ticketDirectCta: {
      flex: 1.2,
      paddingVertical: 12,
    },
    directBtnContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
    },
  });
}
