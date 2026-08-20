import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useClubWorkspace } from '../../features/club/hooks/useClubWorkspace';
import { useClubTheme } from '../../features/club/shell/ClubThemeContext';
import {
  ClubChapterScroll,
  ClubEmptyState,
  ClubLoading,
  ClubScreenHeader,
  ClubSectionCard,
  ClubText,
} from '../../features/club/ui/clubUi';
import { isCoachMatchEvent, isCoachTrainingEvent } from '../../models/TeamEvent';
import { spacing } from '../../theme/designTokens';
import type { ClubThemeTokens } from '../../features/club/theme/clubTokens';

/** Statistiques — insight cards, peu de graphiques. */
export function ClubStatsScreen() {
  const { tokens } = useClubTheme();
  const ws = useClubWorkspace();
  const styles = useMemo(() => createStyles(tokens), [tokens]);

  if (ws.loading) return <ClubLoading />;

  const matchCount = ws.events.filter((e) => isCoachMatchEvent(e)).length;
  const trainingCount = ws.events.filter((e) => isCoachTrainingEvent(e)).length;
  const hasData = ws.teams.length > 0 || matchCount > 0 || ws.players.length > 0;

  return (
    <View style={styles.root}>
      <ClubChapterScroll refreshing={ws.refreshing} onRefresh={() => void ws.refresh()}>
        <ClubScreenHeader title="Statistiques" subtitle="Insights club — pas 50 graphiques" />

        {!hasData ? (
          <ClubEmptyState
            title="Pas encore de données"
            body="Dès que vos équipes, matchs et présences vivent, les insights apparaîtront ici."
            icon="stats-chart"
          />
        ) : (
          <>
            <View style={styles.row}>
              <InsightCard label="Équipes" value={String(ws.teams.length)} tokens={tokens} />
              <InsightCard label="Joueurs" value={String(ws.players.length || ws.memberships.filter((m) => m.status === 'active').length)} tokens={tokens} />
            </View>
            <View style={styles.row}>
              <InsightCard label="Matchs" value={String(matchCount)} tokens={tokens} />
              <InsightCard label="Séances" value={String(trainingCount)} tokens={tokens} />
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

function InsightCard({
  label,
  value,
  tokens,
}: {
  label: string;
  value: string;
  tokens: ClubThemeTokens;
}) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: tokens.surface,
        borderRadius: 16,
        padding: spacing.md,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: tokens.border,
        gap: 4,
      }}
    >
      <ClubText variant="caption" muted>
        {label}
      </ClubText>
      <ClubText variant="title">{value}</ClubText>
    </View>
  );
}

const createStyles = (tokens: ClubThemeTokens) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: tokens.bg },
    row: { flexDirection: 'row', gap: spacing.sm },
  });
