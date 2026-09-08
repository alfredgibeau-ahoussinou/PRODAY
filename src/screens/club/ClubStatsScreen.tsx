import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useClubWorkspace } from '../../features/club/hooks/useClubWorkspace';
import { useClubTheme } from '../../features/club/shell/ClubThemeContext';
import { useClubShellNav } from '../../features/club/shell/ClubShellNavContext';
import {
  ClubActionRow,
  ClubChapterScroll,
  ClubEmptyState,
  ClubLoading,
  ClubSectionCard,
  ClubSmartCard,
  ClubText,
} from '../../features/club/ui/clubUi';
import { ClubBrandHeader } from '../../features/club/ui/ClubBrandHeader';
import { isCoachMatchEvent, isCoachTrainingEvent } from '../../models/TeamEvent';
import type { ClubThemeTokens } from '../../features/club/theme/clubTokens';
import { clubSpace } from '../../features/club/theme/clubDesignSystem';

/** Statistiques — insight cards premium et navigations directes. */
export function ClubStatsScreen() {
  const shellNav = useClubShellNav();
  const { tokens } = useClubTheme();
  const ws = useClubWorkspace();
  const styles = useMemo(() => createStyles(tokens), [tokens]);

  if (ws.loading) return <ClubLoading />;

  const matchCount = ws.events.filter((e) => isCoachMatchEvent(e)).length;
  const trainingCount = ws.events.filter((e) => isCoachTrainingEvent(e)).length;
  const playerCount =
    ws.players.length || ws.memberships.filter((m) => m.status === 'active').length;
  const verifiedLicenses = ws.players.filter(
    (p) => (p.profile as Record<string, unknown> | undefined)?.verification_status === 'verified',
  ).length;
  const pendingLicenses = Math.max(0, playerCount - verifiedLicenses);
  const hasData = ws.teams.length > 0 || matchCount > 0 || playerCount > 0;

  return (
    <View style={styles.root}>
      <ClubChapterScroll refreshing={ws.refreshing} onRefresh={() => void ws.refresh()}>
        <ClubBrandHeader title="Statistiques" subtitle="Insights club & pilotage opérationnel" />

        {!hasData ? (
          <ClubEmptyState
            title="Pas encore de données"
            body="Dès que vos équipes, matchs et présences vivent, les insights apparaîtront ici."
            icon="stats-chart"
          />
        ) : (
          <>
            <View style={styles.row}>
              <ClubSmartCard
                index={0}
                label="Équipes"
                value={ws.teams.length}
                icon="football"
                tone="accent"
                hint="Gérer les équipes"
                onPress={() => shellNav?.requestNav('teams')}
              />
              <ClubSmartCard
                index={1}
                label="Joueurs"
                value={playerCount}
                icon="people"
                tone="default"
                hint="Consulter l'effectif"
                onPress={() => shellNav?.requestNav('players')}
              />
            </View>
            <View style={styles.row}>
              <ClubSmartCard
                index={2}
                label="Matchs"
                value={matchCount}
                icon="trophy"
                tone="accent"
                hint="Calendrier & direct"
                onPress={() => shellNav?.requestNav('matches')}
              />
              <ClubSmartCard
                index={3}
                label="Séances"
                value={trainingCount}
                icon="time"
                tone="pitch"
                hint="Présences & séances"
                onPress={() => shellNav?.requestNav('trainings')}
              />
            </View>

            <ClubSectionCard title="Pilotage & Actions Rapides">
              {ws.teamsWithoutCoach > 0 ? (
                <ClubActionRow
                  icon="school"
                  label={`${ws.teamsWithoutCoach} équipe(s) sans coach`}
                  hint="Affecter un entraîneur depuis l'annuaire staff"
                  onPress={() => shellNav?.requestNav('coaches')}
                />
              ) : null}

              {ws.pendingMemberships > 0 ? (
                <ClubActionRow
                  icon="checkmark-circle"
                  label={`${ws.pendingMemberships} adhésion(s) en attente`}
                  hint="Confirmer les joueurs / coaches dans Joueurs"
                  onPress={() =>
                    shellNav?.openPlayersPending?.() ?? shellNav?.requestNav('players')
                  }
                />
              ) : null}

              <ClubActionRow
                icon="document"
                label="Import Squad (CSV FootClubs)"
                hint="Peupler effectif & cache inscription FFF"
                onPress={() => shellNav?.requestNav('players')}
              />

              <ClubActionRow
                icon="trophy"
                label="Classements FFF (R1 / R2 / National)"
                hint="Leaderboards sync quotidien — Matchs"
                onPress={() => shellNav?.requestNav('matches')}
              />

              <ClubActionRow
                icon="document"
                label="Licences & Documents FFF"
                hint={`${verifiedLicenses} certifiée(s) · ${pendingLicenses} en attente Footclubs`}
                onPress={() => shellNav?.requestNav('licenses')}
              />

              <ClubActionRow
                icon="bag"
                label="Trésorerie & Cotisations"
                hint="Solde du club et mouvements financiers"
                onPress={() => shellNav?.requestNav('finances')}
              />

              <ClubActionRow
                icon="gift"
                label="Sponsoring & Partenariats"
                hint="Packages maillots et dossiers partenaires"
                onPress={() => shellNav?.requestNav('sponsoring')}
              />
            </ClubSectionCard>
          </>
        )}
      </ClubChapterScroll>
    </View>
  );
}

const createStyles = (tokens: ClubThemeTokens) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: 'transparent' },
    row: { flexDirection: 'row', gap: clubSpace.md },
  });
