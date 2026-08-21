import React, { useCallback, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSessionProfile } from '../../hooks/useSessionProfile';
import { useClubWorkspace } from '../../features/club/hooks/useClubWorkspace';
import { useClubLogoUpload } from '../../features/club/hooks/useClubLogoUpload';
import { useClubShellNav } from '../../features/club/shell/ClubShellNavContext';
import { useClubTheme } from '../../features/club/shell/ClubThemeContext';
import { ClubChapterScroll, ClubLoading } from '../../features/club/ui/clubUi';
import {
  ClubHomeCommPeek,
  ClubHomeIdentityHeader,
  ClubHomeInsightLine,
  ClubHomeMiniStats,
  ClubHomeNextEventRow,
  ClubHomePresenceAlert,
  ClubHomeShortcutLinks,
  ClubHomeTeamsRail,
  ClubHomeTodayPeek,
  ClubHomeTodoSection,
  ClubHomeWeekPeek,
  type ClubHomePriority,
  type ClubHomeTeamCard,
  type ClubHomeTodayChip,
  type ClubHomeWeekItem,
} from '../../features/club/ui/ClubHomeAccueil';
import type { ClubThemeTokens } from '../../features/club/theme/clubTokens';
import {
  getPendingInviteeUids,
  isCoachMatchEvent,
  isCoachTrainingEvent,
  type TeamEvent,
} from '../../models/TeamEvent';

const MAX_TODO_ITEMS = 3;
const MAX_TODAY_ITEMS = 6;
const MAX_WEEK_ITEMS = 4;
const MAX_TEAM_CARDS = 4;

function greetingForHour(h: number): string {
  if (h < 12) return 'Bonjour';
  if (h < 18) return 'Bon après-midi';
  return 'Bonsoir';
}

function upcomingEvents(
  events: TeamEvent[],
  predicate: (e: TeamEvent) => boolean,
): TeamEvent[] {
  const now = Date.now();
  return events
    .filter((e) => predicate(e) && e.starts_at && new Date(e.starts_at).getTime() >= now - 30 * 60 * 1000)
    .sort((a, b) => new Date(a.starts_at!).getTime() - new Date(b.starts_at!).getTime());
}

function startOfTomorrow(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 1);
  return d;
}

function endOfNextWeek(): Date {
  const d = startOfTomorrow();
  d.setDate(d.getDate() + 7);
  d.setHours(23, 59, 59, 999);
  return d;
}

function formatDayShort(d: Date): string {
  return d
    .toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' })
    .replace('.', '');
}

function resolvePriority(ws: ReturnType<typeof useClubWorkspace>): ClubHomePriority {
  const nextMatch =
    ws.todayMatches.find((e) => e.starts_at && new Date(e.starts_at).getTime() >= Date.now() - 30 * 60 * 1000) ??
    upcomingEvents(ws.events, isCoachMatchEvent)[0] ??
    ws.todayMatches[0];
  const nextTraining =
    ws.todayTrainings.find((e) => e.starts_at && new Date(e.starts_at).getTime() >= Date.now() - 30 * 60 * 1000) ??
    upcomingEvents(ws.events, isCoachTrainingEvent)[0] ??
    ws.todayTrainings[0];

  if (nextMatch?.starts_at && nextTraining?.starts_at) {
    const mt = new Date(nextMatch.starts_at).getTime();
    const tt = new Date(nextTraining.starts_at).getTime();
    return mt <= tt
      ? { kind: 'match', event: nextMatch }
      : { kind: 'training', event: nextTraining };
  }
  if (nextMatch) return { kind: 'match', event: nextMatch };
  if (nextTraining) return { kind: 'training', event: nextTraining };
  return { kind: 'calm' };
}

/** Insight atmosphère — un fait workspace, sans doubler la grille de chiffres. */
function resolveInsight(ws: ReturnType<typeof useClubWorkspace>): string {
  if (ws.pendingMemberships > 0) {
    return `${ws.pendingMemberships} adhésion${ws.pendingMemberships > 1 ? 's' : ''} en attente de validation`;
  }
  if (ws.teamsWithoutCoach > 0) {
    return `${ws.teamsWithoutCoach} équipe${ws.teamsWithoutCoach > 1 ? 's' : ''} sans coach affecté`;
  }
  if (ws.teams.length === 0) {
    return 'Aucune équipe — crée la première pour démarrer le club';
  }
  const todayCount = ws.todayMatches.length + ws.todayTrainings.length;
  if (todayCount > 0) {
    return `${todayCount} rendez-vous sur le terrain aujourd’hui`;
  }
  return `${ws.teams.length} équipe${ws.teams.length > 1 ? 's' : ''} · structure opérationnelle`;
}

function resolvePresenceAlert(events: TeamEvent[]): {
  pendingCount: number;
  eventLabel?: string;
  nav: 'matches' | 'trainings' | 'calendar';
} {
  const now = Date.now();
  const horizon = endOfNextWeek().getTime();
  const upcoming = events
    .filter((e) => {
      if (!e.starts_at) return false;
      const t = new Date(e.starts_at).getTime();
      return t >= now - 30 * 60 * 1000 && t <= horizon;
    })
    .sort((a, b) => new Date(a.starts_at!).getTime() - new Date(b.starts_at!).getTime());

  let pendingCount = 0;
  let firstWithPending: TeamEvent | undefined;
  for (const event of upcoming) {
    const pending = getPendingInviteeUids(event).length;
    if (pending <= 0) continue;
    pendingCount += pending;
    if (!firstWithPending) firstWithPending = event;
  }

  if (!firstWithPending) {
    return { pendingCount: 0, nav: 'calendar' };
  }

  const nav = isCoachMatchEvent(firstWithPending)
    ? 'matches'
    : isCoachTrainingEvent(firstWithPending)
      ? 'trainings'
      : 'calendar';

  return {
    pendingCount,
    eventLabel: firstWithPending.title?.trim() || undefined,
    nav,
  };
}

/** Accueil Club — densité Coach + accents premium compacts (sans copilote). */
export function ClubHomeScreen() {
  const profile = useSessionProfile();
  const shellNav = useClubShellNav();
  const { tokens, logoUrl } = useClubTheme();
  const ws = useClubWorkspace();
  const onLogoUploaded = useCallback(() => {
    void ws.refresh();
  }, [ws.refresh]);
  const logo = useClubLogoUpload(onLogoUploaded);
  const styles = useMemo(() => createStyles(tokens), [tokens]);

  if (ws.loading) return <ClubLoading />;

  const name = ws.club?.name ?? profile?.display_name ?? 'Club';
  const greet = greetingForHour(new Date().getHours());
  const priority = resolvePriority(ws);
  const insight = resolveInsight(ws);
  const presence = resolvePresenceAlert(ws.events);

  const todoItems = [
    ...(!logoUrl && logo.canEdit
      ? [
          {
            id: 'logo',
            icon: 'image' as const,
            label: 'Ajouter le logo du club',
            hint: 'Crest Accueil + thème dynamique',
            onPress: () => void logo.pickAndUpload(),
          },
        ]
      : []),
    ...(ws.teamsWithoutCoach > 0
      ? [
          {
            id: 'no-coach',
            icon: 'school' as const,
            label: `${ws.teamsWithoutCoach} équipe(s) sans coach`,
            hint: 'Affecter un coach — l’IA ne déplace jamais les joueurs.',
            onPress: () => shellNav?.requestNav('coaches'),
          },
        ]
      : []),
    ...(ws.pendingMemberships > 0
      ? [
          {
            id: 'pending',
            icon: 'checkmark-circle' as const,
            label: 'Valider les adhésions',
            hint: `${ws.pendingMemberships} en attente`,
            onPress: () => shellNav?.requestNav('players'),
          },
        ]
      : []),
    ...(ws.teams.length === 0
      ? [
          {
            id: 'first-team',
            icon: 'add' as const,
            label: 'Créer la première équipe',
            hint: 'U7 → Seniors',
            onPress: () => shellNav?.openCreate?.('player') ?? shellNav?.requestNav('teams'),
          },
        ]
      : []),
  ].slice(0, MAX_TODO_ITEMS);

  const todayChips: ClubHomeTodayChip[] = [
    ...ws.todayMatches.map((e) => ({
      id: `m-${e.id}`,
      kind: 'match' as const,
      label: e.title?.trim() || 'Match',
      time: e.starts_at
        ? new Date(e.starts_at).toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit',
          })
        : undefined,
      onPress: () => shellNav?.requestNav('matches'),
    })),
    ...ws.todayTrainings.map((e) => ({
      id: `t-${e.id}`,
      kind: 'training' as const,
      label: e.title?.trim() || 'Entraînement',
      time: e.starts_at
        ? new Date(e.starts_at).toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit',
          })
        : undefined,
      onPress: () => shellNav?.requestNav('trainings'),
    })),
  ]
    .sort((a, b) => (a.time ?? '').localeCompare(b.time ?? ''))
    .slice(0, MAX_TODAY_ITEMS);

  const from = startOfTomorrow().getTime();
  const to = endOfNextWeek().getTime();
  const weekItems: ClubHomeWeekItem[] = ws.events
    .filter((e) => {
      if (!e.starts_at) return false;
      const t = new Date(e.starts_at).getTime();
      return t >= from && t <= to && (isCoachMatchEvent(e) || isCoachTrainingEvent(e));
    })
    .sort((a, b) => new Date(a.starts_at!).getTime() - new Date(b.starts_at!).getTime())
    .slice(0, MAX_WEEK_ITEMS)
    .map((e) => {
      const starts = new Date(e.starts_at!);
      const isMatch = isCoachMatchEvent(e);
      return {
        id: e.id,
        kind: isMatch ? ('match' as const) : ('training' as const),
        dayLabel: formatDayShort(starts),
        time: starts.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        label: e.title?.trim() || (isMatch ? 'Match' : 'Entraînement'),
        onPress: () => shellNav?.requestNav(isMatch ? 'matches' : 'trainings'),
      };
    });

  const teamCards: ClubHomeTeamCard[] = ws.teamRows.slice(0, MAX_TEAM_CARDS).map((row) => {
    const hasCoach = row.coachNames.length > 0;
    const metaParts = [
      row.category,
      row.genderLabel,
      `${row.licensedCount} licencié${row.licensedCount > 1 ? 's' : ''}`,
    ].filter(Boolean);
    return {
      id: row.teamId,
      name: row.name,
      meta: metaParts.join(' · '),
      coachesLabel: hasCoach ? row.coachNames.slice(0, 2).join(', ') : 'Sans coach',
      hasCoach,
      onPress: () => shellNav?.requestNav('teams'),
    };
  });

  const onPriorityPress = () => {
    if (priority.kind === 'match') {
      shellNav?.requestNav('matches');
      return;
    }
    if (priority.kind === 'training') {
      shellNav?.requestNav('trainings');
      return;
    }
    shellNav?.requestNav('calendar');
  };

  return (
    <View style={styles.root}>
      <ClubChapterScroll refreshing={ws.refreshing} onRefresh={() => void ws.refresh()}>
        <ClubHomeIdentityHeader
          greeting={greet}
          clubName={name}
          statusLabel={ws.statusLabel}
          statusTone={ws.statusTone}
          onPressCrest={logo.canEdit ? () => void logo.pickAndUpload() : undefined}
          crestUploading={logo.uploading}
        />

        <ClubHomeMiniStats
          players={ws.players.length}
          coaches={ws.coaches.length}
          teams={ws.teams.length}
          onPlayers={() => shellNav?.requestNav('players')}
          onCoaches={() => shellNav?.requestNav('coaches')}
          onTeams={() => shellNav?.requestNav('teams')}
        />

        <ClubHomeInsightLine text={insight} />

        <ClubHomeNextEventRow priority={priority} onPress={onPriorityPress} />

        <ClubHomeTodayPeek
          chips={todayChips}
          onSeeAll={() => shellNav?.requestNav('calendar')}
        />

        <ClubHomePresenceAlert
          pendingCount={presence.pendingCount}
          eventLabel={presence.eventLabel}
          onPress={() => shellNav?.requestNav(presence.nav)}
        />

        <ClubHomeTeamsRail
          teams={teamCards}
          onSeeAll={() => shellNav?.requestNav('teams')}
        />

        <ClubHomeWeekPeek
          items={weekItems}
          onSeeAll={() => shellNav?.requestNav('calendar')}
        />

        <ClubHomeTodoSection
          items={todoItems}
          emptySummary="Rien d’urgent — le club est à jour."
        />

        <ClubHomeCommPeek
          pendingMemberships={ws.pendingMemberships}
          onNotifications={() => shellNav?.requestNav('notifications')}
          onCommunication={() => shellNav?.requestNav('communication')}
          onPlayers={() => shellNav?.requestNav('players')}
        />

        <ClubHomeShortcutLinks
          links={[
            { id: 'teams', label: 'Équipes', onPress: () => shellNav?.requestNav('teams') },
            { id: 'matches', label: 'Matchs', onPress: () => shellNav?.requestNav('matches') },
          ]}
        />
      </ClubChapterScroll>
    </View>
  );
}

const createStyles = (_tokens: ClubThemeTokens) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: 'transparent' },
  });
