import React, { useMemo } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSessionProfile } from '../../hooks/useSessionProfile';
import { useClubWorkspace } from '../../features/club/hooks/useClubWorkspace';
import { useClubShellNav } from '../../features/club/shell/ClubShellNavContext';
import { useClubTheme } from '../../features/club/shell/ClubThemeContext';
import {
  ClubActionRow,
  ClubChapterScroll,
  ClubEmptyState,
  ClubLoading,
  ClubSectionCard,
  ClubSmartCard,
  ClubStatusPill,
  ClubText,
} from '../../features/club/ui/clubUi';
import { ClubBrandHeader } from '../../features/club/ui/ClubBrandHeader';
import { ClubTeamCard } from '../../features/club/ui/ClubTeamCard';
import type { ClubThemeTokens } from '../../features/club/theme/clubTokens';
import { clubChrome, clubSpace } from '../../features/club/theme/clubDesignSystem';

function greetingForHour(h: number): string {
  if (h < 12) return 'Bonjour';
  if (h < 18) return 'Bon après-midi';
  return 'Bonsoir';
}

function nextMatchHint(ws: ReturnType<typeof useClubWorkspace>): string {
  const m = ws.todayMatches[0] ?? ws.events.find((e) => e.starts_at && e.starts_at >= new Date());
  if (!m?.starts_at) return 'Aucun match planifié';
  return m.starts_at.toLocaleString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function nextTrainingHint(ws: ReturnType<typeof useClubWorkspace>): string {
  const t = ws.todayTrainings[0];
  if (!t?.starts_at) return 'Aucune séance aujourd’hui';
  return t.starts_at.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

/** Accueil Club — greeting + ligne dynamique + smart cards premium. */
export function ClubHomeScreen() {
  const profile = useSessionProfile();
  const shellNav = useClubShellNav();
  const { tokens, logoUrl } = useClubTheme();
  const ws = useClubWorkspace();
  const { width } = useWindowDimensions();
  const styles = useMemo(() => createStyles(tokens), [tokens]);
  const multiCol = width >= clubChrome.tabletBreakpoint;

  if (ws.loading) return <ClubLoading />;

  const name = ws.club?.name ?? profile?.display_name ?? 'Club';
  const greet = greetingForHour(new Date().getHours());
  const dynamicLine =
    ws.briefingHeadline?.trim() ||
    (ws.todoCount > 0
      ? `${ws.todoCount} point(s) à traiter aujourd’hui`
      : 'Le club est à jour — bonne session.');

  const hasToday =
    ws.todayMatches.length > 0 || ws.todayTrainings.length > 0 || ws.pendingMemberships > 0;

  return (
    <View style={styles.root}>
      <ClubChapterScroll refreshing={ws.refreshing} onRefresh={() => void ws.refresh()}>
        <ClubBrandHeader
          title={`${greet}`}
          subtitle={name}
          right={<ClubStatusPill label={ws.statusLabel} tone={ws.statusTone} />}
        />

        <ClubText variant="body" muted style={styles.dynamic}>
          {dynamicLine}
        </ClubText>

        <View style={[styles.smartGrid, multiCol && styles.smartGridWide]}>
          <ClubSmartCard
            index={0}
            label="Prochain match"
            value={ws.todayMatches.length || '—'}
            hint={nextMatchHint(ws)}
            icon="trophy"
            tone="accent"
            onPress={() => shellNav?.requestNav('matches')}
          />
          <ClubSmartCard
            index={1}
            label="Entraînement"
            value={ws.todayTrainings.length || '—'}
            hint={nextTrainingHint(ws)}
            icon="football"
            tone="pitch"
            onPress={() => shellNav?.requestNav('trainings')}
          />
          <ClubSmartCard
            index={2}
            label="Effectif"
            value={ws.players.length}
            hint={`${ws.pendingMemberships} adhésion(s) en attente`}
            icon="people"
            tone="default"
            onPress={() => shellNav?.requestNav('players')}
          />
          <ClubSmartCard
            index={3}
            label="Coachs"
            value={ws.coaches.length}
            hint={
              ws.teamsWithoutCoach > 0
                ? `${ws.teamsWithoutCoach} équipe(s) sans coach`
                : 'Staff à jour'
            }
            icon="school"
            tone={ws.teamsWithoutCoach > 0 ? 'warning' : 'success'}
            onPress={() => shellNav?.requestNav('coaches')}
          />
          <ClubSmartCard
            index={4}
            label="À faire"
            value={ws.todoCount}
            hint={ws.briefingSummary || 'Rien d’urgent'}
            icon="checkmark-circle"
            tone={ws.todoCount > 0 ? 'warning' : 'success'}
            onPress={() => shellNav?.requestNav('assistant')}
          />
        </View>

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
                  hint={
                    e.starts_at
                      ? new Date(e.starts_at).toLocaleTimeString('fr-FR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : undefined
                  }
                  onPress={() => shellNav?.requestNav('matches')}
                />
              ))}
              {ws.todayTrainings.map((e) => (
                <ClubActionRow
                  key={e.id}
                  icon="football"
                  label={e.title || 'Entraînement'}
                  hint={
                    e.starts_at
                      ? new Date(e.starts_at).toLocaleTimeString('fr-FR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : undefined
                  }
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
    root: { flex: 1, backgroundColor: 'transparent' },
    dynamic: { marginTop: -4, marginBottom: 4, lineHeight: 21 },
    list: { gap: clubSpace.sm },
    chapter: { gap: clubSpace.sm },
    smartGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: clubSpace.md,
    },
    smartGridWide: {},
  });
