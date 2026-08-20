import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSessionProfile } from '../../hooks/useSessionProfile';
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
  ClubStatusPill,
  ClubText,
} from '../../features/club/ui/clubUi';
import { formatTeamRowLabel } from '../../utils/clubStructureView';
import { spacing } from '../../theme/designTokens';
import type { ClubThemeTokens } from '../../features/club/theme/clubTokens';

function greetingForHour(h: number): string {
  if (h < 12) return 'Bonjour';
  if (h < 18) return 'Bon après-midi';
  return 'Bonsoir';
}

/** Accueil Club — centre de contrôle (AUJOURD’HUI · À FAIRE · statut). */
export function ClubHomeScreen() {
  const profile = useSessionProfile();
  const shellNav = useClubShellNav();
  const { tokens } = useClubTheme();
  const ws = useClubWorkspace();
  const styles = useMemo(() => createStyles(tokens), [tokens]);

  if (ws.loading) return <ClubLoading />;

  const name = ws.club?.name ?? profile?.display_name ?? 'Club';
  const greet = greetingForHour(new Date().getHours());
  const hasToday =
    ws.todayMatches.length > 0 || ws.todayTrainings.length > 0 || ws.pendingMemberships > 0;

  return (
    <View style={styles.root}>
      <ClubChapterScroll refreshing={ws.refreshing} onRefresh={() => void ws.refresh()}>
        <ClubScreenHeader
          title={`${greet}`}
          subtitle={name}
          right={<ClubStatusPill label={ws.statusLabel} tone={ws.statusTone} />}
        />

        <ClubSectionCard title="Aujourd’hui">
          {!hasToday ? (
            <ClubText variant="body" muted>
              Aucun match, entraînement ni absence signalée pour aujourd’hui.
            </ClubText>
          ) : (
            <View style={styles.list}>
              {ws.todayMatches.map((e) => (
                <ClubActionRow
                  key={e.id}
                  icon="trophy"
                  label={e.title || 'Match'}
                  hint={e.starts_at ? new Date(e.starts_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : undefined}
                  onPress={() => shellNav?.requestNav('matches')}
                />
              ))}
              {ws.todayTrainings.map((e) => (
                <ClubActionRow
                  key={e.id}
                  icon="football"
                  label={e.title || 'Entraînement'}
                  hint={e.starts_at ? new Date(e.starts_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : undefined}
                  onPress={() => shellNav?.requestNav('trainings')}
                />
              ))}
              {ws.pendingMemberships > 0 ? (
                <ClubActionRow
                  icon="people"
                  label={`${ws.pendingMemberships} adhésion(s) en attente`}
                  hint="À valider"
                  onPress={() => shellNav?.requestNav('players')}
                />
              ) : null}
            </View>
          )}
        </ClubSectionCard>

        <ClubSectionCard title="À faire">
          {ws.todoCount === 0 ? (
            <ClubText variant="body" muted>
              {ws.briefingSummary || 'Rien d’urgent — le club est à jour.'}
            </ClubText>
          ) : (
            <View style={styles.list}>
              {ws.teamsWithoutCoach > 0 ? (
                <ClubActionRow
                  icon="school"
                  label={`${ws.teamsWithoutCoach} équipe(s) sans coach`}
                  hint="Affecter un coach — l’IA ne déplace jamais les joueurs."
                  onPress={() => shellNav?.requestNav('coaches')}
                />
              ) : null}
              {ws.pendingMemberships > 0 ? (
                <ClubActionRow
                  icon="checkmark-circle"
                  label="Valider les adhésions"
                  hint={`${ws.pendingMemberships} en attente`}
                  onPress={() => shellNav?.requestNav('players')}
                />
              ) : null}
              {ws.teams.length === 0 ? (
                <ClubActionRow
                  icon="add"
                  label="Créer la première équipe"
                  hint="U7 → Seniors"
                  onPress={() => shellNav?.openCreate?.('player') ?? shellNav?.requestNav('teams')}
                />
              ) : null}
            </View>
          )}
        </ClubSectionCard>

        <ClubSectionCard title="Mes équipes">
          {ws.teamRows.length === 0 ? (
            <ClubEmptyState
              title="Aucune équipe"
              body="Créez vos catégories (U7, U9… Seniors) pour piloter effectifs et calendrier."
              actionLabel="Voir les équipes"
              onAction={() => shellNav?.requestNav('teams')}
            />
          ) : (
            <View style={styles.list}>
              {ws.teamRows.slice(0, 4).map((row) => (
                <ClubActionRow
                  key={row.teamId}
                  icon="football"
                  label={formatTeamRowLabel(row)}
                  hint={`${row.licensedCount} joueur(s)${row.coachNames.length ? ` · ${row.coachNames.join(', ')}` : ''}`}
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
        </ClubSectionCard>

        <ClubSectionCard title="Raccourcis">
          <ClubActionRow
            icon="add"
            label="Créer"
            hint="Match, séance, joueur, invitation…"
            onPress={() => shellNav?.openCreate?.()}
          />
          <ClubActionRow
            icon="star-four-points"
            label="Assistant IA"
            hint="Recommandations uniquement — confirmation avant action sensible"
            onPress={() => shellNav?.requestNav('assistant')}
          />
          <ClubActionRow
            icon="chat"
            label="Communication"
            onPress={() => shellNav?.requestNav('communication')}
          />
        </ClubSectionCard>
      </ClubChapterScroll>
    </View>
  );
}

const createStyles = (tokens: ClubThemeTokens) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: tokens.bg },
    list: { gap: spacing.xs },
  });
