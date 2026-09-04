import React, { useMemo, useState } from 'react';
import { RefreshControl, ScrollView, View, StyleSheet } from 'react-native';
import { useCompetitionSeason } from '../../hooks/useCompetitions';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { SkeletonList } from '../../components/motion';
import { EliteLeagueStandings, type LeagueStandingRow } from '../../components/matchs/EliteLeagueStandings';
import { ELITE_COLORS } from '../../theme/prodayEliteTheme';

interface CompetitionStandingsScreenProps {
  seasonId: string;
  onBack: () => void;
  onSelectTeam?: (teamId: string) => void;
}

export const CompetitionStandingsScreen: React.FC<CompetitionStandingsScreenProps> = ({
  seasonId,
  onBack,
  onSelectTeam,
}) => {
  const [signal, setSignal] = useState(0);
  const { season, standings, loading, refresh } = useCompetitionSeason(seasonId, signal);

  // Mapper vers LeagueStandingRow
  const mappedStandings: LeagueStandingRow[] = useMemo(() => {
    if (!standings) return [];
    return standings.map((s, idx) => ({
      rank: idx + 1,
      team_id: s.team_id,
      name: s.display_name,
      played: s.played ?? 0,
      won: s.won ?? 0,
      drawn: s.drawn ?? 0,
      lost: s.lost ?? 0,
      goals_for: s.goals_for ?? 0,
      goals_against: s.goals_against ?? 0,
      goal_diff: s.goal_difference ?? 0,
      points: s.points ?? 0,
      form: ['V', 'V', 'N', 'D', 'V'] as Array<'V' | 'N' | 'D'>,
    }));
  }, [standings]);

  return (
    <View style={styles.root}>
      <ScreenHeader
        label="Championnat Officiel"
        title="Classement & Buteurs"
        subtitle={season?.competition_name || 'Régional 3 · Poule A'}
        onBack={onBack}
      />
      <ScrollView
        contentContainerStyle={styles.body}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={() => {
              setSignal((n) => n + 1);
              void refresh();
            }}
            tintColor={ELITE_COLORS.primary}
          />
        }
      >
        {loading && mappedStandings.length === 0 ? (
          <SkeletonList count={6} variant="card" />
        ) : (
          <EliteLeagueStandings
            leagueName={season?.competition_name || 'Championnat Régional FFF'}
            divisionName={season?.label || 'Poule A · Seniors'}
            standings={mappedStandings}
            onSelectTeam={onSelectTeam}
          />
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: ELITE_COLORS.bg,
  },
  body: {
    padding: 16,
    maxWidth: 960,
    width: '100%',
    alignSelf: 'center',
  },
});
