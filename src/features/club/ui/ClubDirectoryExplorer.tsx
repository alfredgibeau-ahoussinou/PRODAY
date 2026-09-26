import React, { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Icon } from '../../../components/ui/Icon';
import { PressableSpring } from '../../../components/motion';
import { ProDayText } from '../../../components/ui/ProDayText';
import { clubRadius, clubSpace } from '../theme/clubDesignSystem';
import type { ClubThemeTokens } from '../theme/clubTokens';
import {
  FRENCH_REGIONS_OPTIONS,
  FRENCH_DISTRICTS_OPTIONS,
  AGE_CATEGORIES_OPTIONS,
  type PublicTeamSportingRecord,
} from './clubStandingsModel';
import {
  frenchFootballStandingsService,
  type FrenchLeagueData,
} from '../../../services/frenchFootballStandings.service';
import type { LeagueStandingRow } from '../../../components/matchs/EliteLeagueStandings';
import { prodayHaptics } from '../../../utils/prodayHaptics';

interface ClubDirectoryExplorerProps {
  tokens: ClubThemeTokens;
  onSelectTeamStandings: (leagueId: string, teamName: string) => void;
  onInspectPublicRecord: (record: PublicTeamSportingRecord) => void;
}

export const ClubDirectoryExplorer: React.FC<ClubDirectoryExplorerProps> = ({
  tokens,
  onSelectTeamStandings,
  onInspectPublicRecord,
}) => {
  const [query, setQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState<boolean>(false);
  const [results, setResults] = useState<{ league: FrenchLeagueData; club: LeagueStandingRow }[]>([]);

  // Filtrage des districts disponibles selon la région
  const availableDistricts = useMemo(() => {
    if (selectedRegion === 'all') return FRENCH_DISTRICTS_OPTIONS;
    return FRENCH_DISTRICTS_OPTIONS.filter(
      (d) => d.id === 'all' || d.regionId === selectedRegion,
    );
  }, [selectedRegion]);

  // Chargement / Filtrage des clubs
  useEffect(() => {
    let active = true;
    setLoading(true);

    frenchFootballStandingsService
      .searchClubsFiltered({
        queryText: query,
        region: selectedRegion,
        districtCode: selectedDistrict,
        category: selectedCategory,
      })
      .then((res) => {
        if (active) {
          setResults(res);
          setLoading(false);
        }
      })
      .catch(() => {
        if (active) {
          setResults([]);
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [query, selectedRegion, selectedDistrict, selectedCategory]);

  return (
    <View style={styles.container}>
      {/* 1. Barre de Recherche */}
      <View style={[styles.searchBox, { backgroundColor: tokens.surface, borderColor: tokens.border }]}>
        <Icon name="search" size={16} color={tokens.muted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Rechercher un club, une équipe ou une ville…"
          placeholderTextColor={tokens.muted}
          style={[styles.searchInput, { color: tokens.foreground }]}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {query.length > 0 ? (
          <TouchableOpacity
            onPress={() => setQuery('')}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Icon name="close" size={16} color={tokens.muted} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* 2. Filtres Territoriaux (Régions) */}
      <View style={styles.filterSection}>
        <ProDayText style={[styles.filterLabel, { color: tokens.muted }]}>
          Territoire / Région :
        </ProDayText>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
          {FRENCH_REGIONS_OPTIONS.map((r) => {
            const isSelected = selectedRegion === r.id;
            return (
              <TouchableOpacity
                key={r.id}
                onPress={() => {
                  prodayHaptics.selection();
                  setSelectedRegion(r.id);
                  if (selectedDistrict !== 'all') setSelectedDistrict('all');
                }}
                style={[
                  styles.filterChip,
                  isSelected
                    ? { backgroundColor: tokens.accent, borderColor: tokens.accent }
                    : { backgroundColor: tokens.elevated, borderColor: tokens.border },
                ]}
              >
                <ProDayText
                  style={[
                    styles.filterChipText,
                    isSelected ? { color: '#000000', fontWeight: '700' } : { color: tokens.muted },
                  ]}
                >
                  {r.label}
                </ProDayText>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* 3. Filtres Départementaux (Districts) */}
      {availableDistricts.length > 1 ? (
        <View style={styles.filterSection}>
          <ProDayText style={[styles.filterLabel, { color: tokens.muted }]}>
            District départemental :
          </ProDayText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
            {availableDistricts.map((d) => {
              const isSelected = selectedDistrict === d.id;
              return (
                <TouchableOpacity
                  key={d.id}
                  onPress={() => {
                    prodayHaptics.selection();
                    setSelectedDistrict(d.id);
                  }}
                  style={[
                    styles.filterChip,
                    isSelected
                      ? { backgroundColor: tokens.accent, borderColor: tokens.accent }
                      : { backgroundColor: tokens.elevated, borderColor: tokens.border },
                  ]}
                >
                  <ProDayText
                    style={[
                      styles.filterChipText,
                      isSelected ? { color: '#000000', fontWeight: '700' } : { color: tokens.muted },
                    ]}
                  >
                    {d.label}
                  </ProDayText>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      ) : null}

      {/* 4. Filtres de Catégories d'âge & Niveau */}
      <View style={styles.filterSection}>
        <ProDayText style={[styles.filterLabel, { color: tokens.muted }]}>
          Catégorie d'âge :
        </ProDayText>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
          {AGE_CATEGORIES_OPTIONS.map((c) => {
            const isSelected = selectedCategory === c.id;
            return (
              <TouchableOpacity
                key={c.id}
                onPress={() => {
                  prodayHaptics.selection();
                  setSelectedCategory(c.id);
                }}
                style={[
                  styles.filterChip,
                  isSelected
                    ? { backgroundColor: tokens.accent, borderColor: tokens.accent }
                    : { backgroundColor: tokens.elevated, borderColor: tokens.border },
                ]}
              >
                <ProDayText
                  style={[
                    styles.filterChipText,
                    isSelected ? { color: '#000000', fontWeight: '700' } : { color: tokens.muted },
                  ]}
                >
                  {c.label}
                </ProDayText>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* 5. Résultats des Clubs / Équipes */}
      <View style={styles.resultsContainer}>
        <View style={styles.resultsHeader}>
          <ProDayText style={[styles.resultsTitle, { color: tokens.foreground }]}>
            Clubs & Équipes Officielles FFF ({results.length})
          </ProDayText>
          {loading ? <ActivityIndicator size="small" color={tokens.accent} /> : null}
        </View>

        {results.length === 0 && !loading ? (
          <View style={[styles.emptyCard, { backgroundColor: tokens.surface, borderColor: tokens.border }]}>
            <Icon name="alert-circle" size={24} color={tokens.muted} />
            <ProDayText style={[styles.emptyTitle, { color: tokens.foreground }]}>
              Aucun club ne correspond à ces critères
            </ProDayText>
            <ProDayText style={[styles.emptySub, { color: tokens.muted }]}>
              Modifiez votre recherche ou réinitialisez les filtres territoriaux pour explorer davantage de championnats.
            </ProDayText>
          </View>
        ) : null}

        {results.map(({ league, club }) => {
          return (
            <View
              key={`${league.id}_${club.team_id}`}
              style={[styles.clubCard, { backgroundColor: tokens.surface, borderColor: tokens.border }]}
            >
              <View style={styles.clubCardTop}>
                <View style={styles.clubCardIdentity}>
                  <ProDayText style={[styles.clubName, { color: tokens.foreground }]} numberOfLines={1}>
                    {club.name}
                  </ProDayText>
                  <ProDayText style={[styles.leagueLabel, { color: tokens.muted }]} numberOfLines={1}>
                    {league.divisionLabel || league.name}
                  </ProDayText>
                </View>

                <View style={[styles.rankBadge, { backgroundColor: tokens.elevated, borderColor: tokens.border }]}>
                  <ProDayText style={[styles.rankNum, { color: tokens.accent }]}>
                    #{club.rank}
                  </ProDayText>
                  <ProDayText style={[styles.rankPts, { color: tokens.muted }]}>
                    {club.points} pts
                  </ProDayText>
                </View>
              </View>

              <View style={styles.clubCardStats}>
                <ProDayText style={[styles.statChip, { color: tokens.muted }]}>
                  Matchs : {club.played}
                </ProDayText>
                <ProDayText style={[styles.statChip, { color: tokens.muted }]}>
                  Diff : {club.goal_diff > 0 ? `+${club.goal_diff}` : club.goal_diff}
                </ProDayText>
                <ProDayText style={[styles.statChip, { color: tokens.muted }]}>
                  Source : {league.source?.includes('national') ? 'API Nationale' : 'FFF DOFA'}
                </ProDayText>
              </View>

              <View style={[styles.clubCardActions, { borderTopColor: tokens.border }]}>
                {/* Consulter la fiche publique */}
                <TouchableOpacity
                  onPress={() => {
                    prodayHaptics.press();
                    onInspectPublicRecord({
                      clubId: club.team_id,
                      clubName: club.name,
                      teamName: club.name,
                      category: league.category,
                      competitionName: league.name,
                      divisionLabel: league.divisionLabel,
                      groupLabel: league.name.includes('Poule') ? league.name.split('·')[1]?.trim() : undefined,
                      rank: club.rank,
                      points: club.points,
                      played: club.played,
                      won: club.won,
                      drawn: club.drawn,
                      lost: club.lost,
                      goalsFor: club.goals_for,
                      goalsAgainst: club.goals_against,
                      goalDiff: club.goal_diff,
                      form: club.form,
                      source: league.source ?? 'FFF DOFA Officiel',
                      lastSyncAt: league.lastSyncAt,
                    });
                  }}
                  style={[styles.inspectBtn, { borderColor: tokens.border }]}
                >
                  <Icon name="person" size={12} color={tokens.muted} />
                  <ProDayText style={[styles.inspectBtnText, { color: tokens.muted }]}>
                    Fiche publique
                  </ProDayText>
                </TouchableOpacity>

                {/* Voir le classement de sa poule */}
                <PressableSpring
                  onPress={() => {
                    prodayHaptics.press();
                    onSelectTeamStandings(league.id, club.name);
                  }}
                  style={[styles.openStandingsBtn, { backgroundColor: tokens.accentSoft, borderColor: `${tokens.accent}40` }]}
                  scaleTo={0.96}
                >
                  <ProDayText style={[styles.openStandingsText, { color: tokens.accent }]}>
                    Voir sa poule
                  </ProDayText>
                  <Icon name="chevron-forward" size={12} color={tokens.accent} />
                </PressableSpring>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: clubSpace.xxxl,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: clubRadius.md,
    borderWidth: 1,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    padding: 0,
  },
  filterSection: {
    marginBottom: 10,
    gap: 6,
  },
  filterLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  chipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingRight: 10,
  },
  filterChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: clubRadius.pill,
    borderWidth: 1,
    minHeight: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterChipText: {
    fontSize: 11,
  },
  resultsContainer: {
    marginTop: 12,
    gap: 8,
  },
  resultsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  resultsTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    borderRadius: clubRadius.md,
    borderWidth: 1,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptySub: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  clubCard: {
    borderRadius: clubRadius.md,
    borderWidth: 1,
    padding: 12,
    gap: 8,
  },
  clubCardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  clubCardIdentity: {
    flex: 1,
    marginRight: 10,
    gap: 2,
  },
  clubName: {
    fontSize: 15,
    fontWeight: '800',
  },
  leagueLabel: {
    fontSize: 11,
  },
  rankBadge: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: clubRadius.sm,
    borderWidth: 1,
  },
  rankNum: {
    fontSize: 14,
    fontWeight: '900',
  },
  rankPts: {
    fontSize: 9,
    fontWeight: '700',
  },
  clubCardStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statChip: {
    fontSize: 11,
  },
  clubCardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
    paddingTop: 8,
    borderTopWidth: 1,
  },
  inspectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: clubRadius.sm,
    borderWidth: 1,
    minHeight: 34,
  },
  inspectBtnText: {
    fontSize: 11,
    fontWeight: '600',
  },
  openStandingsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: clubRadius.sm,
    borderWidth: 1,
    minHeight: 34,
  },
  openStandingsText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
