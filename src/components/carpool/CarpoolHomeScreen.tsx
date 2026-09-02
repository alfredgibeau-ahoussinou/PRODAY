import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, RefreshControl, View, Text, TextInput } from 'react-native';
import type { User } from '../../models/User';
import type { TeamEvent, CarpoolSlot } from '../../models/TeamEvent';
import type { StandaloneCarpoolOffer } from '../../models/StandaloneCarpoolOffer';
import {
  type CarpoolChapterId,
  type CarpoolHubMode,
  type CarpoolScopeFilter,
  carpoolChapterToHubMode,
} from '../../content/carpoolChapters';
import {
  carpoolAvailableSeats,
  carpoolEventSummaryForUser,
  findCarpoolBooking,
  matchesCarpoolScopeFilter,
} from '../../utils/carpoolBalance';
import { Icon } from '../ui/Icon';
import { CarpoolEventCard } from './CarpoolEventCard';
import { CarpoolRideCard } from './CarpoolRideCard';
import { CarpoolBalancePanel } from './CarpoolBalancePanel';
import { CarpoolProposePanel } from './CarpoolProposePanel';
import { StandaloneCarpoolRideCard } from './StandaloneCarpoolRideCard';
import { CarpoolEmptyState, CarpoolFilterChips } from './carpoolUi';
import { CarpoolHubChrome } from './CarpoolHubChrome';
import { CoachCarpoolModeBar } from './CoachCarpoolModeBar';
import { CoachCarpoolReminder } from './CoachCarpoolReminder';
import { CoachText } from '../coach/coachPortalUi';
import { CarpoolLiveMission } from './CarpoolLiveMission';
import { CarpoolSpaceBackground } from './CarpoolSpaceBackground';
import { CARPOOL_SITE } from '../../content/carpoolSite';
import {
  type CarpoolUiPalette,
  useCarpoolThemedStyles,
  useCarpoolUi,
} from './CarpoolUiContext';
import {
  isStandalonePassenger,
  isUpcomingStandaloneOffer,
  isPastStandaloneOffer,
  standaloneAvailableSeats,
  filterStandaloneOffers,
  sortStandaloneByProximity,
} from '../../utils/standaloneCarpool';
import { useTranslation } from '../../context/LocaleContext';
import { TAB_BAR_CONTENT_INSET } from '../../navigation/tabBarLayout';
import { SkeletonList, InteractiveListItem, CrossfadeSwitch } from '../motion';
import { spacing, radius } from '../../theme/designTokens';
import { PressableSpring } from '../motion';
import { useCoachShellNav } from '../../features/coach/shell/CoachShellNavContext';
import { CoachPane } from '../coach/CoachScreenHeader';
import { getCoachPageIdentity } from '../../content/coachPageIdentity';
import { useCoachTokens } from '../../features/coach/shell/CoachThemeContext';
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
  /** Header déjà fourni par TabScreenShell joueur. */
  hideHero?: boolean;
  /** Mode shell joueur dark premium. */
  joueurShell?: boolean;
}

const pagePad = {
  paddingHorizontal: spacing.lg,
  paddingBottom: TAB_BAR_CONTENT_INSET + spacing.sm,
  gap: spacing.sm,
};

type RideOffer = { event: TeamEvent; slot: CarpoolSlot };
type RideFilter = 'all' | 'club' | 'match';

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
  hideHero = false,
  joueurShell = false,
}) => {
  const { t } = useTranslation();
  const coachShell = Boolean(useCoachShellNav());
  const coachTokens = useCoachTokens();
  const palette = useCarpoolUi();
  const styles = useCarpoolThemedStyles(createStyles);

  const [mode, setMode] = useState<CarpoolHubMode>(() =>
    carpoolChapterToHubMode(initialChapter),
  );
  const [searchCity, setSearchCity] = useState('');
  const [rideFilter, setRideFilter] = useState<RideFilter>('all');
  const [myTripsTab, setMyTripsTab] = useState<'upcoming' | 'past'>('upcoming');
  const [refreshing, setRefreshing] = useState(false);
  const [rideFiltersOpen, setRideFiltersOpen] = useState(false);
  const [showAllSeats, setShowAllSeats] = useState(false);

  useEffect(() => {
    setMode(carpoolChapterToHubMode(initialChapter));
  }, [initialChapter]);

  useEffect(() => {
    if (coachShell) {
      setShowAllSeats(false);
      setRideFiltersOpen(false);
    }
  }, [mode, coachShell]);

  const setHubMode = useCallback((next: CarpoolHubMode) => {
    setMode(next);
  }, []);

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

  const clubOnly = rideFilter === 'club';

  const bookableStandalone = useMemo(() => {
    if (!profile) return [];
    const filtered = filterStandaloneOffers(upcomingStandalone, {
      city: searchCity,
      clubOnly,
      viewerClubId: profile.profile?.club_id,
    });
    return sortStandaloneByProximity(
      filtered.filter((offer) => {
        if (offer.driver_uid === profile.uid) return false;
        if (isStandalonePassenger(offer, profile.uid)) return false;
        return standaloneAvailableSeats(offer) > 0;
      }),
      profile.location,
    );
  }, [upcomingStandalone, profile, searchCity, clubOnly]);

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
    const scopeFilter: CarpoolScopeFilter = rideFilter === 'match' ? 'match' : 'all';
    for (const event of upcoming) {
      if (!matchesCarpoolScopeFilter(event, scopeFilter)) continue;
      if (searchCity.trim()) {
        const hay = [event.title, event.city, event.location_label]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!hay.includes(searchCity.trim().toLowerCase())) continue;
      }
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
  }, [upcoming, profile, rideFilter, searchCity]);

  const needsRideEvents = useMemo(() => {
    if (!profile) return [];
    return upcoming.filter((e) => {
      if (rideFilter === 'match' && !matchesCarpoolScopeFilter(e, 'match')) return false;
      const s = carpoolEventSummaryForUser(e, profile.uid);
      return !s.isDriver && !s.myBookingDriverUid;
    });
  }, [upcoming, profile, rideFilter]);

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

  const reminderEvents = useMemo(() => {
    if (!profile) return [];
    const horizon = Date.now() + 24 * 60 * 60 * 1000;
    return upcoming.filter((event) => {
      const ts = event.starts_at.getTime();
      if (ts < Date.now() || ts > horizon) return false;
      const s = carpoolEventSummaryForUser(event, profile.uid);
      return !s.isDriver && !s.myBookingDriverUid;
    });
  }, [upcoming, profile]);

  const rideFilterOptions = useMemo(
    () => [
      { id: 'all' as const, label: t('carpool.reserve.filter.all') },
      { id: 'club' as const, label: t('carpool.reserve.filter.club') },
      { id: 'match' as const, label: t('carpool.hub.filter.match') },
    ],
    [t],
  );

  const tripsTabFilters = useMemo(
    () => [
      { id: 'upcoming' as const, label: t('carpool.trips.tab.upcoming') },
      { id: 'past' as const, label: t('carpool.trips.tab.past') },
    ],
    [t],
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

  const badges = {
    ride:
      sortedAvailableRides.length + bookableStandalone.length > 0
        ? sortedAvailableRides.length + bookableStandalone.length
        : undefined,
    drive: undefined as number | undefined,
    trips:
      myTrips.length + myStandaloneTrips.length > 0
        ? myTrips.length + myStandaloneTrips.length
        : undefined,
  };

  const subtitle =
    profile?.role === 'player' ? t('carpool.subtitle.player') : t('carpool.subtitle.staff');

  const refreshControl = (
    <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={palette.signal} />
  );

  const COACH_SEAT_CAP = 5;
  const COACH_EVENT_CAP = 6;

  const allSeatOffers = useMemo(
    () => [...bookableStandalone.map((offer) => ({ kind: 'standalone' as const, offer })), ...sortedAvailableRides.map((ride) => ({ kind: 'event' as const, ...ride }))],
    [bookableStandalone, sortedAvailableRides],
  );

  const visibleSeatOffers = coachShell && !showAllSeats
    ? allSeatOffers.slice(0, COACH_SEAT_CAP)
    : allSeatOffers;

  const renderRideFilters = () => (
    <>
      <View style={styles.search}>
        <Icon name="search" size={16} color={palette.inkDim} />
        <TextInput
          style={styles.searchInput}
          value={searchCity}
          onChangeText={setSearchCity}
          placeholder={t('carpool.reserve.filter.city')}
          placeholderTextColor={palette.inkDim}
        />
      </View>
      <CarpoolFilterChips options={rideFilterOptions} value={rideFilter} onChange={setRideFilter} />
    </>
  );

  const renderSeatOffer = (
    item: (typeof allSeatOffers)[number],
    index: number,
  ) => {
    if (!profile) return null;
    if (item.kind === 'standalone') {
      return (
        <InteractiveListItem key={`solo-${item.offer.id}`} index={index}>
          <StandaloneCarpoolRideCard
            offer={item.offer}
            profile={profile}
            driverHistory={standaloneAllOffers}
            onUpdated={onRefresh}
            compact
          />
        </InteractiveListItem>
      );
    }
    const { event, slot } = item;
    const rec = findCarpoolRec(carpoolRecs, event.id, slot.driver_uid);
    const trip = summarizeCarpoolTrip({
      userLocation: profile.location,
      slot,
      rec,
    });
    return (
      <InteractiveListItem key={`${event.id}-${slot.driver_uid}`} index={index}>
        <CarpoolRideCard
          event={event}
          slot={slot}
          profile={profile}
          onUpdated={onRefresh}
          onOpenDetail={() => onOpenEvent(event.id)}
          iaScore={trip.iaScore}
          distanceKm={trip.distanceKm}
          etaLabel={trip.etaLabel}
          compact
        />
      </InteractiveListItem>
    );
  };

  const renderRide = () => (
    <ScrollView contentContainerStyle={pagePad} refreshControl={refreshControl} {...scrollProps}>
      {/* UBER STYLE SEARCH BANNER */}
      <View style={[styles.uberSearchBlock, { backgroundColor: palette.surface, borderColor: palette.lane }]}>
        <Text style={[styles.uberSearchTitle, { color: palette.ink }]}>Où allez-vous ?</Text>
        <View style={[styles.uberInputRow, { backgroundColor: palette.bg }]}>
          <Icon name="search" size={20} color={palette.ink} />
          <TextInput 
            style={[styles.uberInput, { color: palette.ink }]} 
            placeholder="Stade, club, match..." 
            placeholderTextColor={palette.ink + '88'} 
          />
        </View>
        <View style={styles.uberQuickChips}>
          {["Prochain match", "Entraînement", "Domicile"].map((chip) => (
            <View key={chip} style={[styles.uberChip, { backgroundColor: palette.bg, borderColor: palette.lane }]}>
              <Text style={[styles.uberChipText, { color: palette.ink }]}>{chip}</Text>
            </View>
          ))}
        </View>
      </View>

      {coachShell ? null : (
        <>
          <Text style={styles.modeTitle}>{t('carpool.hub.rideTitle')}</Text>
          <Text style={styles.modeSupport}>{t('carpool.hub.rideSupport')}</Text>
        </>
      )}

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
      ) : coachShell ? (
        <>
          {needsRideEvents.length > 0 ? (
            <View style={styles.sectionBlock}>
              <CoachText variant="caption" accent style={styles.coachSectionLabel}>
                {t('carpool.hub.eventsWithoutRide')}
              </CoachText>
              {needsRideEvents.slice(0, COACH_EVENT_CAP).map((event, index) => (
                <InteractiveListItem key={`need-${event.id}`} index={index}>
                  <CarpoolEventCard
                    event={event}
                    profileUid={profile.uid}
                    onPress={() => onOpenEvent(event.id)}
                    onQuickBook={() => onOpenEvent(event.id)}
                  />
                </InteractiveListItem>
              ))}
            </View>
          ) : null}

          {allSeatOffers.length > 0 ? (
            <View style={styles.sectionBlock}>
              <CoachText variant="caption" accent style={styles.coachSectionLabel}>
                {t('coach.portal.carpool.availableSeats')}
              </CoachText>
              {visibleSeatOffers.map((item, index) => renderSeatOffer(item, index))}
              {allSeatOffers.length > COACH_SEAT_CAP && !showAllSeats ? (
                <PressableSpring
                  onPress={() => setShowAllSeats(true)}
                  scaleTo={0.97}
                  haptic
                  style={styles.coachSeeAll}
                >
                  <CoachText variant="caption" accent>
                    {t('coach.portal.carpool.seeAllSeats', { n: allSeatOffers.length })}
                  </CoachText>
                </PressableSpring>
              ) : null}
            </View>
          ) : null}

          {needsRideEvents.length === 0 && allSeatOffers.length === 0 ? (
            <CarpoolEmptyState
              icon="car"
              title={t('carpool.reserve.empty.title')}
              subtitle={t('carpool.reserve.empty.subtitle')}
              ctaLabel={t('carpool.cta.proposeTrip')}
              onCta={() => setHubMode('drive')}
            />
          ) : null}

          <PressableSpring
            onPress={() => setRideFiltersOpen((prev) => !prev)}
            scaleTo={0.97}
            haptic
            style={styles.coachFilterToggle}
          >
            <Icon
              name={rideFiltersOpen ? 'chevron-up' : 'tune'}
              size={16}
              color={coachTokens.accent}
            />
            <CoachText variant="caption" accent>
              {t('coach.portal.carpool.filterToggle')}
            </CoachText>
          </PressableSpring>
          {rideFiltersOpen ? renderRideFilters() : null}
        </>
      ) : (
        <>
          {renderRideFilters()}

          {sortedAvailableRides.length === 0 &&
          bookableStandalone.length === 0 &&
          needsRideEvents.length === 0 ? (
            <CarpoolEmptyState
              icon="car"
              title={t('carpool.reserve.empty.title')}
              subtitle={t('carpool.reserve.empty.subtitle')}
              ctaLabel={t('carpool.cta.proposeTrip')}
              onCta={() => setHubMode('drive')}
            />
          ) : (
            <>
              {bookableStandalone.map((offer, index) => (
                <InteractiveListItem key={`solo-${offer.id}`} index={index}>
                  <StandaloneCarpoolRideCard
                    offer={offer}
                    profile={profile}
                    driverHistory={standaloneAllOffers}
                    onUpdated={onRefresh}
                    compact
                  />
                </InteractiveListItem>
              ))}
              {sortedAvailableRides.map(({ event, slot }, index) => {
                const rec = findCarpoolRec(carpoolRecs, event.id, slot.driver_uid);
                const trip = summarizeCarpoolTrip({
                  userLocation: profile.location,
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
                      compact
                    />
                  </InteractiveListItem>
                );
              })}
              {needsRideEvents.length > 0 ? (
                <View style={styles.sectionBlock}>
                  <Text style={styles.sectionLabel}>{t('carpool.hub.eventsWithoutRide')}</Text>
                  {needsRideEvents.slice(0, 4).map((event, index) => (
                    <InteractiveListItem key={`need-${event.id}`} index={index}>
                      <CarpoolEventCard
                        event={event}
                        profileUid={profile.uid}
                        onPress={() => onOpenEvent(event.id)}
                        onQuickBook={() => onOpenEvent(event.id)}
                      />
                    </InteractiveListItem>
                  ))}
                </View>
              ) : null}
            </>
          )}
        </>
      )}
    </ScrollView>
  );

  const renderDrive = () => (
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
      coachShell={coachShell}
    />
  );

  const renderTrips = () => (
    <ScrollView contentContainerStyle={pagePad} refreshControl={refreshControl} {...scrollProps}>
      {coachShell ? null : (
        <>
          <Text style={styles.modeTitle}>{t('carpool.hub.tripsTitle')}</Text>
          <Text style={styles.modeSupport}>{t('carpool.hub.tripsSupport')}</Text>
        </>
      )}

      {profile && activeTrips.length > 0 ? (
        <View style={styles.liveBlock}>
          {coachShell ? (
            <CoachText variant="caption" accent style={styles.coachSectionLabel}>
              {t('carpool.hub.activeSection', { n: activeTrips.length })}
            </CoachText>
          ) : (
            <Text style={styles.sectionLabelAccent}>
              {t('carpool.hub.activeSection', { n: activeTrips.length })}
            </Text>
          )}
          {activeTrips.map((ref) => (
            <CarpoolLiveMission key={ref.tripId} {...liveMissionProps(ref)} />
          ))}
        </View>
      ) : null}

      {!profile ? (
        <CarpoolEmptyState
          icon="person"
          title={t('common.guest.loginTitle')}
          subtitle={t('carpool.guest.body')}
          ctaLabel={t('common.login')}
          onCta={onLoginRequired}
        />
      ) : loading ? (
        <SkeletonList count={3} variant="card" />
      ) : myTrips.length === 0 && myStandaloneTrips.length === 0 && activeTrips.length === 0 ? (
        <CarpoolEmptyState
          icon="car"
          title={t('carpool.trips.empty.title')}
          subtitle={t('carpool.trips.empty.subtitle')}
          ctaLabel={t('carpool.cta.viewSeats')}
          onCta={() => setHubMode('ride')}
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
                profile={profile}
                driverHistory={standaloneAllOffers}
                onUpdated={onRefresh}
                compact
              />
            </InteractiveListItem>
          ))}
          {myTrips.map((event, index) => (
            <InteractiveListItem key={event.id} index={myStandaloneTrips.length + index}>
              <CarpoolEventCard
                event={event}
                profileUid={profile.uid}
                onPress={() => onOpenEvent(event.id)}
              />
            </InteractiveListItem>
          ))}
        </>
      )}

      {profile ? (
        <View style={styles.sectionBlock}>
          {coachShell ? (
            <CoachText variant="caption" accent style={styles.coachSectionLabel}>
              {t('carpool.hub.teamBalance')}
            </CoachText>
          ) : (
            <Text style={styles.sectionLabel}>{t('carpool.hub.teamBalance')}</Text>
          )}
          <CarpoolBalancePanel events={upcoming} onPropose={() => setHubMode('drive')} />
        </View>
      ) : null}
    </ScrollView>
  );

  return (
    <View style={[styles.root, coachShell && { backgroundColor: coachTokens.bg }]}>
      {coachShell || joueurShell ? null : <CarpoolSpaceBackground />}
      <View style={styles.foreground}>
        {coachShell ? (
          <CoachPane title={getCoachPageIdentity('carpool').title}>
            <View style={styles.coachHeader}>
              <CoachText variant="caption" muted>
                {t('coach.portal.carpool.subtitle')}
              </CoachText>
              <CoachCarpoolModeBar
                mode={mode}
                onChange={setHubMode}
                liveActive={hasLiveTrip}
                badges={badges}
              />
              <CoachCarpoolReminder
                count={reminderEvents.length}
                onPress={() => setHubMode('ride')}
              />
            </View>
            <View style={styles.body}>
              <CrossfadeSwitch switchKey={mode}>
                {mode === 'ride' ? renderRide() : null}
                {mode === 'drive' ? renderDrive() : null}
                {mode === 'trips' ? renderTrips() : null}
              </CrossfadeSwitch>
            </View>
          </CoachPane>
        ) : (
          <>
            <CarpoolHubChrome
              subtitle={subtitle}
              mode={mode}
              onModeChange={setHubMode}
              liveActive={hasLiveTrip}
              badges={badges}
              reminderCount={reminderEvents.length}
              onReminderPress={() => setHubMode('ride')}
              hideHero={hideHero}
            />
            <View style={styles.body}>
              <CrossfadeSwitch switchKey={mode}>
                {mode === 'ride' ? renderRide() : null}
                {mode === 'drive' ? renderDrive() : null}
                {mode === 'trips' ? renderTrips() : null}
              </CrossfadeSwitch>
            </View>
          </>
        )}
      </View>
    </View>
  );
};

function createStyles(palette: CarpoolUiPalette) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: palette.bg },
    foreground: { flex: 1, zIndex: 1 },
    body: { flex: 1, minHeight: 0, backgroundColor: 'transparent' },
      uberSearchBlock: {
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  uberSearchTitle: {
    fontSize: 22,
    fontWeight: "800",
    marginBottom: spacing.md,
  },
  uberInputRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    height: 48,
    borderRadius: radius.md,
    marginBottom: spacing.md,
  },
  uberInput: {
    flex: 1,
    marginLeft: spacing.sm,
    fontSize: 16,
  },
  uberQuickChips: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  uberChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  uberChipText: {
    fontSize: 12,
    fontWeight: "600",
  },
  modeTitle: {
      fontFamily: CARPOOL_SITE.display,
      fontSize: 26,
      lineHeight: 30,
      fontWeight: '800',
      color: palette.ink,
      letterSpacing: -0.5,
    },
    modeSupport: {
      fontSize: 14,
      lineHeight: 20,
      color: palette.inkMuted,
      marginBottom: spacing.sm,
    },
    sectionBlock: { gap: spacing.sm, marginTop: spacing.md },
    sectionLabel: {
      fontFamily: CARPOOL_SITE.display,
      fontWeight: '800',
      textTransform: 'uppercase',
      letterSpacing: 1,
      fontSize: 11,
      color: palette.inkDim,
    },
    sectionLabelAccent: {
      fontFamily: CARPOOL_SITE.display,
      fontWeight: '800',
      textTransform: 'uppercase',
      letterSpacing: 1,
      fontSize: 11,
      color: palette.signalDeep,
    },
    liveBlock: { gap: spacing.sm, marginBottom: spacing.sm },
    search: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      borderWidth: 1.5,
      borderColor: palette.fog,
      backgroundColor: palette.surface,
      borderRadius: 14,
      paddingHorizontal: spacing.md,
      minHeight: 48,
    },
    searchInput: {
      flex: 1,
      fontSize: 15,
      color: palette.ink,
      paddingVertical: spacing.sm,
    },
    coachHeader: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.sm,
      gap: spacing.sm,
    },
    coachSectionLabel: {
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 0.8,
      textTransform: 'uppercase',
      marginBottom: spacing.xs,
    },
    coachFilterToggle: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      alignSelf: 'flex-start',
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      borderRadius: radius.pill,
      marginTop: spacing.sm,
    },
    coachSeeAll: {
      alignItems: 'center',
      paddingVertical: spacing.sm,
      marginTop: spacing.xs,
    },
  });
}
