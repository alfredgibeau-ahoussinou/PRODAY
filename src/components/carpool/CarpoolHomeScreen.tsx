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
import {
  type CarpoolChapterId,
  type CarpoolEventFilter,
  type CarpoolScopeFilter,
} from '../../content/carpoolChapters';
import { getCarpoolChapters, getCarpoolEventFilters, getCarpoolScopeFilters } from '../../i18n/localizedChapters';
import {
  carpoolAvailableSeats,
  carpoolEventSummaryForUser,
  findCarpoolBooking,
  matchesCarpoolScopeFilter,
} from '../../utils/carpoolBalance';
import { ProDayText } from '../ui/ProDayText';
import { SearchBar } from '../ui/SearchBar';
import { ProDayTabPager } from '../ui/ProDayTabPager';
import { CarpoolEventCard } from './CarpoolEventCard';
import { CarpoolRideCard } from './CarpoolRideCard';
import { CarpoolBalancePanel } from './CarpoolBalancePanel';
import { CarpoolProposePanel } from './CarpoolProposePanel';
import { StandaloneCarpoolRideCard } from './StandaloneCarpoolRideCard';
import {
  CarpoolEmptyState,
  CarpoolFilterChips,
  CarpoolReminderBanner,
  CarpoolSectionIntro,
} from './carpoolUi';
import {
  isStandalonePassenger,
  isUpcomingStandaloneOffer,
  isPastStandaloneOffer,
  standaloneAvailableSeats,
  filterStandaloneOffers,
  sortStandaloneByProximity,
} from '../../utils/standaloneCarpool';
import { useAppTheme } from '../../context/ProductLineContext';
import { useTranslation } from '../../context/LocaleContext';
import { TAB_BAR_CONTENT_INSET } from '../../navigation/tabBarLayout';
import { SkeletonList, InteractiveListItem, PressableSpring } from '../motion';
import { spacing } from '../../theme/designTokens';
import { ProDayScreenCanvas } from '../ui/ProDayScreenCanvas';
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
  paddingBottom: TAB_BAR_CONTENT_INSET + spacing.sm,
};

type RideOffer = { event: TeamEvent; slot: CarpoolSlot };

export const CarpoolHomeScreen: React.FC<CarpoolHomeScreenProps> = ({
  profile,
  events,
  standaloneOffers,
  standaloneAllOffers = [],
  standaloneLoading = false,
  loading,
  initialChapter = 'evenements',
  onOpenEvent,
  onRefresh,
  onLoginRequired,
}) => {
  const { colors } = useAppTheme();
  const { t } = useTranslation();
  const chapters = useMemo(() => getCarpoolChapters(t), [t]);
  const eventFilters = useMemo(() => getCarpoolEventFilters(t), [t]);
  const scopeFilters = useMemo(() => getCarpoolScopeFilters(t), [t]);
  const reserveScopeFilters = useMemo(
    () => [
      { id: 'all' as const, label: t('carpool.reserve.filter.all') },
      { id: 'club' as const, label: t('carpool.reserve.filter.club') },
    ],
    [t]
  );
  const tripsTabFilters = useMemo(
    () => [
      { id: 'upcoming' as const, label: t('carpool.trips.tab.upcoming') },
      { id: 'past' as const, label: t('carpool.trips.tab.past') },
    ],
    [t]
  );
  const [chapter, setChapter] = useState<CarpoolChapterId>(initialChapter);

  useEffect(() => {
    setChapter(initialChapter);
  }, [initialChapter]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<CarpoolEventFilter>('all');
  const [scope, setScope] = useState<CarpoolScopeFilter>('all');
  const [standaloneCity, setStandaloneCity] = useState('');
  const [standaloneClubOnly, setStandaloneClubOnly] = useState(false);
  const [myTripsTab, setMyTripsTab] = useState<'upcoming' | 'past'>('upcoming');
  const [refreshing, setRefreshing] = useState(false);

  // Le hub (Passager / Conducteur / Live) reflète le chapitre actif et le pilote,
  // sans écraser le chapitre initial au montage.
  const hubMode: CarpoolHubMode =
    chapter === 'proposer'
      ? 'drive'
      : chapter === 'mes_trajets' || chapter === 'equipe'
        ? 'live'
        : 'ride';

  const setHubMode = useCallback((mode: CarpoolHubMode) => {
    if (mode === 'ride') setChapter('reserver');
    else if (mode === 'drive') setChapter('proposer');
    else setChapter('mes_trajets');
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

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const uid = profile?.uid ?? '';
    return upcoming.filter((event) => {
      if (!matchesCarpoolScopeFilter(event, scope)) return false;
      if (q) {
        const hay = [event.title, event.city, event.location_label, event.organizer_name]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (!uid || filter === 'all') return true;
      const s = carpoolEventSummaryForUser(event, uid);
      if (filter === 'offering') return s.isDriver;
      if (filter === 'booked') return Boolean(s.myBookingDriverUid);
      if (filter === 'needs_ride') return !s.isDriver && !s.myBookingDriverUid;
      return true;
    });
  }, [upcoming, search, filter, scope, profile?.uid]);

  const myTrips = useMemo(() => {
    if (!profile) return [];
    return upcoming.filter((event) => {
      const s = carpoolEventSummaryForUser(event, profile.uid);
      return s.isDriver || Boolean(s.myBookingDriverUid);
    });
  }, [upcoming, profile]);

  const upcomingStandalone = useMemo(
    () => standaloneOffers.filter(isUpcomingStandaloneOffer),
    [standaloneOffers]
  );

  const bookableStandalone = useMemo(() => {
    if (!profile) return [];
    const filtered = filterStandaloneOffers(upcomingStandalone, {
      city: standaloneCity,
      clubOnly: standaloneClubOnly,
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
  }, [upcomingStandalone, profile, standaloneCity, standaloneClubOnly]);

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
      if (!matchesCarpoolScopeFilter(event, scope)) continue;
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
  }, [upcoming, profile, scope]);

  const carpoolRecs = useMemo(
    () =>
      buildCarpoolRideRecommendations({
        userLocation: profile?.location,
        rides: availableRides,
      }),
    [availableRides, profile?.location]
  );

  const sortedAvailableRides = useMemo(
    () => sortCarpoolRides(availableRides, carpoolRecs, Boolean(profile)),
    [availableRides, carpoolRecs, profile]
  );

  const needsRideCount = profile
    ? upcoming.filter((e) => {
        const s = carpoolEventSummaryForUser(e, profile.uid);
        return !s.isDriver && !s.myBookingDriverUid;
      }).length
    : 0;

  const activeStandaloneCount = profile
    ? standaloneOffers.filter(
        (o) => o.driver_uid === profile.uid && isUpcomingStandaloneOffer(o)
      ).length
    : 0;

  const newProposalsCount = profile
    ? upcoming.filter((e) => {
        const canJoin =
          e.organizer_uid === profile.uid || e.invitee_uids.includes(profile.uid);
        return canJoin && !carpoolEventSummaryForUser(e, profile.uid).isDriver;
      }).length
    : 0;
  const reminderEvents = useMemo(() => {
    if (!profile) return [];
    const horizon = Date.now() + 24 * 60 * 60 * 1000;
    return upcoming.filter((event) => {
      const t = event.starts_at.getTime();
      if (t < Date.now() || t > horizon) return false;
      const s = carpoolEventSummaryForUser(event, profile.uid);
      return !s.isDriver && !s.myBookingDriverUid;
    });
  }, [upcoming, profile]);

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

  const openReserveTab = () => {
    setHubMode('ride');
    setChapter('reserver');
  };
  const openProposerTab = () => {
    setHubMode('drive');
    setChapter('proposer');
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

  const pages = useMemo(
    () => [
      {
        id: 'evenements' as const,
        render: () => (
          <ScrollView
            contentContainerStyle={pagePad}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.accent} />
            }
            {...scrollProps}
          >
            <SearchBar
              placeholder={t('carpool.events.search')}
              value={search}
              onChangeText={setSearch}
              embedded
            />
            <CarpoolFilterChips
              options={scopeFilters}
              value={scope}
              onChange={setScope}
            />
            <CarpoolFilterChips
              options={eventFilters}
              value={filter}
              onChange={setFilter}
            />
            {loading ? (
              <SkeletonList count={4} variant="card" />
            ) : filtered.length === 0 ? (
              <CarpoolEmptyState
                icon="calendar"
                title={t('carpool.events.empty.title')}
                subtitle={
                  !profile
                    ? t('carpool.guest.body')
                    : 'Vos convocations apparaîtront ici pour organiser les trajets.'
                }
                ctaLabel={!profile && onLoginRequired ? t('common.login') : undefined}
                onCta={onLoginRequired}
              />
            ) : (
              filtered.map((event, index) => (
                <InteractiveListItem key={event.id} index={index}>
                  <CarpoolEventCard
                    event={event}
                    profileUid={profile?.uid ?? ''}
                    onPress={() => onOpenEvent(event.id)}
                    onQuickBook={() => {
                      onOpenEvent(event.id);
                      openReserveTab();
                    }}
                  />
                </InteractiveListItem>
              ))
            )}
          </ScrollView>
        ),
      },
      {
        id: 'reserver' as const,
        render: () => (
          <ScrollView
            contentContainerStyle={pagePad}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.accent} />
            }
            {...scrollProps}
          >
            <CarpoolSectionIntro
              icon="car"
              title={t('carpool.reserve.intro.title')}
              subtitle={t('carpool.reserve.intro.subtitle')}
            />

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
                onCta={openProposerTab}
              />
            ) : (
              <>
                <SearchBar
                  value={standaloneCity}
                  onChangeText={setStandaloneCity}
                  placeholder={t('carpool.reserve.filter.city')}
                  embedded
                />
                <CarpoolFilterChips
                  options={scopeFilters}
                  value={scope}
                  onChange={setScope}
                />
                <CarpoolFilterChips
                  options={reserveScopeFilters}
                  value={standaloneClubOnly ? 'club' : 'all'}
                  onChange={(id) => setStandaloneClubOnly(id === 'club')}
                />
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
                <InteractiveListItem key={`${event.id}-${slot.driver_uid}`} index={bookableStandalone.length + index}>
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
        id: 'proposer' as const,
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
        id: 'mes_trajets' as const,
        render: () => (
          <ScrollView
            contentContainerStyle={pagePad}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.accent} />
            }
            {...scrollProps}
          >
            {loading ? (
              <SkeletonList count={3} variant="card" />
            ) : myTrips.length === 0 && myStandaloneTrips.length === 0 ? (
              <CarpoolEmptyState
                icon="car"
                title={t('carpool.trips.empty.title')}
                subtitle={t('carpool.trips.empty.subtitle')}
                ctaLabel={t('carpool.cta.viewSeats')}
                onCta={openReserveTab}
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
      {
        id: 'equipe' as const,
        render: () => (
          <ScrollView
            contentContainerStyle={pagePad}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.accent} />
            }
            {...scrollProps}
          >
            <CarpoolBalancePanel events={upcoming} onPropose={openProposerTab} />
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
      filtered,
      myTrips,
      myStandaloneTrips,
      bookableStandalone,
      availableRides,
      profile,
      search,
      filter,
      scope,
      refreshing,
      upcoming,
      onOpenEvent,
      onRefresh,
      events,
      sortedAvailableRides,
      carpoolRecs,
      onLoginRequired,
      scrollProps,
      pagePad,
      openReserveTab,
      openProposerTab,
      t,
      chapters,
      eventFilters,
      scopeFilters,
      reserveScopeFilters,
      tripsTabFilters,
    ]
  );

  const subtitle =
    profile?.role === 'player' ? t('carpool.subtitle.player') : t('carpool.subtitle.staff');

  const body = (
    <>
      <View style={styles.hub}>
        <CarpoolModeSwitcher mode={hubMode} onChange={setHubMode} liveActive={hasLiveTrip} />
        {profile && activeTrips.length > 0 ? (
          <View style={styles.liveHero}>
            <ProDayText variant="caption" accent style={styles.liveHeroLabel}>
              {t('carpool.hub.activeSection', { n: activeTrips.length })}
            </ProDayText>
            {activeTrips.slice(0, 2).map((ref) => (
              <CarpoolLiveMission key={ref.tripId} {...liveMissionProps(ref)} compact />
            ))}
          </View>
        ) : null}
      </View>

      {reminderEvents.length > 0 ? (
        <CarpoolReminderBanner
          count={reminderEvents.length}
          onReserve={openReserveTab}
          onPropose={openProposerTab}
        />
      ) : null}

      <ProDayTabPager
        chapters={chapters}
        pages={pages}
        activeChapter={chapter}
        onChapterChange={setChapter}
        variant="pills"
        badges={{
          reserver:
            availableRides.length + bookableStandalone.length > 0
              ? availableRides.length + bookableStandalone.length
              : needsRideCount > 0
                ? needsRideCount
                : undefined,
          proposer:
            newProposalsCount > 0 || activeStandaloneCount > 0
              ? newProposalsCount + activeStandaloneCount
              : undefined,
          mes_trajets:
            myTrips.length + myStandaloneTrips.length > 0
              ? myTrips.length + myStandaloneTrips.length
              : undefined,
        }}
      />
    </>
  );

  return (
    <ProDayScreenCanvas flat>
      <View style={styles.root}>
        <CarpoolHero
          eyebrow={t('carpool.caption')}
          headline={t('carpool.hero.member.headline')}
          support={subtitle}
          minHeight={216}
          compact
          actions={[
            { label: t('carpool.cta.viewSeats'), icon: 'car', onPress: openReserveTab },
            { label: t('carpool.cta.proposeTrip'), tone: 'ghost', onPress: openProposerTab },
          ]}
        />
        <View style={styles.body}>{body}</View>
      </View>
    </ProDayScreenCanvas>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  body: { flex: 1, minHeight: 0 },
  hub: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  liveHero: { gap: spacing.sm },
  liveHeroLabel: { fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  deckBleed: { marginHorizontal: -spacing.lg, marginBottom: spacing.sm },
});
