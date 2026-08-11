import React, { useMemo, useState } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { useCompetitionSeason } from '../../hooks/useCompetitions';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { SkeletonList } from '../../components/motion';
import { ProDayText } from '../../components/ui/ProDayText';
import { useThemedScreen } from '../../hooks/useThemedScreen';
import { createCompetitionScreenStyles } from '../../components/competition/competitionScreenStyles';
import { buildTeamSeasonAnalytics } from '../../utils/competitionStatsBoards';
import { ListEmptyPanel } from '../../components/ui/ListEmptyPanel';

interface CompetitionStandingsScreenProps {
  seasonId: string;
  onBack: () => void;
}

export const CompetitionStandingsScreen: React.FC<CompetitionStandingsScreenProps> = ({
  seasonId,
  onBack,
}) => {
  const { colors: c, rootStyle } = useThemedScreen();
  const styles = useMemo(() => createCompetitionScreenStyles(c), [c]);
  const [signal, setSignal] = useState(0);
  const { season, standings, loading, refresh } = useCompetitionSeason(seasonId, signal);
  const analytics = useMemo(() => buildTeamSeasonAnalytics(standings), [standings]);

  return (
    <View style={[styles.root, rootStyle]}>
      <ScreenHeader
        label="Compétitions"
        title="Classement"
        subtitle={season?.competition_name}
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
            tintColor={c.accent}
          />
        }
      >
        {loading && standings.length === 0 ? <SkeletonList count={5} variant="card" /> : null}

        {!loading && standings.length === 0 ? (
          <ListEmptyPanel
            icon="trophy"
            title="Classement vide"
            subtitle="Les points apparaissent après validation des résultats."
          />
        ) : null}

        {standings.length > 0 ? (
          <View style={styles.card}>
            <View style={styles.tableHeader}>
              {(['#', 'Équipe', 'J', 'Diff', 'Pts'] as const).map((h) => (
                <ProDayText
                  key={h}
                  variant="caption"
                  muted
                  style={[
                    h === '#' ? styles.cellRank : h === 'Équipe' ? styles.cellTeam : styles.cellNum,
                    { fontWeight: '700' },
                  ]}
                >
                  {h}
                </ProDayText>
              ))}
            </View>

            {standings.map((row, index) => (
              <View key={row.team_id} style={styles.tableRow}>
                <ProDayText variant="body" style={[styles.cellRank, styles.bodyStrong]}>
                  {index + 1}
                </ProDayText>
                <ProDayText variant="body" style={[styles.cellTeam, styles.titleText]}>
                  {row.display_name}
                </ProDayText>
                <ProDayText variant="body" style={[styles.cellNum, { color: c.text }]}>
                  {row.played}
                </ProDayText>
                <ProDayText variant="body" style={[styles.cellNum, { color: c.text }]}>
                  {row.goal_difference > 0 ? `+${row.goal_difference}` : row.goal_difference}
                </ProDayText>
                <ProDayText variant="body" style={[styles.cellNum, styles.bodyStrong]}>
                  {row.points}
                </ProDayText>
              </View>
            ))}
          </View>
        ) : null}

        {analytics.length > 0 ? (
          <View style={styles.card}>
            <ProDayText variant="section" style={styles.sectionTitle}>
              Analyse équipes
            </ProDayText>
            {analytics.map((a) => (
              <ProDayText key={a.team_id} variant="body" style={{ color: c.textSecondary }}>
                {a.display_name} · {a.win_rate}% victoires · {a.form_label}
              </ProDayText>
            ))}
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
};
