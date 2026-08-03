import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  RefreshControl,
  View,
} from 'react-native';
import type { User } from '../../models/User';
import type { TeamEvent, CarpoolSlot } from '../../models/TeamEvent';
import type { StandaloneCarpoolOffer } from '../../models/StandaloneCarpoolOffer';
import type { CarpoolChapterId } from '../../content/carpoolChapters';
import {
  carpoolAvailableSeats,
  carpoolEventSummaryForUser,
  findCarpoolBooking,
} from '../../utils/carpoolBalance';
import { CarpoolEventCard } from './CarpoolEventCard';
import { CarpoolRideCard } from './CarpoolRideCard';
import { CarpoolProposePanel } from './CarpoolProposePanel';
import { StandaloneCarpoolRideCard } from './StandaloneCarpoolRideCard';
import { CarpoolEmptyState, CarpoolFilterChips } from './carpoolUi';
import {
  isStandalonePassenger,
  isUpcomingStandaloneOffer,
  isPastStandaloneOffer,
  standaloneAvailableSeats,
  sortStandaloneByProximity,
} from '../../utils/standaloneCarpool';
import { useAppTheme } from '../../context/ProductLineContext';
import { useTranslation } from '../../context/LocaleContext';
import { TAB_BAR_CONTENT_INSET } from '../../navigation/tabBarLayout';
import { SkeletonList, InteractiveListItem } from '../motion';
import { spacing } from '../../theme/designTokens';
import { ProDayScreenCanvas } from '../ui/ProDayScreenCanvas';
import { ProDayTabPager } from '../ui/ProDayTabPager';
import { CarpoolHero } from './CarpoolHero';
import { CarpoolDiscoverDeck } from './CarpoolDiscoverDeck';
import { CarpoolLiveMission } from './CarpoolLiveMission';
import { CarpoolModeSwitcher, type CarpoolHubMode } from './CarpoolModeSwitcher';
import {
  findActiveCarpoolTripsForUser,
  type ActiveCarpoolTripRef,
} from '../../utils/carpoolActiveTrips';
import { isTripActive } from '../../utils/carpoolLiveTrip';
import { carpoolOffersService } from '../../services/carpoolOffers.service';
import { teamEventsService } from '../../services/teamEvents.service';
import {
  buildCarpoolRideRecommendations,
  sortCarpoolRides,
  findCarpoolRec,
  summarizeCarpoolTrip,
} from '../../features/v3/engines/carpoolGeo.engine';

interface CarpoolHomeScreenProps {
  profile: User | null;
  events: TeamEvent[];
  standaloneOffers: StandaloneCarpoolOffer[];
  standaloneAllOffers?: StandaloneCarpoolOffer[];
  standaloneLoading?: boolean;
  loading: boolean;
  initialChapter?: CarpoolChapterId;
  onOpenEvent: (eventId: string) => void;
  onRefresh: () => void;
  onLoginRequired?: () => void;
}

const pagePad = {
  paddingHorizontal: spacing.lg,
  paddingTop: spacing.lg,
  paddingBottom: TAB_BAR_CONTENT_INSET + spacing.sm,
};

type RideOffer = { event: TeamEvent; slot: CarpoolSlot };

/** Un seul métaphore de navigation : les chapitres se replient sur 3 voies. */
function chapterToMode(chapter: CarpoolChapterId): CarpoolHubMode {
  if (chapter === 'proposer') return 'drive';
  if (chapter === 'mes_trajets' || chapter === 'equipe') return 'live';
  return 'ride';
}

export const CarpoolHomeScreen: React.FC<CarpoolHomeScreenProps> = ({
  profile,
  events,
  standaloneOffers,
  standaloneAllOffers = [],
  standaloneLoading = false,
  loading,
  initialChapter = 'reserver',
  onOpenEvent,
  onRefresh,
  onLoginRequired,
}) => {
  const { colors } = useAppTheme();
  const { t } = useTranslation();

  const tripsTabFilters = useMemo(
    () => [
      { id: 'upcoming' as const, label: t('carpool.trips.tab.upcoming') },
      { id: 'past' as const, label: t('carpool.trips.tab.past') },
    ],
    [t],
  );

  const [mode, setMode] = useState<CarpoolHubMode>(chapterToMode(initialChapter));
  useEffect(() => {
    setMode(chapterToMode(initialChapter));
  }, [initialChapter]);

  const [myTripsTab, setMyTripsTab] = useState<'upcoming' | 'past'>('upcoming');
  const [refreshing, setRefreshing] = useState(false);

  const activeTrips = useMemo(() => {
    if (!profile) return [] as ActiveCarpoolTripRef[];
    return findActiveCarpoolTripsForUser(
      profile.uid,
      events,
      standaloneAllOffers.length ? standaloneAllOffers : standaloneOffers,
    );
  }, [profile, events, standaloneAllOffers, standaloneOffers]);

  const hasLiveTrip = activeTrips.some((trip) => isTripActive(trip.tripStatus));

  const upcoming = useMemo(() => {
    const now = Date.now() - 6 * 60 * 60 * 1000;
    return events
      .filter((e) => e.starts_at.getTime() >= now)
      .sort((a, b) => a.starts_at.getTime() - b.starts_at.getTime());
  }, [events]);

  const myTrips = useMemo(() => {
    if (!profile) return [];
    return upcoming.filter((event) => {
      const s = carpoolEventSummaryForUser(event, profile.uid);
      return s.isDriver || Boolean(s.myBookingDriverUid);
    });
  }, [upcoming, profile]);

  const upcomingStandalone = useMemo(
    () => standaloneOffers.filter(isUpcomingStandaloneOffer),
    [standaloneOffers],
  );

  const bookableStandalone = useMemo(() => {
    if (!profile) return [];
    return sortStandaloneByProximity(
      upcomingStandalone.filter((offer) => {
        if (offer.driver_uid === profile.uid) return false;
        if (isStandalonePassenger(offer, profile.uid)) return false;
        return standaloneAvailableSeats(offer) > 0;
      }),
      profile.location,
    );
  }, [upcomingStandalone, profile]);

  const myStandaloneTrips = useMemo(() => {
    if (!profile) return [];
    const source = standaloneAllOffers.length ? standaloneAllOffers : standaloneOffers;
    return source.filter((o) => {
      const mine = o.driver_uid === profile.uid || isStandalonePassenger(o, profile.uid);
      if (!mine) return false;
      return myTripsTab === 'past' ? isPastStandaloneOffer(o) : isUpcomingStandaloneOffer(o);
    });
  }, [standaloneAllOffers, standaloneOffers, profile, myTripsTab]);

  const availableRides = useMemo((): RideOffer[] => {
    if (!profile) return [];
    const list: RideOffer[] = [];
    for (const event of upcoming) {
      const myBooking = findCarpoolBooking(event, profile.uid);
      if (myBooking) continue;
      for (const slot of event.carpool_slots ?? []) {
        if (slot.driver_uid === profile.uid) continue;
        const available = carpoolAvailableSeats(slot);
        if (available === null || available > 0) {
          list.push({ event, slot });
        }
      }
    }
    return list;
  }, [upcoming, profile]);

  const carpoolRecs = useMemo(
    () =>
      buildCarpoolRideRecommendations({
        userLocation: profile?.location,
        rides: availableRides,
      }),
    [availableRides, profile?.location],
  );

  const sortedAvailableRides = useMemo(
    () => sortCarpoolRides(availableRides, carpoolRecs, Boolean(profile)),
    [availableRides, carpoolRecs, profile],
  );

  const handleRefresh = () => {
    setRefreshing(true);
    onRefresh();
    setTimeout(() => setRefreshing(false), 400);
  };

  const scrollProps = {
    showsVerticalScrollIndicator: false,
    nestedScrollEnabled: true,
    keyboardShouldPersistTaps: 'handled' as const,
  };

  const openReserve = useCallback(() => setMode('ride'), []);
  const openPropose = useCallback(() => setMode('drive'), []);

  const startActiveTrip = useCallback(
    async (ref: ActiveCarpoolTripRef) => {
      if (ref.kind === 'standalone') {
        await carpoolOffersService.startTrip(ref.offer.id, ref.driverUid);
      } else {
        await teamEventsService.startCarpoolTrip(ref.event.id, ref.driverUid);
      }
      onRefresh();
    },
    [onRefresh],
  );

  const endActiveTrip = useCallback(
    async (ref: ActiveCarpoolTripRef) => {
      if (ref.kind === 'standalone') {
        await carpoolOffersService.endTrip(ref.offer.id, ref.driverUid);
      } else {
        await teamEventsService.endCarpoolTrip(ref.event.id, ref.driverUid);
      }
      onRefresh();
    },
    [onRefresh],
  );

  const liveMissionProps = useCallback(
    (ref: ActiveCarpoolTripRef) => {
      const common = {
        tripId: ref.tripId,
        viewerUid: profile?.uid ?? '',
        driverUid: ref.driverUid,
        driverName: ref.driverName,
        tripStatus: ref.tripStatus,
        onStartTrip: () => startActiveTrip(ref),
        onEndTrip: () => endActiveTrip(ref),
        onTripChanged: onRefresh,
      };
      if (ref.kind === 'standalone') {
        return {
          ...common,
          passengers: ref.offer.passengers,
          title: ref.offer.title,
          meetingPlace: ref.offer.meeting_place,
          meetingLocation: ref.offer.meeting_location,
          destinationLabel: ref.offer.destination_label,
          destinationLocation: ref.offer.destination_location,
        };
      }
      return {
        ...common,
        passengers: ref.slot.passengers,
        title: ref.event.title,
        meetingPlace: ref.slot.meeting_place,
        meetingLocation: ref.slot.meeting_location,
        destinationLabel: [ref.event.location_label, ref.event.city]
          .filter(Boolean)
          .join(' · '),
      };
    },
    [profile?.uid, startActiveTrip, endActiveTrip, onRefresh],
  );

  const modeChapters = useMemo(
    () => [
      { id: 'ride' as const, label: t('carpool.chapter.reserve') },
      { id: 'drive' as const, label: t('carpool.chapter.propose') },
      { id: 'live' as const, label: t('carpool.chapter.trips') },
    ],
    [t],
  );

  const pages = useMemo(
    () => [
      {
        id: 'ride' as const,
        render: () => (
          <ScrollView
            contentContainerStyle={pagePad}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.accent} />
            }
            {...scrollProps}
          >
            {!profile ? (
              <CarpoolEmptyState
                icon="person"
                title={t('common.guest.loginTitle')}
                subtitle={t('carpool.guest.body')}
                ctaLabel={t('common.login')}
                onCta={onLoginRequired}
              />
            ) : loading && standaloneLoading ? (
              <SkeletonList count={3} variant="card" />
            ) : availableRides.length === 0 && bookableStandalone.length === 0 ? (
              <CarpoolEmptyState
                icon="car"
                title={t('carpool.reserve.empty.title')}
                subtitle={t('carpool.reserve.empty.subtitle')}
                ctaLabel={t('carpool.cta.proposeTrip')}
                onCta={openPropose}
              />
            ) : (
              <>
                {bookableStandalone.length > 0 ? (
                  <View style={styles.deckBleed}>
                    <CarpoolDiscoverDeck
                      offers={bookableStandalone}
                      profile={profile}
                      driverHistory={standaloneAllOffers}
                      onUpdated={onRefresh}
                    />
                  </View>
                ) : null}
                {sortedAvailableRides.map(({ event, slot }, index) => {
                  const rec = findCarpoolRec(carpoolRecs, event.id, slot.driver_uid);
                  const trip = summarizeCarpoolTrip({
                    userLocation: profile?.location,
                    slot,
                    rec,
                  });
                  return (
                    <InteractiveListItem
                      key={`${event.id}-${slot.driver_uid}`}
                      index={bookableStandalone.length + index}
                    >
                      <CarpoolRideCard
                        event={event}
                        slot={slot}
                        profile={profile}
                        onUpdated={onRefresh}
                        onOpenDetail={() => onOpenEvent(event.id)}
                        iaScore={trip.iaScore}
                        distanceKm={trip.distanceKm}
                        etaLabel={trip.etaLabel}
                      />
                    </InteractiveListItem>
                  );
                })}
              </>
            )}
          </ScrollView>
        ),
      },
      {
        id: 'drive' as const,
        render: () => (
          <CarpoolProposePanel
            profile={profile}
            events={events}
            standaloneOffers={standaloneOffers}
            loading={loading}
            standaloneLoading={standaloneLoading}
            refreshing={refreshing}
            onRefresh={onRefresh}
            onOpenEvent={onOpenEvent}
            scrollProps={scrollProps}
            pagePad={pagePad}
            onLoginRequired={onLoginRequired}
          />
        ),
      },
      {
        id: 'live' as const,
        render: () => (
          <ScrollView
            contentContainerStyle={pagePad}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.accent} />
            }
            {...scrollProps}
          >
            {profile && activeTrips.length > 0 ? (
              <View style={styles.liveBlock}>
                {activeTrips.map((ref) => (
                  <CarpoolLiveMission key={ref.tripId} {...liveMissionProps(ref)} compact />
                ))}
              </View>
            ) : null}

            {loading ? (
              <SkeletonList count={3} variant="card" />
            ) : myTrips.length === 0 && myStandaloneTrips.length === 0 && activeTrips.length === 0 ? (
              <CarpoolEmptyState
                icon="car"
                title={t('carpool.trips.empty.title')}
                subtitle={t('carpool.trips.empty.subtitle')}
                ctaLabel={t('carpool.cta.viewSeats')}
                onCta={openReserve}
              />
            ) : (
              <>
                <CarpoolFilterChips
                  options={tripsTabFilters}
                  value={myTripsTab}
                  onChange={setMyTripsTab}
                />
                {myStandaloneTrips.map((offer, index) => (
                  <InteractiveListItem key={`standalone-trip-${offer.id}`} index={index}>
                    <StandaloneCarpoolRideCard
                      offer={offer}
                      profile={profile!}
                      driverHistory={standaloneAllOffers}
                      onUpdated={onRefresh}
                    />
                  </InteractiveListItem>
                ))}
                {myTrips.map((event, index) => (
                  <InteractiveListItem key={event.id} index={myStandaloneTrips.length + index}>
                    <CarpoolEventCard
                      event={event}
                      profileUid={profile?.uid ?? ''}
                      onPress={() => onOpenEvent(event.id)}
                    />
                  </InteractiveListItem>
                ))}
              </>
            )}
          </ScrollView>
        ),
      },
    ],
    [
      colors,
      loading,
      standaloneLoading,
      standaloneOffers,
      standaloneAllOffers,
      myTrips,
      myStandaloneTrips,
      bookableStandalone,
      availableRides,
      activeTrips,
      liveMissionProps,
      profile,
      refreshing,
      events,
      onOpenEvent,
      onRefresh,
      sortedAvailableRides,
      carpoolRecs,
      onLoginRequired,
      scrollProps,
      openReserve,
      openPropose,
      myTripsTab,
      tripsTabFilters,
      t,
    ],
  );

  const subtitle =
    profile?.role === 'player' ? t('carpool.subtitle.player') : t('carpool.subtitle.staff');

  return (
    <ProDayScreenCanvas flat>
      <View style={styles.root}>
        <CarpoolHero headline={t('carpool.hero.member.headline')} support={subtitle} minHeight={244} />
        <CarpoolModeSwitcher mode={mode} onChange={setMode} liveActive={hasLiveTrip} />
        <View style={styles.body}>
          <ProDayTabPager
            variant="headless"
            chapters={modeChapters}
            pages={pages}
            activeChapter={mode}
            onChapterChange={setMode}
          />
        </View>
      </View>
    </ProDayScreenCanvas>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  body: { flex: 1, minHeight: 0 },
  liveBlock: { gap: spacing.sm, marginBottom: spacing.md },
  deckBleed: { marginHorizontal: -spacing.lg, marginBottom: spacing.sm },
});
