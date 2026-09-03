import React, { useCallback, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSessionProfile } from '../../hooks/useSessionProfile';
import { useClubWorkspace } from '../../features/club/hooks/useClubWorkspace';
import { useClubLogoUpload } from '../../features/club/hooks/useClubLogoUpload';
import { useClubShellNav } from '../../features/club/shell/ClubShellNavContext';
import { useClubTheme } from '../../features/club/shell/ClubThemeContext';
import {
  ClubChapterScroll,
  ClubEmptyState,
  ClubLoading,
} from '../../features/club/ui/clubUi';
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
import { PushScreenTransition } from '../../components/motion';
import { CreateClubScreen } from '../CreateClubScreen';
import { ShellAccountSection } from '../../components/shell/ShellAccountSection';

const MAX_TODO_ITEMS = 4;
const MAX_TEAM_CARDS = 4;

/**
 * Accueil Club (Ball Club / Pôle Club) — crest · priorité jour J · équipes · à-faire.
 * Ne jamais `return null` : loading / empty / contenu (prod sinon = écran noir).
 */
export function ClubHomeScreen() {
  const profile = useSessionProfile();
  const shellNav = useClubShellNav();
  const { tokens, logoUrl } = useClubTheme();
  const ws = useClubWorkspace();
  const [createOpen, setCreateOpen] = useState(false);
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

  const priority = useMemo(
    () =>
      resolveClubHomePriority({
        todayMatches: ws.todayMatches,
        todayTrainings: ws.todayTrainings,
        events: ws.events,
      }),
    [ws.todayMatches, ws.todayTrainings, ws.events],
  );
  const presence = useMemo(() => resolveClubPresenceAlert(ws.events), [ws.events]);
  const teamLabel = useMemo(
    () => resolvePriorityTeamLabel(priority, ws.teamRows),
    [priority, ws.teamRows],
  );
  const locationLabel = useMemo(() => resolvePriorityLocationLabel(priority), [priority]);

  const priorityPending =
    priority.kind !== 'calm' ? getPendingInviteeUids(priority.event).length : 0;
  const showConvocationsCta = priorityPending > 0;
  const showPresenceTodo = presence.pendingCount > 0 && priorityPending === 0;

  const todoItems = useMemo(() => {
    return [
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
  }, [
    showPresenceTodo,
    presence.pendingCount,
    presence.eventLabel,
    presence.nav,
    logoUrl,
    logo,
    ws.teamsWithoutCoach,
    ws.pendingMemberships,
    ws.teams.length,
    shellNav,
  ]);

  const teamCards = useMemo(
    () => buildClubHomeTeamCards(ws.teamRows, MAX_TEAM_CARDS, openTeam),
    [ws.teamRows, openTeam],
  );

  if (ws.loading) return <ClubLoading />;

  if (!ws.clubId || !ws.club) {
    return (
      <View style={styles.root}>
        <ClubChapterScroll refreshing={ws.refreshing} onRefresh={() => void ws.refresh()}>
          <ClubHomeIdentityHeader
            greeting={greetingForHour(new Date().getHours())}
            clubName={profile?.display_name ?? 'Votre club'}
            statusLabel="Hors club"
            statusTone="warn"
            metaLine="Rattachez ou créez la structure pour piloter le Ball Club"
          />
          <ClubEmptyState
            title="Aucun club rattaché"
            body="Le Pôle Club (Ball Club) a besoin d’une structure liée. Créez votre club ou rattachez-en un pour voir Accueil, équipes et matchs."
            icon="football"
            actionLabel={profile ? 'Créer mon club' : undefined}
            onAction={profile ? () => setCreateOpen(true) : undefined}
          />
          <ShellAccountSection
            tone={{
              foreground: tokens.foreground,
              muted: tokens.muted,
              faint: tokens.faint,
              surface: tokens.surface,
              border: tokens.border,
              destructive: '#EF4444',
              iconBg: tokens.elevated,
            }}
            onSignOut={shellNav?.signOut}
            safeBottom
          />
        </ClubChapterScroll>
        {profile ? (
          <PushScreenTransition active={createOpen}>
            {createOpen ? (
              <CreateClubScreen
                profile={profile}
                onBack={() => setCreateOpen(false)}
                onCreated={() => {
                  setCreateOpen(false);
                  void ws.refresh();
                }}
              />
            ) : null}
          </PushScreenTransition>
        ) : null}
      </View>
    );
  }

  const name = ws.club.name ?? profile?.display_name ?? 'Club';
  const greet = greetingForHour(new Date().getHours());

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
