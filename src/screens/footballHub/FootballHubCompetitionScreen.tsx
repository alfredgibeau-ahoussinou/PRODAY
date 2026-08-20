import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { HubMatchRow, HubScreen, HubSection } from '../../features/footballHub/components';
import { FOOTBALL_HUB } from '../../features/footballHub/theme/footballHubTheme';
import { ProDayText } from '../../components/ui/ProDayText';
import { footballDataFacade } from '../../services/footballData';
import { externalScoresService } from '../../services/externalScores.service';
import type { FootballCompetitionEntry } from '../../services/footballData/types';
import type { SupporterMatchViewItem } from '../../utils/supporterMatchFilters';
import { externalFixtureToMatchItem } from '../../utils/supporterMatchFilters';
import { FootballHubMatchCenterScreen } from './FootballHubMatchCenterScreen';

export type FootballHubCompetitionScreenProps = {
  competition: FootballCompetitionEntry;
  onBack: () => void;
};

/** Hub compétition (ex. Coupe du monde) — prochains matchs + résultats récents API. */
export const FootballHubCompetitionScreen: React.FC<FootballHubCompetitionScreenProps> = ({
  competition,
  onBack,
}) => {
  const [upcoming, setUpcoming] = useState<SupporterMatchViewItem[]>([]);
  const [recent, setRecent] = useState<SupporterMatchViewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected] = useState<SupporterMatchViewItem | null>(null);

  const load = useCallback(async () => {
    const leagueId = competition.leagueId;
    try {
      const [nextFixtures, finishedAll] = await Promise.all([
        leagueId != null
          ? footballDataFacade.listUpcomingFixtures(45, [leagueId])
          : Promise.resolve([]),
        externalScoresService.listRecentFinishedFixtures().catch(() => []),
      ]);
      const finished = finishedAll.filter((f) => {
        if (leagueId != null && f.league_id != null) return f.league_id === leagueId;
        return f.competition === competition.id || f.competition === 'world_cup';
      });
      setUpcoming(nextFixtures.map(externalFixtureToMatchItem).slice(0, 20));
      setRecent(finished.map(externalFixtureToMatchItem).slice(0, 16));
    } catch {
      setUpcoming([]);
      setRecent([]);
    } finally {
      setLoading(false);
    }
  }, [competition.id, competition.leagueId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (selected) {
    return <FootballHubMatchCenterScreen item={selected} onBack={() => setSelected(null)} />;
  }

  return (
    <HubScreen
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={async () => {
            setRefreshing(true);
            await load();
            setRefreshing(false);
          }}
          tintColor={FOOTBALL_HUB.bright}
        />
      }
    >
      <Pressable onPress={onBack} hitSlop={12}>
        <ProDayText variant="body" style={styles.back}>
          ← Retour
        </ProDayText>
      </Pressable>
      <ProDayText variant="hero" style={styles.title}>
        {competition.label}
      </ProDayText>
      <ProDayText variant="body" style={styles.sub}>
        {competition.country} · données API uniquement
      </ProDayText>

      {loading ? <ActivityIndicator color={FOOTBALL_HUB.bright} /> : null}

      <HubSection
        title="Prochains matchs"
        emptyLabel={!loading && upcoming.length === 0 ? 'Aucun match à venir (hors saison ou indisponible).' : undefined}
      >
        {upcoming.map((item) => (
          <HubMatchRow key={item.id} item={item} onPress={() => setSelected(item)} />
        ))}
      </HubSection>

      <HubSection
        title="Résultats récents"
        emptyLabel={!loading && recent.length === 0 ? 'Aucun résultat récent disponible.' : undefined}
      >
        {recent.map((item) => (
          <HubMatchRow key={item.id} item={item} onPress={() => setSelected(item)} />
        ))}
      </HubSection>

      <View style={styles.note}>
        <ProDayText variant="caption" style={styles.muted}>
          Classement affiché uniquement si l’API le fournit — rien n’est inventé.
        </ProDayText>
      </View>
    </HubScreen>
  );
};

const styles = StyleSheet.create({
  back: { color: FOOTBALL_HUB.bright, marginBottom: 8 },
  title: { color: FOOTBALL_HUB.foreground, fontSize: 28 },
  sub: { color: FOOTBALL_HUB.muted, marginBottom: 8 },
  note: { marginTop: 8 },
  muted: { color: FOOTBALL_HUB.muted },
});
