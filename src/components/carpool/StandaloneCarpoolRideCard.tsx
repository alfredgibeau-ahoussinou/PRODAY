import React, { useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import type { StandaloneCarpoolOffer } from '../../models/StandaloneCarpoolOffer';
import type { User } from '../../models/User';
import { carpoolOffersService } from '../../services/carpoolOffers.service';
import { CarpoolLocationCapture } from './CarpoolLocationCapture';
import { openMapsAt } from '../../utils/geoLocation';
import {
  driverCompletedTripsCount,
  formatFrenchDepartureDate,
  isPassengerPending,
  isStandalonePassenger,
  standaloneAvailableSeats,
  standalonePendingCount,
} from '../../utils/standaloneCarpool';
import {
  canMinorBookCarpool,
  minorCarpoolBookingWarning,
} from '../../utils/standaloneCarpoolMinor';
import { ProDayText } from '../ui/ProDayText';
import { ProDayGradient } from '../ui/ProDayGradient';
import { Icon } from '../ui/Icon';
import { PressableSpring } from '../motion';
import { prodayHaptics } from '../../utils/prodayHaptics';
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
  standaloneOfferTripStatus,
  standaloneTripId,
} from '../../utils/carpoolLiveTrip';
import { isStandaloneConfirmedPassenger } from '../../utils/standaloneCarpool';

interface StandaloneCarpoolRideCardProps {
  offer: StandaloneCarpoolOffer;
  profile: User;
  driverHistory?: StandaloneCarpoolOffer[];
  onUpdated: () => void;
  compact?: boolean;
}

export const StandaloneCarpoolRideCard: React.FC<StandaloneCarpoolRideCardProps> = ({
  offer,
  profile,
  driverHistory = [],
  onUpdated,
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

  const isMine = offer.driver_uid === profile.uid;
  const myPassenger = (offer.passengers ?? []).find((p) => p.uid === profile.uid);
  const bookedHere = isStandalonePassenger(offer, profile.uid);
  const pendingHere = myPassenger ? isPassengerPending(myPassenger) : false;
  const available = standaloneAvailableSeats(offer);
  const canBook = !isMine && !bookedHere && available > 0 && offer.status === 'open';
  const tripsDone = driverCompletedTripsCount(driverHistory, offer.driver_uid);

  const handleContactDriver = async () => {
    if (!tabNav) return;
    setContactBusy(true);
    try {
      await openCarpoolDriverChat(
        profile,
        offer.driver_uid,
        offer.driver_name,
        tabNav.openChat,
      );
    } finally {
      setContactBusy(false);
    }
  };

  const handleBook = () => {
    const minorWarning = minorCarpoolBookingWarning(profile);
    if (!canMinorBookCarpool(profile)) {
      Alert.alert(t('carpool.standalone.blocked'), minorWarning ?? t('carpool.standalone.minorDefault'));
      return;
    }
    const proceed = async () => {
      if (!pickupPlace.trim() && !pickupLocation) {
        Alert.alert(t('carpool.standalone.form.pickupRequired'), t('carpool.ride.pickupRequired'));
        return;
      }
      setBusy(true);
      try {
        await carpoolOffersService.requestSeat(
          offer.id,
          profile.uid,
          profile.display_name,
          {
            pickup_place: pickupPlace.trim() || undefined,
            pickup_location: pickupLocation,
          },
        );
        prodayHaptics.carpoolBook();
        onUpdated();
        Alert.alert(t('carpool.standalone.requestSent'), t('carpool.standalone.requestBody'));
      } catch (e) {
        Alert.alert(t('common.error'), e instanceof Error ? e.message : t('carpool.ride.bookFailed'));
      } finally {
        setBusy(false);
      }
    };

    if (minorWarning) {
      Alert.alert(t('carpool.minor.title'), minorWarning, [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('common.continue'), onPress: () => void proceed() },
      ]);
      return;
    }
    void proceed();
  };

  const handleRespond = (passengerUid: string, accept: boolean) => {
    setBusy(true);
    void carpoolOffersService
      .respondToSeat(offer.id, profile.uid, passengerUid, accept)
      .then(onUpdated)
      .catch((e) => Alert.alert(t('common.error'), e instanceof Error ? e.message : t('carpool.standalone.actionFailed')))
      .finally(() => setBusy(false));
  };

  const handleCancel = () => {
    Alert.alert(t('carpool.standalone.cancel.title'), undefined, [
      { text: t('common.no'), style: 'cancel' },
      {
        text: t('common.yes'),
        style: 'destructive',
        onPress: () => {
          void (async () => {
            setBusy(true);
            try {
              await carpoolOffersService.cancelSeat(offer.id, profile.uid);
              onUpdated();
            } catch (e) {
              Alert.alert(t('common.error'), e instanceof Error ? e.message : t('carpool.standalone.cancel.failed'));
            } finally {
              setBusy(false);
            }
          })();
        },
      },
    ]);
  };

  const fromLabel = offer.meeting_place?.trim() || t('carpool.ride.meetingTbd');
  const toLabel = offer.destination_label?.trim() || offer.title;
  const seatsLabel = t('carpool.standalone.seats', { n: available });
  const driverLabel = `${offer.driver_name}${tripsDone >= 3 ? t('carpool.standalone.verified') : ''}`;

  const ticketFooter = (
    <View style={styles.ticketActions}>
      {canBook ? (
        <>
          {!isMine && tabNav ? (
            <PressableSpring
              onPress={() => void handleContactDriver()}
              disabled={contactBusy}
              scaleTo={0.97}
              haptic
              style={styles.ticketGhost}
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
          <CarpoolLocationCapture
            label={t('carpool.standalone.pickupLabel')}
            place={pickupPlace}
            location={pickupLocation}
            onPlaceChange={setPickupPlace}
            onLocationChange={setPickupLocation}
            disabled={busy}
            compact
          />
          <PressableSpring onPress={handleBook} disabled={busy} scaleTo={0.96} haptic style={styles.ticketCta}>
            {busy ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <ProDayText variant="caption" style={styles.ticketCtaText}>
                {t('carpool.standalone.requestSeat')}
              </ProDayText>
            )}
          </PressableSpring>
        </>
      ) : null}

      {!canBook && !isMine && tabNav ? (
        <PressableSpring
          onPress={() => void handleContactDriver()}
          disabled={contactBusy}
          scaleTo={0.97}
          haptic
          style={styles.ticketGhost}
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
        <PressableSpring onPress={handleCancel} disabled={busy} scaleTo={0.96} haptic style={styles.ticketGhost}>
          <Icon
            name={pendingHere ? 'time' : 'checkmark-circle'}
            size={16}
            color={pendingHere ? CARPOOL_SITE.signal : CARPOOL_SITE.ink}
          />
          <ProDayText variant="caption" style={styles.ticketGhostText}>
            {pendingHere ? t('carpool.standalone.pending') : t('carpool.standalone.confirmed')}
          </ProDayText>
        </PressableSpring>
      ) : null}

      {isMine ? (
        <View style={styles.mineBlock}>
          <ProDayText variant="caption" style={styles.ticketGhostText}>
            {t('carpool.standalone.passengersConfirmed', {
              n: (offer.passengers ?? []).filter((p) => p.status === 'confirmed' || !p.status).length,
            })}
            {standalonePendingCount(offer) > 0
              ? t('carpool.standalone.passengersPendingSuffix', { n: standalonePendingCount(offer) })
              : ''}
          </ProDayText>
          {(offer.passengers ?? [])
            .filter((p) => p.status === 'pending')
            .map((p) => (
              <View key={p.uid} style={styles.ticketPassengerRow}>
                <View style={{ flex: 1 }}>
                  <ProDayText variant="caption" style={styles.ticketGhostText}>
                    {p.name}
                  </ProDayText>
                </View>
                <PressableSpring onPress={() => handleRespond(p.uid, true)} scaleTo={0.97} haptic>
                  <ProDayText variant="caption" style={styles.ticketAccept}>
                    {t('carpool.standalone.accept')}
                  </ProDayText>
                </PressableSpring>
                <PressableSpring onPress={() => handleRespond(p.uid, false)} scaleTo={0.97}>
                  <ProDayText variant="caption" style={{ color: CARPOOL_SITE.inkDim }}>
                    {t('carpool.standalone.decline')}
                  </ProDayText>
                </PressableSpring>
              </View>
            ))}
        </View>
      ) : null}
    </View>
  );

  if (compact) {
    return (
      <CarpoolTripTicket
        meta={`${formatFrenchDepartureDate(offer.departs_at)}${
          offer.meeting_time ? t('carpool.standalone.departure', { time: offer.meeting_time }) : ''
        }`}
        metaRight={offer.club_only ? t('carpool.standalone.clubOnly') : t('carpool.standalone.freeTrip')}
        from={fromLabel}
        to={toLabel}
        driver={driverLabel}
        seatsLabel={seatsLabel}
        timeLabel={offer.meeting_time || null}
        footer={ticketFooter}
      />
    );
  }

  return (
    <View style={[styles.card, { borderColor: colors.border, backgroundColor: colors.surface }, shadows.soft]}>
      <CarpoolCardAccent kind="cta" />
      <View style={styles.inner}>
      <View style={styles.header}>
        <View style={styles.pillRow}>
          <View style={[styles.pill, { backgroundColor: colors.accentSoft }]}>
            <ProDayText variant="caption" accent style={styles.pillText}>
              {t('carpool.standalone.freeTrip')}
            </ProDayText>
          </View>
          {offer.club_only ? (
            <View style={[styles.pill, { backgroundColor: colors.surfaceMuted }]}>
              <ProDayText variant="caption" muted style={styles.pillText}>
                {t('carpool.standalone.clubOnly')}
              </ProDayText>
            </View>
          ) : null}
        </View>
        <ProDayText variant="section">{offer.title}</ProDayText>
        <ProDayText variant="caption" muted>
          {formatFrenchDepartureDate(offer.departs_at)}
          {offer.meeting_time ? t('carpool.standalone.departure', { time: offer.meeting_time }) : ''}
        </ProDayText>
        {offer.destination_label ? (
          <ProDayText variant="caption" muted>
            → {offer.destination_label}
          </ProDayText>
        ) : null}
        {offer.vehicle_type ? (
          <ProDayText variant="caption" muted>
            {t('carpool.vehicle.label')}: {t(`carpool.vehicle.${offer.vehicle_type}`)}
          </ProDayText>
        ) : null}
        <ProDayText variant="caption" accent style={styles.driver}>
          {offer.driver_name}
          {tripsDone >= 3 ? t('carpool.standalone.verified') : ''}
          {t('carpool.standalone.seats', { n: available })}
        </ProDayText>
      </View>

      {offer.meeting_place ? (
          <ProDayText variant="caption" muted style={styles.meeting}>
            {t('carpool.standalone.meeting', { place: offer.meeting_place })}
          </ProDayText>
      ) : null}

      {offer.meeting_location ? (
        <PressableSpring
          onPress={() => openMapsAt(offer.meeting_location!, offer.meeting_place)}
          scaleTo={0.96}
          haptic
        >
          <ProDayText variant="caption" accent style={styles.mapLink}>
            {t('carpool.standalone.openMeetingMaps')}
          </ProDayText>
        </PressableSpring>
      ) : null}

      {offer.destination_location ? (
        <PressableSpring
          onPress={() => openMapsAt(offer.destination_location!, offer.destination_label)}
          scaleTo={0.96}
        >
          <ProDayText variant="caption" accent style={styles.mapLink}>
            {t('carpool.standalone.openDestinationMaps')}
          </ProDayText>
        </PressableSpring>
      ) : null}

      {canBook ? (
        <View style={styles.bookBlock}>
          {!isMine && tabNav ? (
            <PressableSpring
              onPress={() => void handleContactDriver()}
              disabled={contactBusy}
              scaleTo={0.97}
              haptic
            >
              <View style={[styles.contactBtn, { borderColor: colors.border }]}>
                {contactBusy ? (
                  <ActivityIndicator color={colors.accent} size="small" />
                ) : (
                  <>
                    <Icon name="chat" size={14} color={colors.accent} />
                    <ProDayText variant="caption" accent style={styles.ctaText}>
                      {t('carpool.ride.contactDriver')}
                    </ProDayText>
                  </>
                )}
              </View>
            </PressableSpring>
          ) : null}
          <CarpoolLocationCapture
            label={t('carpool.standalone.pickupLabel')}
            place={pickupPlace}
            location={pickupLocation}
            onPlaceChange={setPickupPlace}
            onLocationChange={setPickupLocation}
            disabled={busy}
            compact
          />
          <PressableSpring onPress={handleBook} disabled={busy} scaleTo={0.96} haptic>
            <ProDayGradient kind="cta" style={styles.cta}>
              {busy ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <ProDayText variant="caption" inverse style={styles.ctaText}>
                  {t('carpool.standalone.requestSeat')}
                </ProDayText>
              )}
            </ProDayGradient>
          </PressableSpring>
        </View>
      ) : null}

      {!canBook && !isMine && tabNav ? (
        <PressableSpring
          onPress={() => void handleContactDriver()}
          disabled={contactBusy}
          scaleTo={0.97}
          haptic
        >
          <View style={[styles.contactBtn, { borderColor: colors.border }]}>
            {contactBusy ? (
              <ActivityIndicator color={colors.accent} size="small" />
            ) : (
              <>
                <Icon name="chat" size={14} color={colors.accent} />
                <ProDayText variant="caption" accent style={styles.ctaText}>
                  {t('carpool.ride.contactDriver')}
                </ProDayText>
              </>
            )}
          </View>
        </PressableSpring>
      ) : null}

      {bookedHere ? (
        <PressableSpring onPress={handleCancel} disabled={busy} scaleTo={0.96} haptic>
          <View style={[styles.booked, { borderColor: colors.border }]}>
            <Icon
              name={pendingHere ? 'time' : 'checkmark-circle'}
              size={16}
              color={pendingHere ? colors.warning : colors.success}
            />
            <ProDayText variant="caption" accent style={styles.bookedText}>
              {pendingHere ? t('carpool.standalone.pending') : t('carpool.standalone.confirmed')}
            </ProDayText>
          </View>
        </PressableSpring>
      ) : null}

      {isMine ? (
        <View style={styles.mineBlock}>
          <ProDayText variant="caption" muted>
            {t('carpool.standalone.passengersConfirmed', {
              n: (offer.passengers ?? []).filter((p) => p.status === 'confirmed' || !p.status).length,
            })}
            {standalonePendingCount(offer) > 0
              ? t('carpool.standalone.passengersPendingSuffix', { n: standalonePendingCount(offer) })
              : ''}
          </ProDayText>
          {(offer.passengers ?? [])
            .filter((p) => p.status === 'pending')
            .map((p) => (
              <View key={p.uid} style={[styles.passengerRow, { borderColor: colors.border }]}>
                <View style={{ flex: 1 }}>
                  <ProDayText variant="caption" style={styles.passengerName}>
                    {p.name}
                  </ProDayText>
                  {p.pickup_place ? (
                    <ProDayText variant="caption" muted>
                      {p.pickup_place}
                    </ProDayText>
                  ) : null}
                </View>
                <PressableSpring onPress={() => handleRespond(p.uid, true)} scaleTo={0.97} haptic>
                  <ProDayText variant="caption" accent style={styles.action}>
                    {t('carpool.standalone.accept')}
                  </ProDayText>
                </PressableSpring>
                <PressableSpring onPress={() => handleRespond(p.uid, false)} scaleTo={0.97}>
                  <ProDayText variant="caption" muted style={styles.action}>
                    {t('carpool.standalone.decline')}
                  </ProDayText>
                </PressableSpring>
              </View>
            ))}
        </View>
      ) : null}

      {!compact && (isMine || isStandaloneConfirmedPassenger(offer, profile.uid)) ? (
        <CarpoolLiveTripPanel
          tripId={standaloneTripId(offer.id)}
          viewerUid={profile.uid}
          driverUid={offer.driver_uid}
          driverName={offer.driver_name}
          passengers={offer.passengers}
          tripStatus={standaloneOfferTripStatus(offer)}
          onStartTrip={() => carpoolOffersService.startTrip(offer.id, profile.uid)}
          onEndTrip={() => carpoolOffersService.endTrip(offer.id, profile.uid)}
          onTripChanged={onUpdated}
        />
      ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: radius.xl,
    marginBottom: spacing.sm,
    overflow: 'hidden',
    paddingLeft: spacing.sm,
  },
  inner: {
    padding: spacing.md,
    paddingLeft: spacing.sm,
    gap: spacing.xs,
  },
  header: { gap: 4 },
  pillRow: { flexDirection: 'row', gap: spacing.xs, flexWrap: 'wrap' },
  pill: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
    marginBottom: 2,
  },
  pillText: { fontWeight: '800', fontSize: 10 },
  driver: { fontWeight: '700', marginTop: 4 },
  meeting: { lineHeight: 18 },
  mapLink: { fontWeight: '700' },
  bookBlock: { gap: spacing.sm, marginTop: spacing.sm },
  contactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    marginTop: spacing.xs,
  },
  cta: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
  },
  ctaText: { fontWeight: '800' },
  booked: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    padding: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    marginTop: spacing.xs,
  },
  bookedText: { fontWeight: '700' },
  mineBlock: { marginTop: spacing.xs, gap: spacing.xs },
  passengerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    borderWidth: 1,
    borderRadius: radius.md,
  },
  passengerName: { fontWeight: '700' },
  action: { fontWeight: '700' },
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
  ticketPassengerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  ticketAccept: { fontWeight: '800', color: CARPOOL_SITE.signalDeep },
});
