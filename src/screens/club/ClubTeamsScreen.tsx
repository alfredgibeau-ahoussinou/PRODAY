import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
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
import { ClubTeamSpaceScreen } from './ClubTeamSpaceScreen';
import { spacing } from '../../theme/designTokens';
import type { ClubThemeTokens } from '../../features/club/theme/clubTokens';

/** Mes Équipes — cartes catégories → espace équipe. */
export function ClubTeamsScreen() {
  const shellNav = useClubShellNav();
  const { tokens } = useClubTheme();
  const ws = useClubWorkspace();
  const styles = useMemo(() => createStyles(tokens), [tokens]);
  const selected = shellNav?.selectedTeamId ?? null;

  if (selected) {
    return (
      <ClubTeamSpaceScreen
        teamId={selected}
        onBack={() => shellNav?.setSelectedTeamId?.(null)}
      />
    );
  }

  if (ws.loading) return <ClubLoading />;

  return (
    <View style={styles.root}>
      <ClubChapterScroll refreshing={ws.refreshing} onRefresh={() => void ws.refresh()}>
        <ClubScreenHeader
          title="Équipes"
          subtitle={`${ws.teamRows.length} catégorie(s)`}
        />

        {ws.teamRows.length === 0 ? (
          <ClubEmptyState
            title="Structurez votre club"
            body="Ajoutez vos équipes (U7 → Seniors). Les joueurs et coachs s’y rattachent ensuite."
            actionLabel="+ Créer une équipe"
            onAction={() => shellNav?.openCreate?.('player')}
            icon="football"
          />
        ) : (
          <View style={styles.grid}>
            {ws.teamRows.map((row) => (
              <ClubSectionCard key={row.teamId}>
                <ClubActionRow
                  icon="football"
                  label={formatTeamRowLabel(row)}
                  hint={[
                    `${row.licensedCount} licencié(s)`,
                    row.coachNames.length
                      ? `Coach : ${row.coachNames.join(', ')}`
                      : 'Sans coach',
                  ].join(' · ')}
                  onPress={() => shellNav?.setSelectedTeamId?.(row.teamId)}
                />
              </ClubSectionCard>
            ))}
          </View>
        )}

        <ClubText variant="caption" muted>
          L’IA peut suggérer des mouvements entre équipes — jamais les appliquer sans vous.
        </ClubText>
      </ClubChapterScroll>
    </View>
  );
}

const createStyles = (tokens: ClubThemeTokens) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: tokens.bg },
    grid: { gap: spacing.sm },
  });
