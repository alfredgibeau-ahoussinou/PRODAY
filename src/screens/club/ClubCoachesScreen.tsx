import React, { useMemo } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
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
import type { ClubThemeTokens } from '../../features/club/theme/clubTokens';

/** Équipe des coachs — affectation / rôle / planning (UI + APIs existantes). */
export function ClubCoachesScreen() {
  const shellNav = useClubShellNav();
  const { tokens } = useClubTheme();
  const ws = useClubWorkspace();
  const styles = useMemo(() => createStyles(tokens), [tokens]);

  if (ws.loading) return <ClubLoading />;

  const teamsByCoach = (uid: string) =>
    ws.teams.filter((t) => t.coach_uids?.includes(uid)).map((t) => t.name);

  return (
    <View style={styles.root}>
      <ClubChapterScroll refreshing={ws.refreshing} onRefresh={() => void ws.refresh()}>
        <ClubScreenHeader
          title="Coach"
          subtitle={`${ws.coaches.length} coach(s) · ${ws.teamsWithoutCoach} équipe(s) sans affectation`}
        />

        {ws.coaches.length === 0 ? (
          <ClubEmptyState
            title="Aucun coach"
            body="Invitez un coach ou affectez un membre staff à une équipe."
            actionLabel="Ajouter un coach"
            onAction={() => shellNav?.openCreate?.('coach')}
            icon="school"
          />
        ) : (
          <ClubSectionCard title="Staff">
            {ws.coaches.map((c) => {
              const teams = teamsByCoach(c.uid);
              return (
                <ClubActionRow
                  key={c.uid}
                  icon="school"
                  label={c.display_name || 'Coach'}
                  hint={teams.length ? teams.join(' · ') : 'Non affecté'}
                  onPress={() =>
                    Alert.alert(
                      c.display_name || 'Coach',
                      'Affecter / retirer / rôle / planning : utilisez la gestion d’équipe. L’IA ne déplace jamais les joueurs automatiquement.',
                      [
                        { text: 'OK', style: 'cancel' },
                        {
                          text: 'Voir équipes',
                          onPress: () => shellNav?.requestNav('teams'),
                        },
                      ],
                    )
                  }
                />
              );
            })}
          </ClubSectionCard>
        )}

        {ws.teamsWithoutCoach > 0 ? (
          <ClubSectionCard title="À affecter">
            {ws.teams
              .filter((t) => !(t.coach_uids?.length > 0))
              .map((t) => (
                <ClubActionRow
                  key={t.id}
                  icon="warning"
                  label={t.name}
                  hint="Sans coach"
                  onPress={() => {
                    shellNav?.setSelectedTeamId?.(t.id);
                    shellNav?.requestNav('teams');
                  }}
                />
              ))}
          </ClubSectionCard>
        ) : null}

        <ClubText variant="caption" muted>
          Rôles : Admin · Dirigeant · DS · Coach · Assistant — voir Permissions.
        </ClubText>
      </ClubChapterScroll>
    </View>
  );
}

const createStyles = (tokens: ClubThemeTokens) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: tokens.bg },
  });
