import React, { useMemo, useState } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { useCompetitionSeason } from '../../hooks/useCompetitions';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { PressableSpring, SkeletonList } from '../../components/motion';
import { ProDayText } from '../../components/ui/ProDayText';
import { useThemedScreen } from '../../hooks/useThemedScreen';
import { createCompetitionScreenStyles } from '../../components/competition/competitionScreenStyles';
import { MatchCompetitionFixtureCard } from '../../components/matchs/MatchCompetitionFixtureCard';
import { buildCompetitionLeaderboards } from '../../utils/competitionStatsBoards';
import { ListEmptyPanel } from '../../components/ui/ListEmptyPanel';

interface CompetitionDashboardScreenProps {
  seasonId: string;
  onBack: () => void;
  onOpenStandings: () => void;
  onOpenFixture: (fixtureId: string) => void;
  onOpenStats?: () => void;
}

export const CompetitionDashboardScreen: React.FC<CompetitionDashboardScreenProps> = ({
  seasonId,
  onBack,
  onOpenStandings,
  onOpenFixture,
  onOpenStats,
}) => {
  const { colors: c, rootStyle } = useThemedScreen();
  const styles = useMemo(() => createCompetitionScreenStyles(c), [c]);
  const [signal, setSignal] = useState(0);
  const { season, fixtures, standings, playerStats, loading, refresh } = useCompetitionSeason(
    seasonId,
    signal,
  );
  const boards = useMemo(() => buildCompetitionLeaderboards(playerStats), [playerStats]);

  return (
    <View style={[styles.root, rootStyle]}>
      <ScreenHeader
        label="Compétitions"
        title={season?.competition_name ?? 'Compétition'}
        subtitle={season?.label}
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
        {loading && !season ? <SkeletonList count={4} variant="card" /> : null}

        <View style={styles.actionsRow}>
          <PressableSpring
            onPress={onOpenStandings}
            scaleTo={0.96}
            style={[styles.actionPill, styles.actionPillPrimary]}
          >
            <ProDayText variant="caption" inverse style={{ fontWeight: '800' }}>
              Classement
            </ProDayText>
          </PressableSpring>
          {onOpenStats ? (
            <PressableSpring
              onPress={onOpenStats}
              scaleTo={0.96}
              style={[styles.actionPill, styles.actionPillGhost]}
            >
              <ProDayText variant="caption" style={styles.bodyStrong}>
                Stats
              </ProDayText>
            </PressableSpring>
          ) : null}
        </View>

        {standings.slice(0, 3).length > 0 ? (
          <View style={styles.card}>
            <ProDayText variant="section" style={styles.sectionTitle}>
              Top 3
            </ProDayText>
            {standings.slice(0, 3).map((row, i) => (
              <ProDayText key={row.team_id} variant="body" style={styles.bodyStrong}>
                {i + 1}. {row.display_name} — {row.points} pts
              </ProDayText>
            ))}
          </View>
        ) : null}

        {boards.scorers[0] ? (
          <View style={styles.card}>
            <ProDayText variant="section" style={styles.sectionTitle}>
              Meilleur buteur
            </ProDayText>
            <ProDayText variant="body" style={styles.bodyStrong}>
              {boards.scorers[0].display_name} · {boards.scorers[0].goals} buts
            </ProDayText>
          </View>
        ) : null}

        <ProDayText variant="section" style={styles.sectionTitle}>
          Calendrier
        </ProDayText>

        {!loading && fixtures.length === 0 ? (
          <ListEmptyPanel
            icon="calendar"
            title="Aucun match"
            subtitle="Générez un calendrier depuis l’organisation de saison."
          />
        ) : null}

        {fixtures.map((f) => (
          <MatchCompetitionFixtureCard
            key={f.id}
            fixture={f}
            colors={c}
            onPress={() => onOpenFixture(f.id)}
          />
        ))}
      </ScrollView>
    </View>
  );
};
