import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import type { User } from '../../models/User';
import type { TeamEvent } from '../../models/TeamEvent';
import {
  carpoolEventSummaryForUser,
  isCarpoolDriver,
} from '../../utils/carpoolBalance';
import { ProDaySurface } from '../ui/ProDaySurface';
import { ProDayText } from '../ui/ProDayText';
import { ProDayGradient } from '../ui/ProDayGradient';
import { Icon } from '../ui/Icon';
import { PressableSpring } from '../motion';
import { CarpoolProposeCard } from './CarpoolProposeCard';
import { useAppTheme } from '../../context/ProductLineContext';
import { spacing } from '../../theme/designTokens';

interface CarpoolProposePanelProps {
  profile: User | null;
  events: TeamEvent[];
  loading: boolean;
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
  loading,
  refreshing,
  onRefresh,
  onOpenEvent,
  scrollProps,
  pagePad,
  onLoginRequired,
}) => {
  const { colors } = useAppTheme();
  const [expandedId, setExpandedId] = useState<string | null>(null);

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

  const toggleExpanded = (eventId: string) => {
    setExpandedId((prev) => (prev === eventId ? null : eventId));
  };

  if (!profile) {
    return (
      <ScrollView contentContainerStyle={pagePad} {...scrollProps}>
        <ProDaySurface variant="module" style={styles.empty}>
          <Icon name="car" size={32} color={colors.textMuted} variant="filled" />
          <ProDayText variant="section">Connectez-vous</ProDayText>
          <ProDayText variant="body" muted style={styles.emptySub}>
            Accédez à vos convocations pour proposer un trajet à l’équipe.
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
      </ScrollView>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={pagePad}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
      }
      {...scrollProps}
    >
      <ProDayText variant="eyebrow" accent style={styles.lead}>
        Proposer un trajet
      </ProDayText>
      <ProDayText variant="body" muted style={styles.sub}>
        Indiquez vos places, l’heure de départ et votre point de rendez-vous (adresse ou GPS). Vos
        coéquipiers convoqués pourront réserver une place.
      </ProDayText>

      {bookedElsewhere > 0 ? (
        <ProDaySurface variant="accent" style={[styles.hint, { borderColor: colors.border }]}>
          <ProDayText variant="caption" accent>
            Vous avez déjà réservé une place sur {bookedElsewhere} événement
            {bookedElsewhere > 1 ? 's' : ''} — vous pouvez tout de même proposer votre véhicule sur
            un autre match.
          </ProDayText>
        </ProDaySurface>
      ) : null}

      {loading ? (
        <ActivityIndicator color={colors.accent} style={styles.loader} />
      ) : proposeEvents.length === 0 ? (
        <ProDaySurface variant="module" style={styles.empty}>
          <Icon name="calendar" size={32} color={colors.textMuted} />
          <ProDayText variant="section">Aucune convocation</ProDayText>
          <ProDayText variant="body" muted style={styles.emptySub}>
            Vos matchs et entraînements à venir apparaîtront ici pour proposer un covoiturage.
          </ProDayText>
        </ProDaySurface>
      ) : (
        <>
          {activeOffers.length > 0 ? (
            <>
              <ProDayText variant="section" style={styles.sectionTitle}>
                Mes trajets publiés ({activeOffers.length})
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
                {activeOffers.length > 0 ? 'Nouveaux trajets à proposer' : 'Événements à venir'} (
                {newProposals.length})
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
            <ProDaySurface variant="module" style={styles.empty}>
              <Icon name="car" size={32} color={colors.textMuted} />
              <ProDayText variant="section">Rien à proposer</ProDayText>
              <ProDayText variant="body" muted style={styles.emptySub}>
                Aucun événement convoqué pour le moment.
              </ProDayText>
            </ProDaySurface>
          ) : null}
        </>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  lead: { marginBottom: spacing.xs },
  sub: { marginBottom: spacing.md },
  hint: {
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderRadius: 12,
  },
  sectionTitle: { marginBottom: spacing.sm, marginTop: spacing.xs },
  loader: { marginVertical: spacing.xl },
  empty: {
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.xl,
  },
  emptySub: { textAlign: 'center' },
  cta: {
    marginTop: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: 999,
  },
  ctaText: { fontWeight: '800' },
});
