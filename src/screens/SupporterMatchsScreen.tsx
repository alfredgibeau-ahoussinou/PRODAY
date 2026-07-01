import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { TabScreenShell } from '../components/app/TabScreenShell';
import { PressableSpring } from '../components/motion';
import { ProDayText } from '../components/ui/ProDayText';
import { useAuth } from '../context/AuthContext';
import { useSeasonCalendar } from '../hooks/useAppData';
import { useTournaments } from '../hooks/useTournaments';
import { isInMatchWindow } from '../utils/matchLive';
import { formatCalendarDate } from '../utils/seasonCalendar';
import { spacing, radius } from '../theme/designTokens';
import { useAppTheme } from '../context/ProductLineContext';
import { followsService } from '../services/follows.service';
import type { Follow } from '../models/Follow';
import { teamEventsService } from '../services/teamEvents.service';
import {
  externalScoresService,
  type ExternalFixture,
} from '../services/externalScores.service';

type SupporterMatchsChapter = 'live' | 'today' | 'tournaments' | 'follows';

const CHAPTERS: { id: SupporterMatchsChapter; label: string }[] = [
  { id: 'live', label: 'En direct' },
  { id: 'today', label: "Aujourd'hui" },
  { id: 'tournaments', label: 'Tournois' },
  { id: 'follows', label: 'Mes suivis' },
];

export const SupporterMatchsScreen: React.FC = () => {
  const { profile } = useAuth();
  const { colors } = useAppTheme();
  const { items, events } = useSeasonCalendar(profile?.uid, profile?.profile.club_id);
  const { tournaments } = useTournaments();
  const [chapter, setChapter] = useState<SupporterMatchsChapter>('live');
  const [follows, setFollows] = useState<Follow[]>([]);
  const [publicEvents, setPublicEvents] = useState<typeof events>([]);
  const [worldFixtures, setWorldFixtures] = useState<ExternalFixture[]>([]);

  React.useEffect(() => {
    if (!profile?.uid) return;
    followsService
      .listByFollower(profile.uid)
      .then(setFollows)
      .catch(() => setFollows([]));
  }, [profile?.uid]);

  React.useEffect(() => {
    teamEventsService
      .listUpcoming(60)
      .then(setPublicEvents)
      .catch(() => setPublicEvents([]));
    externalScoresService
      .listFixtures()
      .then(setWorldFixtures)
      .catch(() => setWorldFixtures([]));
  }, []);

  const liveEvents = useMemo(() => events.filter((event) => isInMatchWindow(event)).slice(0, 8), [events]);
  const localLiveEvents = useMemo(
    () => publicEvents.filter((event) => isInMatchWindow(event)).slice(0, 8),
    [publicEvents]
  );
  const todayItems = useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 1);
    return items.filter((item) => item.starts_at >= start && item.starts_at < end).slice(0, 12);
  }, [items]);
  const todayLocalEvents = useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 1);
    return publicEvents
      .filter((event) => event.starts_at >= start && event.starts_at < end)
      .slice(0, 12);
  }, [publicEvents]);
  const todayWorldFixtures = useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 1);
    return worldFixtures
      .filter((fixture) => fixture.starts_at >= start && fixture.starts_at < end)
      .slice(0, 12);
  }, [worldFixtures]);
  const liveWorldFixtures = useMemo(
    () => worldFixtures.filter((fixture) => fixture.status === 'live').slice(0, 8),
    [worldFixtures]
  );
  const followedClubIds = useMemo(
    () => new Set(follows.filter((f) => f.target_type === 'club').map((f) => f.target_id)),
    [follows]
  );
  const followedTournamentIds = useMemo(
    () => new Set(follows.filter((f) => f.target_type === 'tournament').map((f) => f.target_id)),
    [follows]
  );
  const followedLocalEvents = useMemo(() => {
    if (followedClubIds.size === 0) return [];
    return publicEvents
      .filter((event) => event.club_id && followedClubIds.has(event.club_id))
      .sort((a, b) => a.starts_at.getTime() - b.starts_at.getTime())
      .slice(0, 12);
  }, [publicEvents, followedClubIds]);
  const followedTournaments = useMemo(
    () => tournaments.filter((tournament) => followedTournamentIds.has(tournament.id)).slice(0, 12),
    [tournaments, followedTournamentIds]
  );

  const renderCard = (
    title: string,
    subtitle: string,
    meta?: string,
    source?: 'Monde' | 'PRODAY'
  ) => (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {source ? (
        <View style={styles.sourcePill}>
          <ProDayText variant="caption" style={{ color: colors.accent }}>
            {source}
          </ProDayText>
        </View>
      ) : null}
      <ProDayText variant="section">{title}</ProDayText>
      <ProDayText variant="caption" muted>{subtitle}</ProDayText>
      {meta ? <ProDayText variant="caption" style={{ color: colors.accent }}>{meta}</ProDayText> : null}
    </View>
  );

  let content: React.ReactNode = null;
  if (chapter === 'live') {
    const followedOnly = followedClubIds.size > 0;
    const scopedLocalLive = followedOnly
      ? localLiveEvents.filter((event) => event.club_id && followedClubIds.has(event.club_id))
      : localLiveEvents;
    content = (
      <>
        {liveWorldFixtures.length > 0
          ? liveWorldFixtures.map((fixture) =>
              renderCard(
                `${fixture.home_team} vs ${fixture.away_team}`,
                `${fixture.competition_label} · ${fixture.venue ?? 'Monde'}`,
                fixture.minute != null
                  ? `${fixture.score_home ?? 0}-${fixture.score_away ?? 0} · ${fixture.minute}'`
                  : 'Live',
                'Monde'
              )
            )
          : renderCard('Monde (API)', 'Provider scores prêt (mock Ligue 1 / D1 Arkema).', 'Stub API', 'Monde')}
        {scopedLocalLive.length > 0
          ? scopedLocalLive.map((event) =>
              renderCard(
                event.title,
                event.city || 'Match en cours',
                `${formatCalendarDate(event.starts_at)} · ${event.club_name ?? 'Club local'}`,
                'PRODAY'
              )
            )
          : liveEvents.length > 0
            ? liveEvents.map((event) =>
                renderCard(
                  event.title,
                  event.city || 'Match en cours',
                  formatCalendarDate(event.starts_at),
                  'PRODAY'
                )
              )
            : renderCard('Aucun live local', 'Les matchs en direct apparaîtront ici.', undefined, 'PRODAY')}
      </>
    );
  } else if (chapter === 'today') {
    const todayCards = [
      ...todayLocalEvents.map((event) =>
        renderCard(
          event.title,
          `${event.city} · ${event.club_name ?? 'Club local'}`,
          formatCalendarDate(event.starts_at),
          'PRODAY'
        )
      ),
      ...todayItems.map((item) =>
        renderCard(item.title, item.subtitle, formatCalendarDate(item.starts_at), 'PRODAY')
      ),
      ...todayWorldFixtures.map((fixture) =>
        renderCard(
          `${fixture.home_team} vs ${fixture.away_team}`,
          fixture.competition_label,
          fixture.status === 'finished'
            ? `${fixture.score_home ?? 0}-${fixture.score_away ?? 0}`
            : formatCalendarDate(fixture.starts_at),
          'Monde'
        )
      ),
    ];
    content =
      todayCards.length > 0
        ? todayCards
        : renderCard("Pas d'affiche aujourd'hui", 'Revenez plus tard pour les rencontres du jour.');
  } else if (chapter === 'tournaments') {
    content =
      tournaments.length > 0
        ? tournaments.slice(0, 12).map((tournament) =>
            renderCard(tournament.title, tournament.city, formatCalendarDate(tournament.starts_at), 'PRODAY')
          )
        : renderCard('Aucun tournoi', 'Les tournois à venir seront listés ici.');
  } else {
    const followed = follows.filter((follow) => follow.target_type === 'club' || follow.target_type === 'tournament');
    content = (
      <>
        {followed.length > 0
          ? followed.map((follow) =>
              renderCard(
                follow.target_label ?? follow.target_id,
                follow.target_type === 'club' ? 'Club suivi' : 'Tournoi suivi',
                follow.created_at.toLocaleDateString('fr-FR')
              )
            )
          : renderCard('Aucun suivi', 'Ajoutez des clubs et tournois dans l’onglet Suivis.')}
        {followedLocalEvents.length > 0
          ? followedLocalEvents.map((event) =>
              renderCard(
                event.title,
                `${event.club_name ?? 'Club'} · ${event.city}`,
                formatCalendarDate(event.starts_at),
                'PRODAY'
              )
            )
          : null}
        {followedTournaments.length > 0
          ? followedTournaments.map((tournament) =>
              renderCard(
                tournament.title,
                `${tournament.city} · Tournoi suivi`,
                formatCalendarDate(tournament.starts_at),
                'PRODAY'
              )
            )
          : null}
      </>
    );
  }

  return (
    <TabScreenShell
      caption="TRIBUNE"
      title="Matchs supporter"
      subtitle="Direct, calendrier, tournois et suivis"
      flat
    >
      <View style={styles.chips}>
        {CHAPTERS.map((entry) => {
          const active = entry.id === chapter;
          return (
            <PressableSpring
              key={entry.id}
              onPress={() => setChapter(entry.id)}
              style={[
                styles.chip,
                {
                  backgroundColor: active ? colors.accent : colors.surface,
                  borderColor: active ? colors.accent : colors.border,
                },
              ]}
            >
              <ProDayText variant="caption" style={{ color: active ? '#fff' : colors.textSecondary }}>
                {entry.label}
              </ProDayText>
            </PressableSpring>
          );
        })}
      </View>
      <ScrollView contentContainerStyle={styles.content}>{content}</ScrollView>
    </TabScreenShell>
  );
};

const styles = StyleSheet.create({
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  chip: {
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.sm,
  },
  card: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: 4,
  },
  sourcePill: {
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
});

