import React, { useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View, Text } from 'react-native';
import type { User } from '../../../models/User';
import type { Competition, CompetitionFixture, CompetitionSeason } from '../../../models/Competition';
import { SkeletonList } from '../../motion';
import { SearchBar } from '../../ui/SearchBar';
import { MatchCompetitionSeasonCard } from '../MatchCompetitionSeasonCard';
import { MatchCompetitionFixtureCard } from '../MatchCompetitionFixtureCard';
import { useAppTheme } from '../../../context/ProductLineContext';
import { useTabNavigationActions } from '../../../hooks/useTabNavigationActions';
import { spacing } from '../../../theme/designTokens';
import { MATCH_CHAPTER_PAD } from './matchChapterLayout';
import { EliteLeagueStandings } from '../EliteLeagueStandings';
import { ELITE_COLORS } from '../../../theme/prodayEliteTheme';

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
}) => {
  const { colors: c } = useAppTheme();
  const nav = useTabNavigationActions();
  const [search, setSearch] = useState('');

  const upcoming = useMemo(
    () =>
      fixtures
        .filter((f) => f.status === 'scheduled' || f.status === 'live')
        .slice(0, 6),
    [fixtures],
  );

  return (
    <ScrollView
      contentContainerStyle={[MATCH_CHAPTER_PAD, styles.stack]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ELITE_COLORS.primary} />
      }
      showsVerticalScrollIndicator={false}
      nestedScrollEnabled
      keyboardShouldPersistTaps="handled"
    >
      {/* 1. TABLEAU DE CLASSEMENT OFFICIEL & BUTEURS EN TÊTE */}
      <EliteLeagueStandings
        leagueName="Championnat Régional FFF"
        divisionName="Poule A · Senior D1"
        standings={[]}
        onSelectTeam={(teamId) => {
          if (seasons.length > 0) {
            onOpenSeason(seasons[0].id);
          }
        }}
      />

      {/* 2. PROCHAINS MATCHS DU CHAMPIONNAT */}
      {upcoming.length > 0 ? (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.liveDot} />
            <Text style={styles.sectionTitle}>Prochains Matchs Officiels</Text>
          </View>
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

      {/* 3. RECHERCHE DE SAISONS / DIVISIONS */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Toutes les Poules & Divisions</Text>
        <SearchBar
          placeholder="Rechercher une poule, division…"
          value={search}
          onChangeText={setSearch}
        />
        {loading ? <SkeletonList count={2} variant="card" /> : null}
        {!loading && seasons.length > 0 ? (
          <View style={[styles.list, { marginTop: 8 }]}>
            {seasons.map((s) => (
              <MatchCompetitionSeasonCard
                key={s.id}
                season={s}
                colors={c}
                onPress={() => onOpenSeason(s.id)}
              />
            ))}
          </View>
        ) : null}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  stack: {
    gap: spacing.md,
    paddingTop: spacing.sm,
    maxWidth: 900,
    width: '100%',
    alignSelf: 'center',
  },
  section: {
    gap: 8,
    marginTop: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: ELITE_COLORS.primary,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: ELITE_COLORS.textPrimary,
  },
  list: {
    gap: 8,
  },
});
