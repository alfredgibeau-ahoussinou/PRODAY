import React, { useMemo, useState } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { useCompetitionSeason } from '../../hooks/useCompetitions';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { SkeletonList } from '../../components/motion';
import { ProDayText } from '../../components/ui/ProDayText';
import { useThemedScreen } from '../../hooks/useThemedScreen';
import { createCompetitionScreenStyles } from '../../components/competition/competitionScreenStyles';
import {
  averageRating,
  buildCompetitionLeaderboards,
} from '../../utils/competitionStatsBoards';
import { buildTalentRadar } from '../../utils/competitionExclusives';
import type { PlayerCompetitionStats } from '../../models/Competition';
import { ListEmptyPanel } from '../../components/ui/ListEmptyPanel';

interface CompetitionStatsScreenProps {
  seasonId: string;
  onBack: () => void;
}

function Board({
  title,
  rows,
  value,
  styles,
}: {
  title: string;
  rows: PlayerCompetitionStats[];
  value: (r: PlayerCompetitionStats) => string;
  styles: ReturnType<typeof createCompetitionScreenStyles>;
}) {
  if (rows.length === 0) return null;
  return (
    <View style={styles.card}>
      <ProDayText variant="section" style={styles.sectionTitle}>
        {title}
      </ProDayText>
      {rows.map((r, i) => (
        <View key={r.id} style={{ gap: 2 }}>
          <ProDayText variant="body" style={styles.bodyStrong}>
            {i + 1}. {r.display_name} — {value(r)}
          </ProDayText>
          {averageRating(r) != null ? (
            <ProDayText variant="caption" muted>
              Note moyenne {averageRating(r)}
            </ProDayText>
          ) : null}
        </View>
      ))}
    </View>
  );
}

export const CompetitionStatsScreen: React.FC<CompetitionStatsScreenProps> = ({
  seasonId,
  onBack,
}) => {
  const { colors: c, rootStyle } = useThemedScreen();
  const styles = useMemo(() => createCompetitionScreenStyles(c), [c]);
  const [signal, setSignal] = useState(0);
  const { season, playerStats, loading, refresh } = useCompetitionSeason(seasonId, signal);
  const boards = useMemo(() => buildCompetitionLeaderboards(playerStats), [playerStats]);
  const radar = useMemo(() => buildTalentRadar(playerStats, 90, 5), [playerStats]);

  return (
    <View style={[styles.root, rootStyle]}>
      <ScreenHeader
        label="Compétitions"
        title="Stats saison"
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
        {loading && playerStats.length === 0 ? <SkeletonList count={4} variant="card" /> : null}

        {!loading && playerStats.length === 0 ? (
          <ListEmptyPanel
            icon="trophy"
            title="Pas encore de stats"
            subtitle="Les stats apparaissent après validation des feuilles de match."
          />
        ) : null}

        <Board
          title="Buteurs"
          rows={boards.scorers}
          value={(r) => `${r.goals} buts`}
          styles={styles}
        />
        <Board
          title="Passeurs"
          rows={boards.assists}
          value={(r) => `${r.assists} PD`}
          styles={styles}
        />
        <Board
          title="Clean sheets"
          rows={boards.cleanSheets}
          value={(r) => `${r.clean_sheets}`}
          styles={styles}
        />
        <Board
          title="Discipline"
          rows={boards.discipline}
          value={(r) => `${r.yellow_cards} J / ${r.red_cards} R`}
          styles={styles}
        />
        <Board
          title="Minutes"
          rows={boards.minutes}
          value={(r) => `${r.minutes}'`}
          styles={styles}
        />

        {radar.length > 0 ? (
          <View style={styles.card}>
            <ProDayText variant="section" style={styles.sectionTitle}>
              Talent radar
            </ProDayText>
            {radar.map((t, i) => (
              <View key={t.uid} style={{ gap: 2 }}>
                <ProDayText variant="body" style={styles.bodyStrong}>
                  {i + 1}. {t.display_name} — {t.score}
                </ProDayText>
                <ProDayText variant="caption" muted>
                  {t.trajectory === 'rising'
                    ? 'En hausse'
                    : t.trajectory === 'cooling'
                      ? 'En baisse'
                      : 'Stable'}
                  {t.rating_avg != null ? ` · note ${t.rating_avg}` : ''}
                </ProDayText>
              </View>
            ))}
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
};
