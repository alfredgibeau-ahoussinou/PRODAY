import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { PressableSpring, PushScreenTransition } from '../../components/motion';
import { Icon } from '../../components/ui/Icon';
import {
  CoachChapterScroll,
  CoachEmptyState,
  CoachText,
  coachChipContainerStyle,
  coachChipTextProps,
} from '../../components/coach/coachPortalUi';
import { CalendarMonthGrid } from '../../features/calendar/CalendarMonthGrid';
import { useCoachShellNav } from '../../features/coach/shell/CoachShellNavContext';
import { useCoachTheme } from '../../features/coach/shell/CoachThemeContext';
import { useCoachTeamChrome } from '../../hooks/useCoachTeamChrome';
import { useSessionProfile } from '../../hooks/useSessionProfile';
import { teamEventsService } from '../../services/teamEvents.service';
import {
  isCoachMatchEvent,
  isCoachTrainingEvent,
  type TeamEvent,
} from '../../models/TeamEvent';
import { clubSeasonLabelForDate, formatClubSeasonLabel } from '../../utils/clubSeason';
import { CoachMatchEventHub } from './CoachMatchEventHub';
import { CoachTrainingEventHub } from './CoachTrainingEventHub';
import { TeamEventDetailScreen } from '../TeamEventDetailScreen';
import { CoachOrganizeFriendlyModal } from '../../components/coach/matches/CoachOrganizeFriendlyModal';
import { withAlpha } from '../../utils/coachTeamTheme';

export type CoachEventTypeFilter = 'all' | 'match' | 'training' | 'other';

const TYPE_FILTERS: { id: CoachEventTypeFilter; label: string; icon: 'grid' | 'trophy' | 'football' | 'flag' }[] = [
  { id: 'all', label: 'Tout', icon: 'grid' },
  { id: 'match', label: 'Matchs', icon: 'trophy' },
  { id: 'training', label: 'Entraînements', icon: 'football' },
  { id: 'other', label: 'Autres', icon: 'flag' },
];

/**
 * Calendrier Coach (onglet 2 de la barre basse — README §0.2).
 *
 * Utilise la fondation CalendarMonthGrid avec vue Mois par défaut et vue Liste interactive.
 * Ouvre directement CoachMatchEventHub pour les matchs ou CoachTrainingEventHub pour les séances.
 */
export function CoachCalendarScreen() {
  const profile = useSessionProfile();
  const { tokens, teamId, coachTeams, setActiveTeamId } = useCoachTheme();
  const { teamName, displayName } = useCoachTeamChrome();
  const shellNav = useCoachShellNav();

  const [events, setEvents] = useState<TeamEvent[]>([]);
  const [typeFilter, setTypeFilter] = useState<CoachEventTypeFilter>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [failed, setFailed] = useState(false);
  const [detailEventId, setDetailEventId] = useState<string | null>(null);
  const [detailKind, setDetailKind] = useState<'match' | 'training' | 'other' | null>(null);
  const [organizeFriendlyOpen, setOrganizeFriendlyOpen] = useState(false);

  const season = formatClubSeasonLabel(clubSeasonLabelForDate(new Date()));

  const load = useCallback(
    async (opts?: { silent?: boolean }) => {
      const uid = profile?.uid;
      if (!uid) {
        setEvents([]);
        setLoading(false);
        return;
      }
      if (!opts?.silent) setLoading(true);
      try {
        const rows = await teamEventsService.listForUser(uid, profile?.profile.club_id || undefined);
        setEvents(rows);
        setFailed(false);
      } catch {
        setFailed(true);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [profile?.uid, profile?.profile.club_id],
  );

  useEffect(() => {
    void load();
  }, [load]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void load({ silent: true });
  }, [load]);

  /** Périmètre = équipe active quand elle est connue ; sinon tous les événements autorisés. */
  const scopedEvents = useMemo(() => {
    if (!teamId) return events;
    const declared = events.filter((event) => event.team_id === teamId);
    const undeclared = events.filter((event) => !event.team_id);
    return [...declared, ...undeclared];
  }, [events, teamId]);

  /** Filtrage par type d'événement */
  const filteredEvents = useMemo(() => {
    if (typeFilter === 'all') return scopedEvents;
    if (typeFilter === 'match') return scopedEvents.filter(isCoachMatchEvent);
    if (typeFilter === 'training') return scopedEvents.filter(isCoachTrainingEvent);
    return scopedEvents.filter((e) => !isCoachMatchEvent(e) && !isCoachTrainingEvent(e));
  }, [scopedEvents, typeFilter]);

  const openDetail = (event: TeamEvent | any) => {
    const rawId = event.id || event.team_event_id;
    if (isCoachMatchEvent(event)) {
      setDetailKind('match');
      setDetailEventId(rawId);
      return;
    }
    if (isCoachTrainingEvent(event)) {
      setDetailKind('training');
      setDetailEventId(rawId);
      return;
    }
    setDetailKind('other');
    setDetailEventId(rawId);
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: tokens.bg }]}>
        <ActivityIndicator color={tokens.accent} />
        <CoachText variant="caption" muted>
          Chargement du calendrier…
        </CoachText>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <CoachChapterScroll>
        {/* En-tête calendrier coach */}
        <View style={styles.header}>
          <CoachText variant="caption" style={[styles.kicker, { color: tokens.accent }]}>
            {teamName} · SAISON {season}
          </CoachText>
          <CoachText variant="title" style={styles.title}>
            Calendrier
          </CoachText>
          <CoachText variant="caption" muted>
            {displayName} · {filteredEvents.length} rendez-vous autorisés
          </CoachText>
        </View>

        {/* Raccourcis rapides */}
        <View style={styles.shortcutRow}>
          <PressableSpring
            onPress={() => shellNav?.requestNav('entrainements')}
            scaleTo={0.97}
            haptic
            style={[styles.shortcut, { borderColor: tokens.border, backgroundColor: tokens.surface }]}
          >
            <Icon name="football" size={14} color={tokens.accent} />
            <CoachText variant="caption" style={styles.shortcutLabel}>
              Séances
            </CoachText>
          </PressableSpring>
          <PressableSpring
            onPress={() => shellNav?.requestNav('match_center')}
            scaleTo={0.97}
            haptic
            style={[styles.shortcut, { borderColor: tokens.border, backgroundColor: tokens.surface }]}
          >
            <Icon name="trophy" size={14} color={tokens.accent} />
            <CoachText variant="caption" style={styles.shortcutLabel}>
              Matchs & convocations
            </CoachText>
          </PressableSpring>
        </View>

        {/* Filtres par équipe (si le coach gère plusieurs équipes) */}
        {coachTeams.length > 1 ? (
          <View style={styles.teamRow}>
            {coachTeams.map((team) => {
              const active = team.id === teamId;
              return (
                <PressableSpring
                  key={team.id}
                  onPress={() => setActiveTeamId(team.id)}
                  scaleTo={0.97}
                  haptic
                  style={coachChipContainerStyle(active, tokens)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                >
                  <CoachText
                    variant="caption"
                    {...coachChipTextProps(active, tokens)}
                    style={styles.chipLabel}
                  >
                    {team.name}
                  </CoachText>
                </PressableSpring>
              );
            })}
          </View>
        ) : null}

        {/* Filtres par type (Tout / Matchs / Entraînements / Autres) */}
        <View style={styles.typeFilterRow}>
          {TYPE_FILTERS.map((f) => {
            const active = f.id === typeFilter;
            return (
              <PressableSpring
                key={f.id}
                onPress={() => setTypeFilter(f.id)}
                scaleTo={0.97}
                haptic
                style={coachChipContainerStyle(active, tokens)}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
              >
                <CoachText
                  variant="caption"
                  {...coachChipTextProps(active, tokens)}
                  style={styles.chipLabel}
                >
                  {f.label}
                </CoachText>
              </PressableSpring>
            );
          })}
        </View>

        {failed ? (
          <CoachEmptyState
            title="Calendrier indisponible"
            body="Le chargement des événements a échoué. Les dernières données connues ne sont pas affichées pour éviter de les présenter comme à jour."
            cta="Réessayer"
            onPress={() => void load()}
          />
        ) : (
          <CalendarMonthGrid
            events={filteredEvents}
            onSelectEvent={openDetail}
            defaultViewMode="month"
            tokens={tokens}
            emptyMessage="Rien sur cette période"
          />
        )}
      </CoachChapterScroll>

      {/* Hubs d'événements coach interactifs */}
      <PushScreenTransition active={detailEventId != null} backgroundColor={tokens.bg}>
        {detailEventId && detailKind === 'match' ? (
          <CoachMatchEventHub
            eventId={detailEventId}
            onBack={() => {
              setDetailEventId(null);
              setDetailKind(null);
              void load({ silent: true });
            }}
          />
        ) : null}
        {detailEventId && detailKind === 'training' ? (
          <CoachTrainingEventHub
            eventId={detailEventId}
            onBack={() => {
              setDetailEventId(null);
              setDetailKind(null);
              void load({ silent: true });
            }}
          />
        ) : null}
        {detailEventId && detailKind === 'other' ? (
          <TeamEventDetailScreen
            eventId={detailEventId}
            onBack={() => {
              setDetailEventId(null);
              setDetailKind(null);
              void load({ silent: true });
            }}
          />
        ) : null}
      </PushScreenTransition>

      <CoachOrganizeFriendlyModal
        visible={organizeFriendlyOpen}
        onClose={() => setOrganizeFriendlyOpen(false)}
        onSuccess={() => void load({ silent: true })}
        initialTeamId={teamId}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  header: { gap: 2, marginBottom: 12 },
  kicker: { fontWeight: '800', letterSpacing: 0.6, fontSize: 11 },
  title: { fontWeight: '800', fontSize: 26, letterSpacing: -0.6 },
  teamRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 10 },
  typeFilterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  chipLabel: { fontWeight: '700' },
  shortcutRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  shortcut: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  shortcutLabel: { fontWeight: '700' },
});
