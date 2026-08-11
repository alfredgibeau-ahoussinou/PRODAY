import React, { useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import type { User } from '../../../models/User';
import type { Competition, CompetitionFixture, CompetitionSeason } from '../../../models/Competition';
import { MATCH_SITE } from '../../../content/matchPageIdentity';
import { MatchChapterIntro } from '../MatchChapterIntro';
import { SkeletonList } from '../../motion';
import { ProDayText } from '../../ui/ProDayText';
import { SearchBar } from '../../ui/SearchBar';
import { MatchCompetitionSeasonCard } from '../MatchCompetitionSeasonCard';
import { MatchCompetitionFixtureCard } from '../MatchCompetitionFixtureCard';
import { useAppTheme } from '../../../context/ProductLineContext';
import { useTabNavigationActions } from '../../../hooks/useTabNavigationActions';
import { spacing } from '../../../theme/designTokens';
import { MATCH_CHAPTER_PAD } from './matchChapterLayout';
import {
  MatchActionRow,
  MatchEmptyState,
  MatchFilterBar,
  MatchKpiRow,
} from '../matchCenterUi';

interface MatchCompetitionsChapterProps {
  profile: User | null;
  competitions: Competition[];
  seasons: CompetitionSeason[];
  fixtures: CompetitionFixture[];
  loading: boolean;
  refreshing: boolean;
  onRefresh: () => void;
  onOpenSeason: (seasonId: string) => void;
  onOpenFixture: (fixtureId: string) => void;
  onOrganize?: () => void;
}

export const MatchCompetitionsChapter: React.FC<MatchCompetitionsChapterProps> = ({
  profile,
  competitions,
  seasons,
  fixtures,
  loading,
  refreshing,
  onRefresh,
  onOpenSeason,
  onOpenFixture,
  onOrganize,
}) => {
  const { colors: c } = useAppTheme();
  const nav = useTabNavigationActions();
  const [search, setSearch] = useState('');

  const canOrganize =
    profile &&
    (profile.role === 'organizer' ||
      profile.role === 'club' ||
      profile.role === 'coach' ||
      profile.role === 'agent');

  const filteredSeasons = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return seasons;
    return seasons.filter(
      (s) =>
        s.label.toLowerCase().includes(q) ||
        s.competition_name.toLowerCase().includes(q),
    );
  }, [seasons, search]);

  const upcoming = useMemo(
    () =>
      fixtures
        .filter((f) => f.status === 'scheduled' || f.status === 'live')
        .slice(0, 8),
    [fixtures],
  );

  const liveCount = fixtures.filter((f) => f.status === 'live').length;

  return (
    <ScrollView
      contentContainerStyle={[MATCH_CHAPTER_PAD, styles.stack]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.accent} />
      }
      showsVerticalScrollIndicator={false}
      nestedScrollEnabled
      keyboardShouldPersistTaps="handled"
    >
      <MatchChapterIntro
        kicker="Compétitions"
        title="Compétitions"
        subtitle="Championnats, classements, résultats et validation hybride."
      />

      <MatchKpiRow
        items={[
          {
            label: 'Direct',
            value: String(liveCount),
            tone: liveCount > 0 ? MATCH_SITE.live : MATCH_SITE.muted,
          },
          { label: 'Saisons', value: String(filteredSeasons.length), tone: c.accent },
          {
            label: 'À venir',
            value: String(upcoming.length),
            tone: MATCH_SITE.foreground,
          },
        ]}
      />

      {canOrganize && onOrganize ? (
        <MatchActionRow
          primary="Organiser une compétition"
          onPrimary={onOrganize}
          secondary={profile ? 'Tactique IA' : undefined}
          onSecondary={profile ? () => nav.openDashboard('smart_tactics') : undefined}
        />
      ) : profile ? (
        <MatchActionRow
          primary="Tactique IA · prépa match"
          onPrimary={() => nav.openDashboard('smart_tactics')}
        />
      ) : null}

      <MatchFilterBar>
        <SearchBar
          placeholder="Saison, compétition…"
          value={search}
          onChangeText={setSearch}
        />
      </MatchFilterBar>

      {loading ? <SkeletonList count={3} variant="card" /> : null}

      {!loading && upcoming.length > 0 ? (
        <View style={styles.section}>
          <ProDayText variant="caption" style={[styles.sectionKicker, { color: MATCH_SITE.live }]}>
            Prochains matchs · {upcoming.length}
          </ProDayText>
          <View style={styles.list}>
            {upcoming.map((f) => (
              <MatchCompetitionFixtureCard
                key={f.id}
                fixture={f}
                colors={c}
                onPress={() => onOpenFixture(f.id)}
              />
            ))}
          </View>
        </View>
      ) : null}

      {!loading && filteredSeasons.length === 0 ? (
        <MatchEmptyState
          title="Aucune compétition"
          body={
            competitions.length === 0
              ? 'Créez une compétition pour générer calendrier et classements.'
              : 'Aucun résultat pour cette recherche.'
          }
        />
      ) : null}

      {!loading && filteredSeasons.length > 0 ? (
        <View style={styles.section}>
          <ProDayText variant="caption" style={[styles.sectionKicker, { color: c.accent }]}>
            Saisons · {filteredSeasons.length}
          </ProDayText>
          <View style={styles.list}>
            {filteredSeasons.map((s) => (
              <MatchCompetitionSeasonCard
                key={s.id}
                season={s}
                colors={c}
                onPress={() => onOpenSeason(s.id)}
              />
            ))}
          </View>
        </View>
      ) : null}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  stack: { gap: spacing.md, paddingTop: spacing.sm },
  section: { gap: spacing.xs },
  sectionKicker: {
    textTransform: 'uppercase',
    letterSpacing: 1.8,
    fontSize: 10,
    fontWeight: '800',
    marginBottom: 4,
  },
  list: { gap: spacing.xs },
});
