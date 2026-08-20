import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { PressableSpring } from '../../components/motion';
import { Icon } from '../../components/ui/Icon';
import { useClubWorkspace } from '../../features/club/hooks/useClubWorkspace';
import { useClubShellNav } from '../../features/club/shell/ClubShellNavContext';
import { useClubTheme } from '../../features/club/shell/ClubThemeContext';
import {
  ClubActionRow,
  ClubChapterScroll,
  ClubEmptyState,
  ClubLoading,
  ClubScreenHeader,
  ClubSectionCard,
  ClubText,
} from '../../features/club/ui/clubUi';
import { formatTeamRowLabel } from '../../utils/clubStructureView';
import { isCoachMatchEvent, isCoachTrainingEvent } from '../../models/TeamEvent';
import { spacing } from '../../theme/designTokens';
import type { ClubThemeTokens } from '../../features/club/theme/clubTokens';

type Props = {
  teamId: string;
  onBack: () => void;
};

/** Espace équipe — prochain match/séance + sections. */
export function ClubTeamSpaceScreen({ teamId, onBack }: Props) {
  const shellNav = useClubShellNav();
  const { tokens } = useClubTheme();
  const ws = useClubWorkspace();
  const styles = useMemo(() => createStyles(tokens), [tokens]);

  if (ws.loading) return <ClubLoading />;

  const row = ws.teamRows.find((t) => t.teamId === teamId);
  const team = ws.teams.find((t) => t.id === teamId);
  const teamEvents = ws.events.filter((e) => e.team_id === teamId);
  const nextMatch = teamEvents.find((e) => isCoachMatchEvent(e) && e.starts_at >= new Date());
  const nextTraining = teamEvents.find(
    (e) => isCoachTrainingEvent(e) && e.starts_at >= new Date(),
  );
  const rosterCount = ws.memberships.filter(
    (m) => m.status === 'active' && m.team_id === teamId,
  ).length;

  return (
    <View style={styles.root}>
      <ClubChapterScroll refreshing={ws.refreshing} onRefresh={() => void ws.refresh()}>
        <PressableSpring onPress={onBack} scaleTo={0.97} haptic style={styles.back}>
          <Icon name="arrow-back" size={18} color={tokens.accent} />
          <ClubText variant="caption" style={{ color: tokens.accent, fontWeight: '700' }}>
            Équipes
          </ClubText>
        </PressableSpring>

        <ClubScreenHeader
          title={row ? formatTeamRowLabel(row) : team?.name ?? 'Équipe'}
          subtitle={row?.coachNames.length ? `Coach : ${row.coachNames.join(', ')}` : 'Sans coach affecté'}
        />

        <ClubSectionCard title="Prochainement">
          {nextMatch ? (
            <ClubActionRow
              icon="trophy"
              label={nextMatch.title || 'Match'}
              hint={nextMatch.starts_at.toLocaleString('fr-FR')}
              onPress={() => shellNav?.requestNav('matches')}
            />
          ) : (
            <ClubText variant="body" muted>
              Aucun match à venir pour cette équipe.
            </ClubText>
          )}
          {nextTraining ? (
            <ClubActionRow
              icon="time"
              label={nextTraining.title || 'Entraînement'}
              hint={nextTraining.starts_at.toLocaleString('fr-FR')}
              onPress={() => shellNav?.requestNav('trainings')}
            />
          ) : null}
        </ClubSectionCard>

        <ClubSectionCard title="Sections">
          <ClubActionRow
            icon="people"
            label="Effectif"
            hint={`${rosterCount} joueur(s)`}
            onPress={() => shellNav?.requestNav('players')}
          />
          <ClubActionRow
            icon="calendar"
            label="Calendrier"
            onPress={() => shellNav?.requestNav('calendar')}
          />
          <ClubActionRow
            icon="trophy"
            label="Matchs"
            onPress={() => shellNav?.requestNav('matches')}
          />
          <ClubActionRow
            icon="football"
            label="Entraînements"
            onPress={() => shellNav?.requestNav('trainings')}
          />
          <ClubActionRow
            icon="chat"
            label="Communication"
            onPress={() => shellNav?.requestNav('communication')}
          />
          <ClubActionRow
            icon="stats-chart"
            label="Statistiques"
            onPress={() => shellNav?.requestNav('stats')}
          />
        </ClubSectionCard>

        {!row && !team ? (
          <ClubEmptyState
            title="Équipe introuvable"
            body="Cette équipe n’existe plus ou n’est pas liée à votre club."
            actionLabel="Retour"
            onAction={onBack}
          />
        ) : null}
      </ClubChapterScroll>
    </View>
  );
}

const createStyles = (tokens: ClubThemeTokens) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: tokens.bg },
    back: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      alignSelf: 'flex-start',
      paddingVertical: spacing.xs,
    },
  });
