import React, { useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import type { User } from '../../../models/User';
import type { FriendlyMatch } from '../../../models/FriendlyMatch';
import type { Tournament } from '../../../models/Tournament';
import type { AmicauxStatusFilter } from '../../../content/matchChapters';
import type { Competition, CompetitionFixture, CompetitionSeason } from '../../../models/Competition';
import { MatchTournamentsChapter } from './MatchTournamentsChapter';
import { MatchCompetitionsChapter } from './MatchCompetitionsChapter';
import { ProDayText } from '../../ui/ProDayText';
import { usePlayerThemeColors } from '../../../context/PlayerThemeContext';
import { PLAYER_DARK } from '../../../theme/playerDarkPremium';
import { spacing } from '../../../theme/designTokens';

type Segment = 'tournois' | 'competitions';

const SEGMENTS: { id: Segment; label: string }[] = [
  { id: 'tournois', label: 'Tournois' },
  { id: 'competitions', label: 'Compét.' },
];

export interface MatchJoueurMatchsChapterProps {
  profile: User | null;
  matches: FriendlyMatch[];
  filteredMatches: FriendlyMatch[];
  loadingMatches: boolean;
  amicauxSearch: string;
  onAmicauxSearchChange: (value: string) => void;
  amicauxStatus: AmicauxStatusFilter;
  onAmicauxStatusChange: (value: AmicauxStatusFilter) => void;
  myClubId: string | null;
  canAccept: (match: FriendlyMatch) => boolean;
  refreshing: boolean;
  onRefresh: () => void;
  onPropose: () => void;
  onSearch: () => void;
  onOrganize?: () => void;
  onAcceptMatch: (match: FriendlyMatch) => void;
  onCancelMatch: (match: FriendlyMatch) => void;
  onMarkPlayed: (match: FriendlyMatch) => void;
  getMatchIaScore?: (matchId: string) => number | undefined;
  getMatchHealthWarning?: (matchId: string) => string | undefined;
  tournaments: Tournament[];
  loadingTournaments: boolean;
  onOpenTournament: (id: string) => void;
  onCreateTournament?: () => void;
  competitions: Competition[];
  competitionSeasons: CompetitionSeason[];
  competitionFixtures: CompetitionFixture[];
  loadingCompetitions: boolean;
  onOpenCompetitionSeason?: (seasonId: string) => void;
  onOpenCompetitionFixture?: (fixtureId: string) => void;
  onOrganizeCompetition?: () => void;
  /** Segment initial (deep link tournois / compétitions). */
  initialSegment?: Segment;
}

/** Hub Matchs joueur — tournois + compétitions en sous-onglets. */
export function MatchJoueurMatchsChapter({
  initialSegment = 'tournois',
  ...props
}: MatchJoueurMatchsChapterProps) {
  const playerTheme = usePlayerThemeColors();
  const [segment, setSegment] = useState<Segment>(initialSegment);

  return (
    <View style={styles.root}>
      <View style={styles.segmentRow}>
        {SEGMENTS.map((s) => {
          const active = segment === s.id;
          return (
            <Pressable
              key={s.id}
              onPress={() => setSegment(s.id)}
              style={[
                styles.segment,
                active && {
                  borderColor: playerTheme.accent,
                  backgroundColor: playerTheme.accentSoft,
                },
              ]}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
            >
              <ProDayText
                variant="caption"
                style={[styles.segmentLabel, active && { color: playerTheme.accent }]}
              >
                {s.label}
              </ProDayText>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.body}>
        {segment === 'tournois' ? (
          <MatchTournamentsChapter
            profile={props.profile}
            tournaments={props.tournaments}
            loading={props.loadingTournaments}
            refreshing={props.refreshing}
            onRefresh={props.onRefresh}
            onOpenTournament={props.onOpenTournament}
            onCreateTournament={props.onCreateTournament}
            myClubId={props.myClubId}
          />
        ) : null}
        {segment === 'competitions' ? (
          <MatchCompetitionsChapter
            profile={props.profile}
            competitions={props.competitions}
            seasons={props.competitionSeasons}
            fixtures={props.competitionFixtures}
            loading={props.loadingCompetitions}
            refreshing={props.refreshing}
            onRefresh={props.onRefresh}
            onOpenSeason={(id) => props.onOpenCompetitionSeason?.(id)}
            onOpenFixture={(id) => props.onOpenCompetitionFixture?.(id)}
            onOrganize={props.onOrganizeCompetition}
          />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, minHeight: 0 },
  segmentRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  segment: {
    flex: 1,
    borderRadius: 999,
    paddingVertical: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: PLAYER_DARK.border,
    backgroundColor: PLAYER_DARK.surface,
  },
  segmentLabel: {
    color: PLAYER_DARK.textMuted,
    fontWeight: '800',
    fontSize: 10,
    letterSpacing: 0.3,
  },
  body: { flex: 1, minHeight: 0 },
});
