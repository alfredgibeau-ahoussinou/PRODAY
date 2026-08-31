import React, { useCallback, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSessionProfile } from '../../hooks/useSessionProfile';
import { useClubWorkspace } from '../../features/club/hooks/useClubWorkspace';
import { useClubLogoUpload } from '../../features/club/hooks/useClubLogoUpload';
import { useClubShellNav } from '../../features/club/shell/ClubShellNavContext';
import { useClubTheme } from '../../features/club/shell/ClubThemeContext';
import { ClubChapterScroll, ClubLoading } from '../../features/club/ui/clubUi';
import {
  ClubHomeIdentityHeader,
  ClubHomeNextEventRow,
  ClubHomeTeamsRail,
  ClubHomeTodoSection,
} from '../../features/club/ui/ClubHomeAccueil';
import {
  buildClubHomeTeamCards,
  formatClubHomeMetaLine,
  greetingForHour,
  resolveClubHomePriority,
  resolveClubPresenceAlert,
  resolvePriorityLocationLabel,
  resolvePriorityTeamLabel,
} from '../../features/club/ui/clubHomeAccueilModel';
import type { ClubThemeTokens } from '../../features/club/theme/clubTokens';
import { getPendingInviteeUids } from '../../models/TeamEvent';

const MAX_TODO_ITEMS = 4;
const MAX_TEAM_CARDS = 4;

/**
 * Accueil Club — composition courte :
 * crest hero · priorité jour J · équipes · à-faire (ou succès).
 */
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

  const openTeam = useCallback(
    (teamId: string) => {
      shellNav?.setSelectedTeamId?.(teamId);
      shellNav?.requestNav('teams');
    },
    [shellNav],
  );

  if (ws.loading) return <ClubLoading />;

  const name = ws.club?.name ?? profile?.display_name ?? 'Club';
  const greet = greetingForHour(new Date().getHours());
  const priority = resolveClubHomePriority({
    todayMatches: ws.todayMatches,
    todayTrainings: ws.todayTrainings,
    events: ws.events,
  });
  const presence = resolveClubPresenceAlert(ws.events);
  const teamLabel = resolvePriorityTeamLabel(priority, ws.teamRows);
  const locationLabel = resolvePriorityLocationLabel(priority);

  const priorityPending =
    priority.kind !== 'calm' ? getPendingInviteeUids(priority.event).length : 0;
  /** CTA sur la carte jour J uniquement si cet événement a des RSVP. */
  const showConvocationsCta = priorityPending > 0;
  /** Sinon, l’alerte présence reste dans À faire (aucune feature retirée). */
  const showPresenceTodo = presence.pendingCount > 0 && priorityPending === 0;

  const todoItems = [
    ...(showPresenceTodo
      ? [
          {
            id: 'presence',
            icon: 'people' as const,
            label:
              presence.pendingCount > 1
                ? `${presence.pendingCount} réponses de présence en attente`
                : '1 réponse de présence en attente',
            hint: presence.eventLabel?.trim() || 'Relancer les convocations',
            onPress: () => shellNav?.requestNav(presence.nav),
          },
        ]
      : []),
    ...(!logoUrl && logo.canEdit
      ? [
          {
            id: 'logo',
            icon: 'image' as const,
            label: 'Ajouter le logo du club',
            hint: 'Affiché sur l’Accueil et la vitrine',
            onPress: () => void logo.pickAndUpload(),
          },
        ]
      : []),
    ...(ws.teamsWithoutCoach > 0
      ? [
          {
            id: 'no-coach',
            icon: 'school' as const,
            label:
              ws.teamsWithoutCoach > 1
                ? `${ws.teamsWithoutCoach} équipes sans coach`
                : '1 équipe sans coach',
            hint: 'Affecter un coach depuis Coachs',
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

  const teamCards = buildClubHomeTeamCards(ws.teamRows, MAX_TEAM_CARDS, openTeam);

  const onPriorityOpen = () => {
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

  const onConvocations = () => {
    shellNav?.requestNav(presence.nav);
  };

  return (
    <View style={styles.root}>
      <ClubChapterScroll refreshing={ws.refreshing} onRefresh={() => void ws.refresh()}>
        <ClubHomeIdentityHeader
          greeting={greet}
          clubName={name}
          statusLabel={ws.statusLabel}
          statusTone={ws.statusTone}
          metaLine={formatClubHomeMetaLine(ws.players.length, ws.coaches.length, ws.teams.length)}
          onPressCrest={logo.canEdit ? () => void logo.pickAndUpload() : undefined}
          crestUploading={logo.uploading}
        />

        <ClubHomeNextEventRow
          priority={priority}
          teamLabel={teamLabel}
          locationLabel={locationLabel}
          onOpen={onPriorityOpen}
          onConvocations={showConvocationsCta ? onConvocations : undefined}
          onPlan={
            priority.kind === 'calm'
              ? () => shellNav?.openCreate?.('match') ?? shellNav?.requestNav('matches')
              : undefined
          }
        />

        <ClubHomeTeamsRail
          teams={teamCards}
          onSeeAll={() => shellNav?.requestNav('teams')}
          onCreateTeam={() => shellNav?.openCreate?.('player') ?? shellNav?.requestNav('teams')}
        />

        <ClubHomeTodoSection items={todoItems} showSuccessWhenEmpty />
      </ClubChapterScroll>
    </View>
  );
}

const createStyles = (_tokens: ClubThemeTokens) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: 'transparent' },
  });
