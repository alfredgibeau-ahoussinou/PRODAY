import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, ActivityIndicator, RefreshControl, View, Text } from 'react-native';
import type { User } from '../../models/User';
import type { TeamEvent } from '../../models/TeamEvent';
import type { StandaloneCarpoolOffer } from '../../models/StandaloneCarpoolOffer';
import {
  carpoolEventSummaryForUser,
  isCarpoolDriver,
} from '../../utils/carpoolBalance';
import { ProDayText } from '../ui/ProDayText';
import { Icon } from '../ui/Icon';
import { PressableSpring } from '../motion';
import { CarpoolEmptyState } from './carpoolUi';
import { CarpoolProposeCard } from './CarpoolProposeCard';
import { StandaloneCarpoolForm } from './StandaloneCarpoolForm';
import { isUpcomingStandaloneOffer } from '../../utils/standaloneCarpool';
import { useTranslation } from '../../context/LocaleContext';
import { spacing, radius } from '../../theme/designTokens';
import {
  type CarpoolUiPalette,
  useCarpoolThemedStyles,
  useCarpoolUi,
} from './CarpoolUiContext';
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
  coachShell?: boolean;
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
  coachShell = false,
}) => {
  const { t } = useTranslation();
  const palette = useCarpoolUi();
  const styles = useCarpoolThemedStyles(createStyles);
  const [driverTab, setDriverTab] = useState<'convocations' | 'free'>('convocations');
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
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.signal} />
      }
      {...scrollProps}
    >
      {/* COCKPIT CONDUCTEUR HERO */}
      <View style={styles.heroCard}>
        <View style={styles.heroHeader}>
          <View style={[styles.heroIconOrb, { backgroundColor: `${palette.signal}18`, borderColor: `${palette.signal}35` }]}>
            <Icon name="car" size={20} color={palette.signal} />
          </View>
          <View style={styles.heroTitleCol}>
            <Text style={styles.heroTitle}>Espace Conducteur</Text>
            <Text style={styles.heroSub}>
              Emmenez vos coéquipiers aux matchs ou publiez un trajet libre.
            </Text>
          </View>
        </View>

        {/* DRIVER SEGMENTED BAR */}
        <View style={styles.segmentTrack}>
          <PressableSpring
            onPress={() => setDriverTab('convocations')}
            scaleTo={0.97}
            haptic
            style={[
              styles.segmentPill,
              driverTab === 'convocations' && [
                styles.segmentPillActive,
                { borderColor: `${palette.signal}60` },
              ],
            ]}
          >
            <Icon
              name="calendar"
              size={14}
              color={driverTab === 'convocations' ? palette.signal : '#A1A1AA'}
            />
            <Text
              style={[
                styles.segmentText,
                driverTab === 'convocations' && { color: palette.signal, fontWeight: '800' },
              ]}
            >
              Sur Convocations ({proposeEvents.length})
            </Text>
          </PressableSpring>

          <PressableSpring
            onPress={() => setDriverTab('free')}
            scaleTo={0.97}
            haptic
            style={[
              styles.segmentPill,
              driverTab === 'free' && [
                styles.segmentPillActive,
                { borderColor: `${palette.signal}60` },
              ],
            ]}
          >
            <Icon
              name="add"
              size={14}
              color={driverTab === 'free' ? palette.signal : '#A1A1AA'}
            />
            <Text
              style={[
                styles.segmentText,
                driverTab === 'free' && { color: palette.signal, fontWeight: '800' },
              ]}
            >
              Trajet Libre ({activeStandalone.length})
            </Text>
          </PressableSpring>
        </View>
      </View>

      {/* CONTENT BASED ON SELECTED TAB */}
      {driverTab === 'convocations' ? (
        <>
          {loading ? (
            <ActivityIndicator color={palette.signal} style={styles.loader} />
          ) : proposeEvents.length === 0 ? (
            <CarpoolEmptyState
              icon="calendar"
              title="Aucune convocation trouvée"
              subtitle="Vous n'avez pas de match ou entraînement officiel nécessitant un covoiturage pour l'instant. Vous pouvez créer un trajet libre."
              ctaLabel="Créer un trajet libre"
              onCta={() => setDriverTab('free')}
            />
          ) : (
            <>
              {activeOffers.length > 0 ? (
                <View style={styles.sectionWrap}>
                  <Text style={styles.sectionHeader}>
                    VOS TRAJETS PUBLIÉS ({activeOffers.length})
                  </Text>
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
                </View>
              ) : null}

              {newProposals.length > 0 ? (
                <View style={styles.sectionWrap}>
                  <Text style={styles.sectionHeader}>
                    ÉVÉNEMENTS À VENIR ({newProposals.length})
                  </Text>
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
                </View>
              ) : null}
            </>
          )}
        </>
      ) : (
        <>
          {standaloneLoading ? (
            <ActivityIndicator color={palette.signal} style={styles.loader} />
          ) : (
            <View style={styles.sectionWrap}>
              <Text style={styles.sectionHeader}>NOUVEAU TRAJET LIBRE</Text>
              <StandaloneCarpoolForm
                profile={profile}
                offer={null}
                expanded={standaloneExpanded === 'new'}
                onToggle={() =>
                  setStandaloneExpanded((prev) => (prev === 'new' ? null : 'new'))
                }
                onSaved={onRefresh}
              />
              {activeStandalone.length > 0 ? (
                <>
                  <Text style={[styles.sectionHeader, { marginTop: 16 }]}>
                    VOS TRAJETS LIBRES ACTIFS ({activeStandalone.length})
                  </Text>
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
              ) : null}
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
};

function createStyles(palette: CarpoolUiPalette) {
  return StyleSheet.create({
    heroCard: {
      backgroundColor: CARPOOL_SITE.surface,
      borderWidth: 1,
      borderColor: CARPOOL_SITE.lane,
      borderRadius: 20,
      padding: 16,
      marginBottom: 16,
      gap: 14,
    },
    heroHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    heroIconOrb: {
      width: 44,
      height: 44,
      borderRadius: 14,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    heroTitleCol: {
      flex: 1,
      gap: 2,
    },
    heroTitle: {
      fontSize: 18,
      fontWeight: '900',
      color: '#FFFFFF',
      letterSpacing: -0.3,
    },
    heroSub: {
      fontSize: 12,
      color: '#A1A1AA',
      lineHeight: 16,
    },
    segmentTrack: {
      flexDirection: 'row',
      backgroundColor: '#0F1015',
      borderRadius: radius.pill,
      padding: 4,
      borderWidth: 1,
      borderColor: '#1C1D26',
      gap: 4,
    },
    segmentPill: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 8,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: 'transparent',
    },
    segmentPillActive: {
      backgroundColor: '#1C1D26',
    },
    segmentText: {
      fontSize: 12,
      fontWeight: '600',
      color: '#A1A1AA',
    },
    sectionWrap: {
      gap: 10,
      marginBottom: 16,
    },
    sectionHeader: {
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 0.8,
      color: '#8B8B9A',
      textTransform: 'uppercase',
      marginLeft: 4,
    },
    loader: {
      marginVertical: 40,
    },
  });
}

