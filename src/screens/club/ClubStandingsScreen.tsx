import React, { useMemo } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { useClubTheme } from '../../features/club/shell/ClubThemeContext';
import { useClubLeagueId } from '../../features/club/hooks/useClubLeagueId';
import { ClubBrandHeader } from '../../features/club/ui/ClubBrandHeader';
import { ClubChapterScroll, ClubEmptyState, ClubText } from '../../features/club/ui/clubUi';
import { EliteLeagueStandings } from '../../components/matchs/EliteLeagueStandings';
import { clubRadius, clubSpace } from '../../features/club/theme/clubDesignSystem';
import type { ClubThemeTokens } from '../../features/club/theme/clubTokens';
import { FRENCH_LEAGUE_CATEGORIES } from '../../services/frenchFootballStandings.service';
import { Icon } from '../../components/ui/Icon';

const SOURCE_LABELS: Record<string, string> = {
  team: 'Ligue de l’équipe active',
  profile: 'Ligue configurée dans le profil club',
  linked: 'Équipe FFF liée',
};

function resolveLeagueDisplayName(leagueId: string | null): string {
  if (!leagueId) return '';
  for (const category of FRENCH_LEAGUE_CATEGORIES) {
    const league = category.leagues.find((candidate) => candidate.id === leagueId);
    if (league) return league.name;
  }
  return leagueId.toUpperCase();
}

/**
 * Espace Club › Classements.
 * Le screen ne déduit aucune poule depuis le département : useClubLeagueId ne
 * retourne qu’un rattachement FFF explicite et valide pour la saison courante.
 */
export function ClubStandingsScreen() {
  const { tokens } = useClubTheme();
  const { leagueId, teamId, clubTeamName, source, divisionLabel, groupLabel, season, loading } =
    useClubLeagueId();
  const styles = useMemo(() => createStyles(tokens), [tokens]);
  const leagueName = useMemo(() => resolveLeagueDisplayName(leagueId), [leagueId]);
  const sourceLabel = source ? SOURCE_LABELS[source] ?? 'Rattachement FFF explicite' : null;
  const seasonLabel = season.replace('-', '/');

  if (loading) {
    return (
      <View style={[styles.root, styles.centerFlex]}>
        <ActivityIndicator size="large" color={tokens.accent} />
        <ClubText variant="caption" muted style={styles.loadingText}>
          Détection de votre championnat…
        </ClubText>
      </View>
    );
  }

  if (!leagueId) {
    return (
      <View style={styles.root}>
        <ClubChapterScroll>
          <ClubBrandHeader title="Classements" subtitle={`Saison ${seasonLabel}`} />
          <ClubEmptyState
            icon="trophy"
            title="Championnat non configuré"
            body="Aucun rattachement FFF validé pour la saison active. Demandez à un dirigeant de renseigner l’équipe et sa compétition officielles ; aucune poule n’est déduite automatiquement."
          />
          <EliteLeagueStandings
            leagueName="Championnats de France"
            divisionName="Sélectionnez un championnat"
            accent={tokens.accent}
          />
        </ClubChapterScroll>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.scrollBody} showsVerticalScrollIndicator={false}>
        <ClubBrandHeader
          title="Classements"
          subtitle={`Saison ${seasonLabel} · ${leagueName}`}
        />

        <View
          style={[
            styles.leagueBanner,
            { borderColor: `${tokens.accent}40`, backgroundColor: `${tokens.accent}0D` },
          ]}
        >
          <View style={styles.leagueBannerLeft}>
            <Icon name="trophy" size={15} color={tokens.accent} />
            <View style={styles.leagueBannerText}>
              <ClubText variant="caption" style={{ color: tokens.accent, fontWeight: '800' }}>
                Mon championnat · priorité
              </ClubText>
              <ClubText variant="caption" muted numberOfLines={2}>
                {divisionLabel || leagueName}
                {groupLabel ? ` · ${groupLabel}` : ''}
                {sourceLabel ? ` · ${sourceLabel}` : ''}
              </ClubText>
            </View>
          </View>
          <View style={[styles.leagueBannerDot, { backgroundColor: tokens.accent }]} />
        </View>

        <EliteLeagueStandings
          initialLeagueId={leagueId}
          highlightTeamName={clubTeamName ?? undefined}
          highlightTeamId={teamId ?? undefined}
          accent={tokens.accent}
        />
      </ScrollView>
    </View>
  );
}

function createStyles(tokens: ClubThemeTokens) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: tokens.bg },
    centerFlex: { alignItems: 'center', justifyContent: 'center', gap: clubSpace.md },
    loadingText: { marginTop: clubSpace.sm },
    scrollBody: { paddingBottom: clubSpace.xxxl, paddingHorizontal: clubSpace.lg },
    leagueBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: clubSpace.md,
      paddingVertical: 10,
      borderRadius: clubRadius.sm,
      borderWidth: 1,
      marginBottom: clubSpace.lg,
    },
    leagueBannerLeft: { flexDirection: 'row', alignItems: 'center', gap: clubSpace.sm, flex: 1 },
    leagueBannerText: { flex: 1, gap: 2 },
    leagueBannerDot: { width: 7, height: 7, borderRadius: 4, marginLeft: clubSpace.sm },
  });
}
