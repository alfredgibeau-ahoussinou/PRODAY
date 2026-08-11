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
import { CARPOOL_SITE } from '../../content/carpoolSite';
import { CarpoolCardAccent } from './carpoolUi';
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

  const handleBook = async () => {
    if (!pickupPlace.trim() && !pickupLocation) {
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
          pickup_place: pickupPlace.trim() || undefined,
          pickup_location: pickupLocation,
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
            <ActivityIndicator color={CARPOOL_SITE.signal} size="small" />
          ) : (
            <>
              <Icon name="chat" size={14} color={CARPOOL_SITE.signal} />
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
            <ActivityIndicator color={CARPOOL_SITE.signal} size="small" />
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
          <PressableSpring
            onPress={() => {
              prodayHaptics.confirm();
              void handleBook();
            }}
            disabled={busy}
            scaleTo={0.96}
            haptic={!busy}
            style={styles.ticketCta}
          >
            {busy ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <ProDayText variant="caption" style={styles.ticketCtaText}>
                Réserver une place
              </ProDayText>
            )}
          </PressableSpring>
        </>
      ) : isMine ? (
        <ProDayText variant="caption" style={styles.ticketGhostText}>
          Votre trajet
        </ProDayText>
      ) : null}
    </View>
  );

  if (compact) {
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
        footer={ticketActions}
      />
    );
  }

  return (
    <PressableSpring
      style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }, shadows.soft]}
      onPress={onOpenDetail}
      scaleTo={0.98}
      haptic
    >
      <CarpoolCardAccent kind="cta" />
      <View style={styles.body}>
        <ProDayText variant="caption" muted>
          {formatCalendarDate(event.starts_at)} · {event.title}
        </ProDayText>

        <View style={styles.driverRow}>
          <View style={[styles.avatar, { backgroundColor: colors.accentSoft }]}>
            <Icon name="person" size={18} color={colors.accent} />
          </View>
          <View style={styles.driverCopy}>
            <ProDayText variant="section">{slot.driver_name}</ProDayText>
            <ProDayText variant="caption" muted>
              {slot.volunteered ? t('carpool.ride.volunteer') : t('carpool.ride.assigned')}
              {slot.vehicle_type
                ? ` · ${t(`carpool.vehicle.${slot.vehicle_type}`)}`
                : ''}
            </ProDayText>
          </View>
          {available != null ? (
            <View style={[styles.seatsPill, { backgroundColor: colors.accentSoft }]}>
              <ProDayText variant="caption" accent style={styles.seatsText}>
                {available} place{available !== 1 ? 's' : ''}
              </ProDayText>
            </View>
          ) : (
            <ProDayText variant="caption" muted>
              Places ?
            </ProDayText>
          )}
        </View>

        {(distanceKm != null || etaLabel || iaScore != null) ? (
          <ProDayText variant="caption" muted style={styles.etaText}>
            {[
              distanceKm != null ? formatDistanceKm(distanceKm) : null,
              etaLabel,
              iaScore != null ? `IA ${iaScore}%` : null,
            ]
              .filter(Boolean)
              .join(' · ')}
          </ProDayText>
        ) : null}

        <View style={styles.route}>
          <Icon name="location" size={14} color={colors.textMuted} />
          <ProDayText variant="body" muted numberOfLines={compact ? 1 : 2} style={styles.routeText}>
            {slot.meeting_place?.trim() || t('carpool.ride.meetingTbd')} → {destination || event.city}
          </ProDayText>
        </View>
        {!compact && slot.meeting_location ? (
          <PressableSpring
            onPress={() => openMapsAt(slot.meeting_location!, slot.meeting_place)}
            scaleTo={0.98}
          >
            <ProDayText variant="caption" accent style={styles.mapLink}>
              RDV conducteur sur la carte
            </ProDayText>
          </PressableSpring>
        ) : null}

        {slot.meeting_time ? (
          <ProDayText variant="caption" accent style={styles.time}>
            Départ {slot.meeting_time}
          </ProDayText>
        ) : null}

        {!compact && slot.notes ? (
          <ProDayText variant="caption" muted numberOfLines={2} style={styles.notes}>
            {slot.notes}
          </ProDayText>
        ) : null}

        {!compact && (slot.passengers?.length ?? 0) > 0 ? (
          <View style={styles.passengers}>
            <ProDayText variant="caption" muted>
              Passagers : {(slot.passengers ?? []).map((p) => p.name).join(', ')}
            </ProDayText>
            {(slot.passengers ?? []).map((p) => {
              if (!p.pickup_place && !p.pickup_location) return null;
              const dist = pickupDistanceFromMeeting(slot, p);
              return (
                <ProDayText key={p.uid} variant="caption" muted>
                  {p.name}. {p.pickup_place?.trim() || 'GPS'}
                  {dist ? ` (${dist} du RDV)` : ''}
                </ProDayText>
              );
            })}
          </View>
        ) : null}

        <View style={styles.actions}>
          {!isMine && tabNav ? (
            <PressableSpring
              style={[
                styles.ghostBtn,
                { borderColor: colors.borderStrong, backgroundColor: colors.surfaceMuted },
              ]}
              onPress={() => void handleContactDriver()}
              disabled={contactBusy}
              scaleTo={0.97}
            >
              {contactBusy ? (
                <ActivityIndicator color={colors.accent} size="small" />
              ) : (
                <>
                  <Icon name="chat" size={14} color={colors.accent} />
                  <ProDayText variant="caption" accent style={styles.btnText}>
                    {t('carpool.ride.contactDriver')}
                  </ProDayText>
                </>
              )}
            </PressableSpring>
          ) : null}
          {bookedHere ? (
            <PressableSpring
              style={[
                styles.ghostBtn,
                { borderColor: colors.borderStrong, backgroundColor: colors.surfaceMuted },
              ]}
              onPress={() => void handleCancel()}
              disabled={busy}
              scaleTo={0.97}
            >
              {busy ? (
                <ActivityIndicator color={colors.accent} size="small" />
              ) : (
                <ProDayText variant="caption" accent style={styles.btnText}>
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
            <PressableSpring
              onPress={() => {
                prodayHaptics.confirm();
                void handleBook();
              }}
              disabled={busy}
              scaleTo={0.96}
              haptic={!busy}
            >
              <ProDayGradient kind="cta" style={styles.primaryBtn}>
                {busy ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <Icon name="checkmark-circle" size={14} color="#FFFFFF" />
                    <ProDayText variant="caption" inverse style={styles.btnText}>
                      Réserver une place
                    </ProDayText>
                  </>
                )}
              </ProDayGradient>
            </PressableSpring>
            </>
          ) : isMine ? (
            <ProDayText variant="caption" accent>
              Votre trajet
            </ProDayText>
          ) : null}
        </View>

        {!compact &&
        (isMine ||
          (slot.passengers ?? []).some(
            (p) => p.uid === profile.uid && isPassengerConfirmed(p),
          )) ? (
          <CarpoolLiveTripPanel
            tripId={eventTripId(event.id, slot.driver_uid)}
            viewerUid={profile.uid}
            driverUid={slot.driver_uid}
            driverName={slot.driver_name}
            passengers={slot.passengers}
            tripStatus={slotTripStatus(slot)}
            onStartTrip={() => teamEventsService.startCarpoolTrip(event.id, profile.uid)}
            onEndTrip={() => teamEventsService.endCarpoolTrip(event.id, profile.uid)}
            onTripChanged={onUpdated}
          />
        ) : null}
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
  body: { padding: spacing.md, paddingLeft: spacing.sm, gap: spacing.xs },
  driverRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.xs },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  driverCopy: { flex: 1 },
  seatsPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  seatsText: { fontWeight: '800' },
  scorePill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  etaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.xs },
  etaText: { fontWeight: '700' },
  route: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.xs, marginTop: spacing.xs },
  routeText: { flex: 1 },
  mapLink: { fontWeight: '700', marginTop: 2 },
  passengers: { gap: 2 },
  time: { fontWeight: '700' },
  notes: { fontStyle: 'italic' },
  actions: { marginTop: spacing.sm },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
  },
  ghostBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    marginBottom: spacing.xs,
  },
  btnText: { fontWeight: '800' },
  ticketActions: { gap: spacing.sm },
  ticketGhost: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1.5,
    borderColor: CARPOOL_SITE.fog,
    borderRadius: 999,
    backgroundColor: CARPOOL_SITE.surfaceMuted,
  },
  ticketGhostText: { fontWeight: '800', color: CARPOOL_SITE.ink },
  ticketCta: {
    alignSelf: 'stretch',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 999,
    backgroundColor: CARPOOL_SITE.asphalt,
  },
  ticketCtaText: { fontWeight: '800', color: '#fff' },
});
