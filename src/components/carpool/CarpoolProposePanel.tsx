import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, ActivityIndicator, RefreshControl, View } from 'react-native';
import type { User } from '../../models/User';
import type { TeamEvent } from '../../models/TeamEvent';
import type { StandaloneCarpoolOffer } from '../../models/StandaloneCarpoolOffer';
import {
  carpoolEventSummaryForUser,
  isCarpoolDriver,
} from '../../utils/carpoolBalance';
import { ProDayText } from '../ui/ProDayText';
import { CarpoolEmptyState, CarpoolSectionIntro } from './carpoolUi';
import { CarpoolProposeCard } from './CarpoolProposeCard';
import { StandaloneCarpoolForm } from './StandaloneCarpoolForm';
import { isUpcomingStandaloneOffer } from '../../utils/standaloneCarpool';
import { useTranslation } from '../../context/LocaleContext';
import { spacing } from '../../theme/designTokens';
import { CARPOOL_SITE } from '../../content/carpoolSite';

interface CarpoolProposePanelProps {
  profile: User | null;
  events: TeamEvent[];
  standaloneOffers: StandaloneCarpoolOffer[];
  loading: boolean;
  standaloneLoading?: boolean;
  refreshing: boolean;
  onRefresh: () => void;
  onOpenEvent: (eventId: string) => void;
  scrollProps: Record<string, unknown>;
  pagePad: { paddingHorizontal: number; paddingBottom: number };
  onLoginRequired?: () => void;
}

function canParticipateInCarpool(event: TeamEvent, uid: string): boolean {
  return event.organizer_uid === uid || event.invitee_uids.includes(uid);
}

export const CarpoolProposePanel: React.FC<CarpoolProposePanelProps> = ({
  profile,
  events,
  standaloneOffers,
  loading,
  standaloneLoading = false,
  refreshing,
  onRefresh,
  onOpenEvent,
  scrollProps,
  pagePad,
  onLoginRequired,
}) => {
  const { t } = useTranslation();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [standaloneExpanded, setStandaloneExpanded] = useState<string | 'new' | null>('new');

  const upcoming = useMemo(() => {
    const now = Date.now() - 6 * 60 * 60 * 1000;
    return events
      .filter((e) => e.starts_at.getTime() >= now)
      .sort((a, b) => a.starts_at.getTime() - b.starts_at.getTime());
  }, [events]);

  const proposeEvents = useMemo(() => {
    if (!profile) return [];
    return upcoming.filter((event) => canParticipateInCarpool(event, profile.uid));
  }, [upcoming, profile]);

  const newProposals = useMemo(
    () => proposeEvents.filter((e) => !isCarpoolDriver(e, profile?.uid ?? '')),
    [proposeEvents, profile?.uid]
  );

  const activeOffers = useMemo(
    () => proposeEvents.filter((e) => isCarpoolDriver(e, profile?.uid ?? '')),
    [proposeEvents, profile?.uid]
  );

  const bookedElsewhere = profile
    ? proposeEvents.filter((e) => {
        const s = carpoolEventSummaryForUser(e, profile.uid);
        return s.myBookingDriverUid && !s.isDriver;
      }).length
    : 0;

  const activeStandalone = useMemo(
    () =>
      standaloneOffers.filter(
        (o) => o.driver_uid === profile?.uid && isUpcomingStandaloneOffer(o)
      ),
    [standaloneOffers, profile?.uid]
  );

  const toggleExpanded = (eventId: string) => {
    setExpandedId((prev) => (prev === eventId ? null : eventId));
  };

  if (!profile) {
    return (
      <ScrollView contentContainerStyle={pagePad} {...scrollProps}>
        <CarpoolEmptyState
          icon="car"
          title={t('carpool.login.title')}
        subtitle={t('carpool.propose.convocationsSub')}
          ctaLabel={t('carpool.login.cta')}
          onCta={onLoginRequired}
        />
      </ScrollView>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={pagePad}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={CARPOOL_SITE.signal} />
      }
      {...scrollProps}
    >
      <CarpoolSectionIntro
        icon="add"
        title={t('carpool.hub.driveTitle')}
        subtitle={t('carpool.hub.driveSupport')}
      />

      {standaloneLoading ? (
        <ActivityIndicator color={CARPOOL_SITE.signal} style={styles.loader} />
      ) : (
        <>
          <ProDayText variant="section" style={styles.sectionTitle}>
            {t('carpool.propose.freeTrips')}
          </ProDayText>
          <StandaloneCarpoolForm
            profile={profile}
            offer={null}
            expanded={standaloneExpanded === 'new'}
            onToggle={() =>
              setStandaloneExpanded((prev) => (prev === 'new' ? null : 'new'))
            }
            onSaved={onRefresh}
          />
          {activeStandalone.map((offer) => (
            <StandaloneCarpoolForm
              key={offer.id}
              profile={profile}
              offer={offer}
              expanded={standaloneExpanded === offer.id}
              onToggle={() =>
                setStandaloneExpanded((prev) => (prev === offer.id ? null : offer.id))
              }
              onSaved={onRefresh}
            />
          ))}
        </>
      )}

      <ProDayText variant="section" style={styles.sectionTitle}>
        {t('carpool.propose.onConvocations')}
      </ProDayText>

      {bookedElsewhere > 0 ? (
        <View style={styles.hint}>
          <ProDayText variant="caption" style={styles.hintText}>
            {t('carpool.propose.bookedElsewhere', { n: bookedElsewhere })}
          </ProDayText>
        </View>
      ) : null}

      {loading ? (
        <ActivityIndicator color={CARPOOL_SITE.signal} style={styles.loader} />
      ) : proposeEvents.length === 0 ? (
        <CarpoolEmptyState
          icon="calendar"
          title={t('carpool.propose.noConvocation')}
          subtitle={t('carpool.propose.noMatchSub')}
        />
      ) : (
        <>
          {activeOffers.length > 0 ? (
            <>
              <ProDayText variant="section" style={styles.sectionTitle}>
                {t('carpool.propose.publishedTrips', { n: activeOffers.length })}
              </ProDayText>
              {activeOffers.map((event) => (
                <CarpoolProposeCard
                  key={event.id}
                  event={event}
                  profile={profile}
                  expanded={expandedId === event.id}
                  onToggle={() => toggleExpanded(event.id)}
                  onPublished={onRefresh}
                  onOpenDetail={() => onOpenEvent(event.id)}
                />
              ))}
            </>
          ) : null}

          {newProposals.length > 0 ? (
            <>
              <ProDayText variant="section" style={styles.sectionTitle}>
                {t('carpool.propose.upcoming', {
                  label: t(
                    activeOffers.length > 0
                      ? 'carpool.propose.upcomingNew'
                      : 'carpool.propose.upcomingEvents'
                  ),
                  n: newProposals.length,
                })}
              </ProDayText>
              {newProposals.map((event) => (
                <CarpoolProposeCard
                  key={event.id}
                  event={event}
                  profile={profile}
                  expanded={expandedId === event.id}
                  onToggle={() => toggleExpanded(event.id)}
                  onPublished={onRefresh}
                  onOpenDetail={() => onOpenEvent(event.id)}
                />
              ))}
            </>
          ) : activeOffers.length === 0 ? (
            <CarpoolEmptyState
              icon="car"
              title={t('carpool.propose.empty.title')}
              subtitle={t('carpool.propose.empty.subtitle')}
            />
          ) : null}
        </>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  hint: {
    padding: spacing.md,
    marginBottom: spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: CARPOOL_SITE.signal,
    backgroundColor: CARPOOL_SITE.signalSoft,
  },
  hintText: { color: CARPOOL_SITE.ink, fontWeight: '700' },
  sectionTitle: {
    marginBottom: spacing.sm,
    marginTop: spacing.xs,
    color: CARPOOL_SITE.ink,
    fontFamily: CARPOOL_SITE.display,
  },
  loader: { marginVertical: spacing.xl },
});
