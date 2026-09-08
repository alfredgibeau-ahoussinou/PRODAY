import React, { useCallback, useMemo, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { useSessionProfile } from '../../hooks/useSessionProfile';
import { useClubWorkspace } from '../../features/club/hooks/useClubWorkspace';
import { useClubLogoUpload } from '../../features/club/hooks/useClubLogoUpload';
import { useClubShellNav } from '../../features/club/shell/ClubShellNavContext';
import { useClubTheme } from '../../features/club/shell/ClubThemeContext';
import {
  ClubChapterScroll,
  ClubEmptyState,
  ClubLoading,
  ClubText,
} from '../../features/club/ui/clubUi';
import {
  ClubHomeAiBriefingCard,
  ClubHomeIdentityHeader,
  ClubHomeNextEventRow,
  ClubHomeTeamsRail,
  ClubHomeTodoSection,
} from '../../features/club/ui/ClubHomeAccueil';
import { ClubPlayersPendingRow } from '../../features/club/ui/ClubPlayersChrome';
import {
  buildClubHomeTeamCards,
  formatClubHomeMetaLine,
  greetingForHour,
  resolveClubHomePriority,
  resolveClubPresenceAlert,
  resolvePriorityLocationLabel,
  resolvePriorityTeamLabel,
} from '../../features/club/ui/clubHomeAccueilModel';
import { listPendingMembershipPlayers } from '../../features/club/ui/clubPlayersModel';
import type { ClubThemeTokens } from '../../features/club/theme/clubTokens';
import { getPendingInviteeUids } from '../../models/TeamEvent';
import { membershipsService } from '../../services/memberships.service';
import { clubSpace } from '../../features/club/theme/clubDesignSystem';
import { PushScreenTransition } from '../../components/motion';
import { CreateClubScreen } from '../CreateClubScreen';
import { ShellAccountSection } from '../../components/shell/ShellAccountSection';

const MAX_TODO_ITEMS = 3;
const MAX_TEAM_CARDS = 4;

/**
 * Accueil Club (Ball Club / Pôle Club) — Cockpit exécutif, fluide et complet.
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

  const [busyMembershipId, setBusyMembershipId] = useState<string | null>(null);

  const playersByUid = useMemo(() => {
    const map = new Map<string, (typeof ws.members)[number]>();
    ws.members.forEach((m) => map.set(m.uid, m));
    ws.players.forEach((p) => map.set(p.uid, p));
    return map;
  }, [ws.members, ws.players]);

  const pendingItems = useMemo(
    () =>
      listPendingMembershipPlayers({
        memberships: ws.memberships,
        playersByUid,
      }).slice(0, 5),
    [ws.memberships, playersByUid],
  );

  const approveMembership = useCallback(
    async (membershipId: string) => {
      if (!profile?.uid) {
        Alert.alert('Connexion requise', 'Reconnectez-vous pour confirmer une adhésion.');
        return;
      }
      setBusyMembershipId(membershipId);
      try {
        await membershipsService.approve(membershipId, profile.uid);
        await ws.refresh();
      } catch (e) {
        Alert.alert('Adhésion', e instanceof Error ? e.message : 'Confirmation impossible.');
      } finally {
        setBusyMembershipId(null);
      }
    },
    [profile?.uid, ws],
  );

  const rejectMembership = useCallback(
    async (membershipId: string) => {
      if (!profile?.uid) {
        Alert.alert('Connexion requise', 'Reconnectez-vous pour refuser une adhésion.');
        return;
      }
      Alert.alert('Refuser cette adhésion ?', 'Le membre restera hors effectif actif.', [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Refuser',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              setBusyMembershipId(membershipId);
              try {
                await membershipsService.reject(membershipId, profile.uid);
                await ws.refresh();
              } catch (e) {
                Alert.alert('Adhésion', e instanceof Error ? e.message : 'Refus impossible.');
              } finally {
                setBusyMembershipId(null);
              }
            })();
          },
        },
      ]);
    },
    [profile?.uid, ws],
  );

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
                  ? `${presence.pendingCount} réponses RSVP en attente`
                  : '1 réponse RSVP en attente',
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
              hint: 'Affecter un coach depuis le staff',
              onPress: () => shellNav?.requestNav('coaches'),
            },
          ]
        : []),
      ...(ws.pendingMemberships > 0
        ? [
            {
              id: 'pending',
              icon: 'checkmark-circle' as const,
              label: 'Confirmer les adhésions',
              hint: `${ws.pendingMemberships} en attente`,
              onPress: () =>
                shellNav?.openPlayersPending?.() ?? shellNav?.requestNav('players'),
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
        {/* 1. En-Tête Identité & Santé du Club */}
        <ClubHomeIdentityHeader
          greeting={greet}
          clubName={name}
          statusLabel={ws.statusLabel}
          statusTone={ws.statusTone}
          metaLine={formatClubHomeMetaLine(ws.players.length, ws.coaches.length, ws.teams.length)}
          onPressCrest={logo.canEdit ? () => void logo.pickAndUpload() : undefined}
          crestUploading={logo.uploading}
          playersCount={ws.players.length}
          coachesCount={ws.coaches.length}
          teamsCount={ws.teams.length}
          onPlayersPress={() => shellNav?.requestNav('players')}
          onCoachesPress={() => shellNav?.requestNav('coaches')}
          onTeamsPress={() => shellNav?.requestNav('teams')}
        />

        {/* 2. Match Center / Prochaine Échéance */}
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

        {/* 3. Demandes d’adhésion à confirmer */}
        {pendingItems.length > 0 ? (
          <View style={styles.pendingBlock}>
            <View style={styles.pendingHead}>
              <ClubText variant="label" muted>
                À confirmer
              </ClubText>
              <ClubText variant="caption" muted>
                {ws.pendingMemberships}
              </ClubText>
            </View>
            <View style={styles.pendingList}>
              {pendingItems.map((item) => {
                const roleBadge =
                  item.membership.role === 'coach'
                    ? 'Coach'
                    : item.membership.role === 'parent'
                      ? 'Parent'
                      : 'Joueur';
                return (
                  <ClubPlayersPendingRow
                    key={item.membership.id}
                    name={item.name}
                    roleBadge={roleBadge}
                    categoryHint={item.membership.category}
                    identityDocName={item.membership.identity_document_name}
                    identityDocType={item.membership.identity_document_type}
                    busy={busyMembershipId === item.membership.id}
                    onOpen={() => {
                      shellNav?.setSelectedPlayerUid?.(item.membership.player_uid);
                      shellNav?.requestNav('players');
                    }}
                    onApprove={() => void approveMembership(item.membership.id)}
                    onReject={() => void rejectMembership(item.membership.id)}
                  />
                );
              })}
            </View>
          </View>
        ) : null}

        {/* 4. Équipes & Effectif */}
        <ClubHomeTeamsRail
          teams={teamCards}
          onSeeAll={() => shellNav?.requestNav('teams')}
          onCreateTeam={() => shellNav?.requestNav('teams')}
        />

        {/* 5. Widget Copilote IA Club */}
        <ClubHomeAiBriefingCard
          onOpenCopilot={() => shellNav?.requestNav('assistant')}
        />

        {/* 6. Alertes & Opérations (si requises) */}
        {todoItems.length > 0 ? (
          <ClubHomeTodoSection items={todoItems} />
        ) : null}
      </ClubChapterScroll>
    </View>
  );
}

const createStyles = (_tokens: ClubThemeTokens) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: 'transparent' },
    pendingBlock: {
      gap: clubSpace.sm,
      marginBottom: clubSpace.md,
    },
    pendingHead: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 2,
    },
    pendingList: { gap: clubSpace.sm },
  });
