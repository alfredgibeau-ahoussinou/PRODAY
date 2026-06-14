import React, { useEffect, useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  RefreshControl,
  View,
} from 'react-native';
import type { User } from '../../models/User';
import type { TeamEvent, CarpoolSlot } from '../../models/TeamEvent';
import {
  CARPOOL_CHAPTERS,
  CARPOOL_EVENT_FILTERS,
  type CarpoolChapterId,
  type CarpoolEventFilter,
} from '../../content/carpoolChapters';
import {
  carpoolAvailableSeats,
  carpoolEventSummaryForUser,
  findCarpoolBooking,
} from '../../utils/carpoolBalance';
import { AppTabHeader, AppStatChips } from '../app';
import { ProDayGradient } from '../ui/ProDayGradient';
import { ProDaySurface } from '../ui/ProDaySurface';
import { ProDayText } from '../ui/ProDayText';
import { SearchBar } from '../ui/SearchBar';
import { Icon } from '../ui/Icon';
import { ProDayTabPager } from '../ui/ProDayTabPager';
import { CarpoolEventCard } from './CarpoolEventCard';
import { CarpoolRideCard } from './CarpoolRideCard';
import { CarpoolBalancePanel } from './CarpoolBalancePanel';
import { CarpoolProposePanel } from './CarpoolProposePanel';
import { useAppTheme } from '../../context/ProductLineContext';
import { ProDayActionTiles } from '../ui/ProDayActionTiles';
import { ProDaySelect } from '../ui/ProDaySelect';
import { TAB_BAR_CONTENT_INSET } from '../../navigation/tabBarLayout';
import { PressableSpring, SkeletonList, InteractiveListItem } from '../motion';
import { spacing, radius } from '../../theme/designTokens';
import { V3TabShell } from '../v3/V3TabShell';
import { isV3ShellEnabled } from '../../config/featureFlags';
import { useSectionIntelligence } from '../../hooks/useSectionIntelligence';
import {
  buildCarpoolRideRecommendations,
  sortCarpoolRides,
  findCarpoolRec,
  summarizeCarpoolTrip,
} from '../../features/v3/engines/carpoolGeo.engine';

interface CarpoolHomeScreenProps {
  profile: User | null;
  events: TeamEvent[];
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
  loading,
  initialChapter = 'evenements',
  onOpenEvent,
  onRefresh,
  onLoginRequired,
}) => {
  const { colors, productLine } = useAppTheme();
  const useV3Header = isV3ShellEnabled() && Boolean(profile);
  const [chapter, setChapter] = useState<CarpoolChapterId>(initialChapter);

  useEffect(() => {
    setChapter(initialChapter);
  }, [initialChapter]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<CarpoolEventFilter>('all');
  const [refreshing, setRefreshing] = useState(false);

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
  }, [upcoming, search, filter, profile?.uid]);

  const myTrips = useMemo(() => {
    if (!profile) return [];
    return upcoming.filter((event) => {
      const s = carpoolEventSummaryForUser(event, profile.uid);
      return s.isDriver || Boolean(s.myBookingDriverUid);
    });
  }, [upcoming, profile]);

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
    [availableRides, profile?.location]
  );

  const sortedAvailableRides = useMemo(
    () => sortCarpoolRides(availableRides, carpoolRecs, useV3Header),
    [availableRides, carpoolRecs, useV3Header]
  );

  const intelligence = useSectionIntelligence('covoiturage', profile, productLine, {
    availableRides: availableRides.length,
  });

  const needsRideCount = profile
    ? upcoming.filter((e) => {
        const s = carpoolEventSummaryForUser(e, profile.uid);
        return !s.isDriver && !s.myBookingDriverUid;
      }).length
    : 0;

  const offeringCount = profile
    ? upcoming.filter((e) => carpoolEventSummaryForUser(e, profile.uid).isDriver).length
    : 0;

  const newProposalsCount = profile
    ? upcoming.filter((e) => {
        const canJoin =
          e.organizer_uid === profile.uid || e.invitee_uids.includes(profile.uid);
        return canJoin && !carpoolEventSummaryForUser(e, profile.uid).isDriver;
      }).length
    : 0;
  const bookedCount = profile
    ? upcoming.filter((e) =>
        Boolean(carpoolEventSummaryForUser(e, profile.uid).myBookingDriverUid)
      ).length
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

  const openReserveTab = () => setChapter('reserver');
  const openProposerTab = () => setChapter('proposer');

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
            <SearchBar placeholder="Rechercher un événement…" value={search} onChangeText={setSearch} />
            <ProDaySelect<CarpoolEventFilter>
              label="Filtrer les événements"
              placeholder="Tout"
              options={CARPOOL_EVENT_FILTERS.map((f) => ({ id: f.id, label: f.label }))}
              value={filter}
              onChange={setFilter}
              inset={false}
            />
            {loading ? (
              <SkeletonList count={4} variant="card" />
            ) : filtered.length === 0 ? (
              <ProDaySurface variant="module" style={styles.empty}>
                <Icon name="calendar" size={32} color={colors.textMuted} />
                <ProDayText variant="section">Aucun événement</ProDayText>
                <ProDayText variant="body" muted style={styles.emptySub}>
                  {!profile
                    ? 'Connectez-vous pour voir vos convocations et organiser les trajets.'
                    : 'Vos convocations apparaîtront ici pour organiser les trajets.'}
                </ProDayText>
                {!profile && onLoginRequired ? (
                  <PressableSpring onPress={onLoginRequired} scaleTo={0.97} haptic>
                    <ProDayGradient kind="cta" style={styles.cta}>
                      <ProDayText variant="caption" inverse style={styles.ctaText}>
                        Se connecter
                      </ProDayText>
                    </ProDayGradient>
                  </PressableSpring>
                ) : null}
              </ProDaySurface>
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
            <ProDayText variant="eyebrow" accent style={styles.pageLead}>
              Être co-voituré
            </ProDayText>
            <ProDayText variant="body" muted style={styles.pageSub}>
              Réservez une place chez un coéquipier ou votre coach — comme BlaBlaCar en équipe.
            </ProDayText>

            {!profile ? (
              <ProDaySurface variant="module" style={styles.empty}>
                <ProDayText variant="section">Connectez-vous</ProDayText>
                <ProDayText variant="body" muted style={styles.emptySub}>
                  Accédez à vos convocations pour réserver une place.
                </ProDayText>
                {onLoginRequired ? (
                  <PressableSpring onPress={onLoginRequired} scaleTo={0.97} haptic>
                    <ProDayGradient kind="cta" style={styles.cta}>
                      <ProDayText variant="caption" inverse style={styles.ctaText}>
                        Se connecter
                      </ProDayText>
                    </ProDayGradient>
                  </PressableSpring>
                ) : null}
              </ProDaySurface>
            ) : loading ? (
              <SkeletonList count={3} variant="card" />
            ) : availableRides.length === 0 ? (
              <ProDaySurface variant="module" style={styles.empty}>
                <Icon name="car" size={32} color={colors.textMuted} />
                <ProDayText variant="section">Aucun trajet disponible</ProDayText>
                <ProDayText variant="body" muted style={styles.emptySub}>
                  Aucune place libre pour le moment. Proposez votre véhicule ou attendez qu’un conducteur
                  publie des places.
                </ProDayText>
                <PressableSpring onPress={openProposerTab} scaleTo={0.97} haptic>
                  <ProDayGradient kind="cta" style={styles.cta}>
                    <ProDayText variant="caption" inverse style={styles.ctaText}>
                      Proposer un trajet
                    </ProDayText>
                  </ProDayGradient>
                </PressableSpring>
              </ProDaySurface>
            ) : (
              sortedAvailableRides.map(({ event, slot }, index) => {
                const rec = findCarpoolRec(carpoolRecs, event.id, slot.driver_uid);
                const trip = summarizeCarpoolTrip({
                  userLocation: profile?.location,
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
                  />
                </InteractiveListItem>
              );
              })
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
            loading={loading}
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
            ) : myTrips.length === 0 ? (
              <ProDaySurface variant="module" style={styles.empty}>
                <Icon name="car" size={32} color={colors.textMuted} />
                <ProDayText variant="section">Aucun trajet planifié</ProDayText>
                <ProDayText variant="body" muted style={styles.emptySub}>
                  Proposez un véhicule ou réservez une place depuis l&apos;onglet Réserver.
                </ProDayText>
                <PressableSpring onPress={openReserveTab} scaleTo={0.97} haptic>
                  <ProDayGradient kind="cta" style={styles.cta}>
                    <ProDayText variant="caption" inverse style={styles.ctaText}>
                      Voir les places dispo
                    </ProDayText>
                  </ProDayGradient>
                </PressableSpring>
              </ProDaySurface>
            ) : (
              myTrips.map((event, index) => (
                <InteractiveListItem key={event.id} index={index}>
                  <CarpoolEventCard
                    event={event}
                    profileUid={profile?.uid ?? ''}
                    onPress={() => onOpenEvent(event.id)}
                  />
                </InteractiveListItem>
              ))
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
      filtered,
      myTrips,
      availableRides,
      profile,
      search,
      filter,
      refreshing,
      upcoming,
      onOpenEvent,
      onRefresh,
      events,
      sortedAvailableRides,
      useV3Header,
    ]
  );

  const subtitle =
    profile?.role === 'player'
      ? 'Proposez un trajet ou réservez une place pour vos matchs et entraînements.'
      : 'Organisez les trajets de votre groupe — propositions ou assignation.';

  const body = (
    <>
      {reminderEvents.length > 0 ? (
        <ProDaySurface variant="accent" style={[styles.reminder, { borderColor: colors.border }]}>
          <ProDayText variant="caption" accent style={styles.reminderTitle}>
            {reminderEvents.length} événement{reminderEvents.length > 1 ? 's' : ''} demain sans trajet
          </ProDayText>
          <View style={styles.reminderActions}>
            <PressableSpring onPress={openReserveTab} scaleTo={0.97} haptic>
              <ProDayText variant="caption" accent style={styles.reminderCta}>
                Réserver →
              </ProDayText>
            </PressableSpring>
            <PressableSpring onPress={openProposerTab} scaleTo={0.97} haptic>
              <ProDayText variant="caption" accent style={styles.reminderCta}>
                Proposer un trajet →
              </ProDayText>
            </PressableSpring>
          </View>
        </ProDaySurface>
      ) : null}

      <ProDayActionTiles
        items={[
          {
            id: 'reserver',
            label: 'Réserver',
            icon: 'car',
            badge: availableRides.length > 0 ? availableRides.length : undefined,
          },
          {
            id: 'proposer',
            label: 'Proposer',
            icon: 'add',
            badge: offeringCount > 0 ? offeringCount : newProposalsCount || undefined,
          },
          {
            id: 'equipe',
            label: 'Équipe',
            icon: 'people',
          },
        ]}
        onPress={(id) => {
          if (id === 'reserver') openReserveTab();
          else if (id === 'proposer') openProposerTab();
          else if (id === 'equipe') setChapter('equipe');
        }}
      />

      <ProDayTabPager
        chapters={CARPOOL_CHAPTERS}
        pages={pages}
        activeChapter={chapter}
        onChapterChange={setChapter}
        badges={{
          reserver: availableRides.length > 0 ? availableRides.length : needsRideCount > 0 ? needsRideCount : undefined,
          proposer: newProposalsCount > 0 ? newProposalsCount : undefined,
          mes_trajets: myTrips.length > 0 ? myTrips.length : undefined,
        }}
      />
    </>
  );

  if (useV3Header) {
    return (
      <V3TabShell
        title="Covoiturage"
        subtitle={subtitle}
        flat
        intelligence={intelligence}
        stats={[
          { value: upcoming.length, label: 'Événements' },
          {
            value: availableRides.length,
            label: 'Places',
            highlight: availableRides.length > 0,
          },
          { value: bookedCount, label: 'Réservé', highlight: bookedCount > 0 },
        ]}
      >
        {body}
      </V3TabShell>
    );
  }

  return (
    <View style={styles.root}>
      <AppTabHeader
        title="Covoiturage"
        subtitle={subtitle}
        footer={
          <AppStatChips
            items={[
              { value: upcoming.length, label: 'Événements' },
              { value: availableRides.length, label: 'Places', highlight: availableRides.length > 0 },
              { value: bookedCount, label: 'Réservé', highlight: bookedCount > 0 },
            ]}
          />
        }
      />

      {body}
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  reminder: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    padding: spacing.md,
    gap: spacing.xs,
    borderWidth: 1,
  },
  reminderTitle: { fontWeight: '800' },
  reminderActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  reminderCta: { fontWeight: '800' },
  pageLead: { marginBottom: 4 },
  pageSub: { marginBottom: spacing.lg },
  loader: { marginVertical: spacing.xl },
  empty: { alignItems: 'center', padding: spacing.xl, gap: spacing.sm },
  emptySub: { textAlign: 'center' },
  cta: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
  },
  ctaText: { fontWeight: '800' },
});
