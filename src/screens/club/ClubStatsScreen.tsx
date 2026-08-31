import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useClubWorkspace } from '../../features/club/hooks/useClubWorkspace';
import { useClubTheme } from '../../features/club/shell/ClubThemeContext';
import {
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

/** Statistiques — insight cards premium, peu de graphiques. */
export function ClubStatsScreen() {
  const { tokens } = useClubTheme();
  const ws = useClubWorkspace();
  const styles = useMemo(() => createStyles(tokens), [tokens]);

  if (ws.loading) return <ClubLoading />;

  const matchCount = ws.events.filter((e) => isCoachMatchEvent(e)).length;
  const trainingCount = ws.events.filter((e) => isCoachTrainingEvent(e)).length;
  const playerCount =
    ws.players.length || ws.memberships.filter((m) => m.status === 'active').length;
  const hasData = ws.teams.length > 0 || matchCount > 0 || playerCount > 0;

  return (
    <View style={styles.root}>
      <ClubChapterScroll refreshing={ws.refreshing} onRefresh={() => void ws.refresh()}>
        <ClubBrandHeader title="Statistiques" subtitle="Insights club — pas 50 graphiques" />

        {!hasData ? (
          <ClubEmptyState
            title="Pas encore de données"
            body="Dès que vos équipes, matchs et présences vivent, les insights apparaîtront ici."
            icon="stats-chart"
          />
        ) : (
          <>
            <View style={styles.row}>
              <ClubSmartCard index={0} label="Équipes" value={ws.teams.length} icon="football" tone="accent" />
              <ClubSmartCard index={1} label="Joueurs" value={playerCount} icon="people" tone="default" />
            </View>
            <View style={styles.row}>
              <ClubSmartCard index={2} label="Matchs" value={matchCount} icon="trophy" tone="accent" />
              <ClubSmartCard index={3} label="Séances" value={trainingCount} icon="time" tone="pitch" />
            </View>
            <ClubSectionCard title="Lecture">
              <ClubText variant="body" muted>
                {ws.teamsWithoutCoach > 0
                  ? `${ws.teamsWithoutCoach} équipe(s) sans coach — priorité staff.`
                  : 'Couverture coachs OK.'}
              </ClubText>
              <ClubText variant="body" muted>
                {ws.pendingMemberships > 0
                  ? `${ws.pendingMemberships} adhésion(s) en attente.`
                  : 'Aucune adhésion en attente.'}
              </ClubText>
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
