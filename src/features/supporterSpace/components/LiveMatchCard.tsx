import React from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { ProDayText } from '../../../components/ui/ProDayText';
import type { UnifiedMatch } from '../../../services/supporterFootball';
import { SUPPORTER_SPACE, SUPPORTER_SPACE_COPY } from '../theme/supporterSpaceTheme';

type Props = {
  match: UnifiedMatch;
  onPress?: () => void;
};

/** Large dark-blue LIVE card — Live Score kit style. */
export const LiveMatchCard: React.FC<Props> = ({ match, onPress }) => {
  const minute =
    match.score.minute != null ? `${match.score.minute} min` : SUPPORTER_SPACE_COPY.liveBadge;
  const sourceLabel =
    match.source === 'proday'
      ? SUPPORTER_SPACE_COPY.sourceProday
      : SUPPORTER_SPACE_COPY.sourceLeagues;

  return (
    <Pressable onPress={onPress} style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.leaguePill}>
          <ProDayText variant="caption" style={styles.leagueText} numberOfLines={1}>
            {match.competition.name || sourceLabel}
          </ProDayText>
        </View>
        <View style={styles.livePill}>
          <View style={styles.dot} />
          <ProDayText variant="caption" style={styles.liveText}>
            {SUPPORTER_SPACE_COPY.liveBadge}
          </ProDayText>
        </View>
      </View>

      <View style={styles.scoreRow}>
        <TeamBadge team={match.homeTeam} align="left" />
        <View style={styles.scoreCenter}>
          <ProDayText variant="hero" style={styles.score}>
            {match.score.home ?? '–'} - {match.score.away ?? '–'}
          </ProDayText>
          <ProDayText variant="caption" style={styles.minute}>
            {minute}
          </ProDayText>
        </View>
        <TeamBadge team={match.awayTeam} align="right" />
      </View>
    </Pressable>
  );
};

const TeamBadge: React.FC<{
  team: UnifiedMatch['homeTeam'];
  align: 'left' | 'right';
}> = ({ team, align }) => (
  <View style={[styles.teamCol, align === 'right' && styles.teamColRight]}>
    {team.logoUrl ? (
      <Image source={{ uri: team.logoUrl }} style={styles.logo} />
    ) : (
      <View style={[styles.logo, styles.logoPh]}>
        <ProDayText variant="caption" style={styles.logoInitial}>
          {(team.shortName || team.name || '?').slice(0, 2).toUpperCase()}
        </ProDayText>
      </View>
    )}
    <ProDayText variant="caption" style={styles.teamName} numberOfLines={2}>
      {team.shortName || team.name}
    </ProDayText>
  </View>
);

const styles = StyleSheet.create({
  card: {
    width: 320,
    marginRight: 12,
    padding: 18,
    borderRadius: 22,
    backgroundColor: SUPPORTER_SPACE.accent,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
    gap: 8,
  },
  leaguePill: {
    flexShrink: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  leagueText: { color: SUPPORTER_SPACE.onBlue, fontSize: 11 },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(229, 57, 53, 0.95)',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#fff',
  },
  liveText: { color: '#fff', fontWeight: '700', fontSize: 11 },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  teamCol: { width: 88, alignItems: 'center', gap: 8 },
  teamColRight: {},
  logo: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  logoPh: { alignItems: 'center', justifyContent: 'center' },
  logoInitial: { color: SUPPORTER_SPACE.onBlue, fontWeight: '700' },
  teamName: {
    color: SUPPORTER_SPACE.onBlue,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
  },
  scoreCenter: { alignItems: 'center', minWidth: 90 },
  score: { color: SUPPORTER_SPACE.score, fontSize: 32, fontWeight: '700' },
  minute: { color: 'rgba(255,255,255,0.72)', marginTop: 4, fontSize: 12 },
});
