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
        <PressableSpring onPress={handleCancel} disabled={busy} scaleTo={0.96} haptic style={styles.ticketGhost}>
          <Icon
            name={pendingHere ? 'time' : 'checkmark-circle'}
            size={16}
            color={pendingHere ? palette.signal : palette.ink}
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
                  <ProDayText variant="caption" style={{ color: palette.inkDim }}>
                    {t('carpool.standalone.decline')}
                  </ProDayText>
                </PressableSpring>
              </View>
            ))}
        </View>
      ) : null}
    </View>
  );

  
  const fullFooter = (
    <View style={styles.ticketActions}>
      {ticketFooter}

      {!compact && (
        <View style={{ marginTop: spacing.md, gap: spacing.sm }}>
          {offer.meeting_location && (
            <PressableSpring
              onPress={() => openMapsAt(offer.meeting_location!, offer.meeting_place)}
              scaleTo={0.98}
            >
              <ProDayText variant="caption" accent style={cardStyles.mapLink}>
                📍 Voir le RDV ({offer.meeting_place?.trim() || 'GPS'}) sur Maps
              </ProDayText>
            </PressableSpring>
          )}

          {(offer.passengers?.length ?? 0) > 0 && (
            <View style={cardStyles.passengers}>
              <ProDayText variant="caption" muted>
                Passagers : {(offer.passengers ?? []).map((p) => p.name).join(', ')}
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
        </View>
      )}
    </View>
  );

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
      footer={fullFooter}
    />
  );
}

const cardStyles = StyleSheet.create({
  card: {},
  inner: {},
  header: {},
  pillRow: {},
  typePill: {},
  typeText: {},
  freePill: {},
  freeText: {},
  seatsPill: {},
  seatsText: {},
  body: {},
  driverRow: {},
  avatar: {},
  driverCopy: {},
  actions: { marginTop: spacing.sm },
  ghostBtn: {},
  btnText: {},
  primaryBtn: {},
  routeGroup: {},
  routeRow: {},
  routeIcon: {},
  routeText: {},
  passengers: {},
  mapLink: { fontWeight: '700', marginTop: 2 },
});

function createTicketStyles(palette: CarpoolUiPalette) {
  return StyleSheet.create({
    ticketActions: { gap: spacing.sm },
    mineBlock: { padding: spacing.md, backgroundColor: palette.surfaceMuted, borderRadius: radius.md, marginBottom: spacing.sm },
    ticketPassengerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: spacing.xs },
    ticketAccept: { paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radius.pill, backgroundColor: palette.signal },

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
