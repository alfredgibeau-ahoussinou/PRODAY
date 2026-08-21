import React, { useCallback, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSessionProfile } from '../../hooks/useSessionProfile';
import { useClubWorkspace } from '../../features/club/hooks/useClubWorkspace';
import { useClubLogoUpload } from '../../features/club/hooks/useClubLogoUpload';
import { useClubShellNav } from '../../features/club/shell/ClubShellNavContext';
import { useClubTheme } from '../../features/club/shell/ClubThemeContext';
import {
  ClubActionRow,
  ClubChapterScroll,
  ClubEmptyState,
  ClubLoading,
  ClubText,
} from '../../features/club/ui/clubUi';
import {
  ClubHomeAiHero,
  ClubHomeIdentityHeader,
  ClubHomeKpiStrip,
  ClubHomeNextEventRow,
  ClubHomeTodayTimeline,
  ClubHomeTodoSection,
  type ClubHomePriority,
} from '../../features/club/ui/ClubHomeAccueil';
import { ClubTeamCard } from '../../features/club/ui/ClubTeamCard';
import type { ClubThemeTokens } from '../../features/club/theme/clubTokens';
import { clubSpace } from '../../features/club/theme/clubDesignSystem';
import {
  isCoachMatchEvent,
  isCoachTrainingEvent,
  type TeamEvent,
} from '../../models/TeamEvent';

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

/** Accueil Club — composition premium football (identité + hero + KPI + listes). */
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
  ];

  const todayItems = [
    ...ws.todayMatches.map((e) => ({
      id: `m-${e.id}`,
      kind: 'match' as const,
      label: e.title || 'Match',
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
      label: e.title || 'Entraînement',
      time: e.starts_at
        ? new Date(e.starts_at).toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit',
          })
        : undefined,
      onPress: () => shellNav?.requestNav('trainings'),
    })),
    ...(ws.pendingMemberships > 0
      ? [
          {
            id: 'pending-today',
            kind: 'alert' as const,
            label: `${ws.pendingMemberships} adhésion(s) en attente`,
            time: 'À valider',
            onPress: () => shellNav?.requestNav('players'),
          },
        ]
      : []),
  ];

  const onHeroPress = () => {
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

        <ClubHomeAiHero
          headline={ws.briefingHeadline}
          summary={ws.briefingSummary}
          onOpenCopilot={() => shellNav?.requestNav('assistant')}
        />

        <ClubHomeNextEventRow priority={priority} onPress={onHeroPress} />

        <ClubHomeKpiStrip
          players={ws.players.length}
          coaches={ws.coaches.length}
          actions={ws.todoCount}
          playersHint={
            ws.pendingMemberships > 0
              ? `${ws.pendingMemberships} en attente`
              : `${ws.players.length} joueur(s)`
          }
          coachesHint={
            ws.teamsWithoutCoach > 0
              ? `${ws.teamsWithoutCoach} équipe(s) sans coach`
              : 'Staff à jour'
          }
          onPlayers={() => shellNav?.requestNav('players')}
          onCoaches={() => shellNav?.requestNav('coaches')}
          onActions={() => shellNav?.requestNav('assistant')}
        />

        <ClubHomeTodoSection
          items={todoItems}
          emptySummary={ws.briefingSummary || 'Rien d’urgent — le club est à jour.'}
        />

        <ClubHomeTodayTimeline items={todayItems} />

        <View style={styles.chapter}>
          <ClubText variant="label" muted>
            Mes équipes
          </ClubText>
          {ws.teamRows.length === 0 ? (
            <ClubEmptyState
              title="Aucune équipe"
              body="Créez vos catégories (U7, U9… Seniors) pour piloter effectifs et calendrier."
              actionLabel="Voir les équipes"
              onAction={() => shellNav?.requestNav('teams')}
            />
          ) : (
            <View style={styles.list}>
              {ws.teamRows.slice(0, 4).map((row, index) => (
                <ClubTeamCard
                  key={row.teamId}
                  row={row}
                  index={index}
                  logoUrl={logoUrl}
                  onPress={() => {
                    shellNav?.setSelectedTeamId?.(row.teamId);
                    shellNav?.requestNav('teams');
                  }}
                />
              ))}
              {ws.teamRows.length > 4 ? (
                <ClubActionRow
                  label={`Voir les ${ws.teamRows.length} équipes`}
                  onPress={() => shellNav?.requestNav('teams')}
                />
              ) : null}
            </View>
          )}
        </View>

        <View style={styles.chapter}>
          <ClubText variant="label" muted>
            Raccourcis
          </ClubText>
          <View style={styles.list}>
            <ClubActionRow
              icon="add"
              label="Créer"
              hint="Match, séance, joueur, invitation…"
              onPress={() => shellNav?.openCreate?.()}
            />
            <ClubActionRow
              icon="chat"
              label="Copilote Club"
              hint="Dialogue IA · confirmation obligatoire"
              onPress={() => shellNav?.requestNav('assistant')}
            />
            <ClubActionRow
              icon="mail"
              label="Communication"
              onPress={() => shellNav?.requestNav('communication')}
            />
          </View>
        </View>
      </ClubChapterScroll>
    </View>
  );
}

const createStyles = (_tokens: ClubThemeTokens) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: 'transparent' },
    list: { gap: clubSpace.sm },
    chapter: { gap: clubSpace.sm },
  });
