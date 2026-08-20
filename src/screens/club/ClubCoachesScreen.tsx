import React, { useMemo, useState } from 'react';
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
import { teamsService } from '../../services/teams.service';
import type { ClubThemeTokens } from '../../features/club/theme/clubTokens';
import type { User } from '../../models/User';
import type { Team } from '../../models/Team';

/** Équipe des coachs — affectation / retrait via teamsService. */
export function ClubCoachesScreen() {
  const shellNav = useClubShellNav();
  const { tokens } = useClubTheme();
  const ws = useClubWorkspace();
  const [busy, setBusy] = useState(false);
  const styles = useMemo(() => createStyles(tokens), [tokens]);

  if (ws.loading) return <ClubLoading />;

  const teamsByCoach = (uid: string) =>
    ws.teams.filter((t) => t.coach_uids?.includes(uid));

  const assignCoach = (coach: User, team: Team) => {
    Alert.alert(
      'Affecter le coach',
      `Affecter ${coach.display_name || 'ce coach'} à « ${team.name} » ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Affecter',
          onPress: () =>
            void (async () => {
              setBusy(true);
              try {
                await teamsService.assignCoach(team.id, coach.uid);
                await ws.refresh();
              } catch (e) {
                Alert.alert('Erreur', e instanceof Error ? e.message : 'Affectation impossible.');
              } finally {
                setBusy(false);
              }
            })(),
        },
      ],
    );
  };

  const removeCoach = (coach: User, team: Team) => {
    Alert.alert(
      'Retirer le coach',
      `Retirer ${coach.display_name || 'ce coach'} de « ${team.name} » ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Retirer',
          style: 'destructive',
          onPress: () =>
            void (async () => {
              setBusy(true);
              try {
                await teamsService.removeCoach(team.id, coach.uid);
                await ws.refresh();
              } catch (e) {
                Alert.alert('Erreur', e instanceof Error ? e.message : 'Retrait impossible.');
              } finally {
                setBusy(false);
              }
            })(),
        },
      ],
    );
  };

  const openCoachActions = (c: User) => {
    const assigned = teamsByCoach(c.uid);
    const unassigned = ws.teams.filter((t) => !t.coach_uids?.includes(c.uid));
    const buttons: {
      text: string;
      style?: 'cancel' | 'destructive';
      onPress?: () => void;
    }[] = [{ text: 'Fermer', style: 'cancel' }];

    unassigned.slice(0, 5).forEach((t) => {
      buttons.push({
        text: `Affecter → ${t.name}`,
        onPress: () => assignCoach(c, t),
      });
    });
    assigned.slice(0, 5).forEach((t) => {
      buttons.push({
        text: `Retirer de ${t.name}`,
        style: 'destructive',
        onPress: () => removeCoach(c, t),
      });
    });

    Alert.alert(
      c.display_name || 'Coach',
      'Affecter ou retirer d’une équipe. L’IA ne déplace jamais les joueurs automatiquement.',
      buttons,
    );
  };

  const assignToTeam = (team: Team) => {
    if (ws.coaches.length === 0) {
      Alert.alert('Aucun coach', 'Ajoutez d’abord un coach via CRÉER.');
      return;
    }
    Alert.alert(
      team.name,
      'Choisir un coach à affecter',
      [
        { text: 'Annuler', style: 'cancel' },
        ...ws.coaches.slice(0, 6).map((c) => ({
          text: c.display_name || 'Coach',
          onPress: () => assignCoach(c, team),
        })),
      ],
    );
  };

  return (
    <View style={styles.root}>
      <ClubChapterScroll refreshing={ws.refreshing || busy} onRefresh={() => void ws.refresh()}>
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
              const teams = teamsByCoach(c.uid).map((t) => t.name);
              return (
                <ClubActionRow
                  key={c.uid}
                  icon="school"
                  label={c.display_name || 'Coach'}
                  hint={teams.length ? teams.join(' · ') : 'Non affecté'}
                  onPress={() => openCoachActions(c)}
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
                  hint="Sans coach — toucher pour affecter"
                  onPress={() => assignToTeam(t)}
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
