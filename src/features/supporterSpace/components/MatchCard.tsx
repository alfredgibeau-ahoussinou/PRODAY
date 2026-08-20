import React from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { ProDayText } from '../../../components/ui/ProDayText';
import type { UnifiedMatch } from '../../../services/supporterFootball';
import { SUPPORTER_SPACE, SUPPORTER_SPACE_COPY } from '../theme/supporterSpaceTheme';

function formatKickoff(date: Date): string {
  if (Number.isNaN(date.getTime())) return '--:--';
  return date.toLocaleString('fr-FR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function statusLabel(match: UnifiedMatch): string {
  if (match.status === 'live' || match.status === 'halftime') {
    return match.score.minute != null ? `${match.score.minute}'` : 'LIVE';
  }
  if (match.status === 'finished') return 'Terminé';
  return formatKickoff(match.date);
}

type Props = {
  match: UnifiedMatch;
  onPress?: () => void;
  compact?: boolean;
};

export const MatchCard: React.FC<Props> = ({ match, onPress, compact }) => {
  const showScore =
    match.status === 'live' || match.status === 'halftime' || match.status === 'finished';
  const isLive = match.status === 'live' || match.status === 'halftime';

  return (
    <Pressable
      onPress={onPress}
      style={[styles.card, compact && styles.compact, isLive && styles.liveCard]}
    >
      <View style={styles.metaRow}>
        <View style={styles.compPill}>
          <ProDayText variant="caption" style={styles.comp} numberOfLines={1}>
            {match.competition.name}
          </ProDayText>
        </View>
        <ProDayText
          variant="caption"
          style={[styles.status, isLive && styles.live]}
        >
          {statusLabel(match)}
        </ProDayText>
      </View>
      <View style={styles.teams}>
        <TeamSide team={match.homeTeam} score={showScore ? match.score.home : null} />
        <TeamSide team={match.awayTeam} score={showScore ? match.score.away : null} />
      </View>
      {match.source === 'proday' ? (
        <ProDayText variant="caption" style={styles.badge}>
          {SUPPORTER_SPACE_COPY.sourceProday}
        </ProDayText>
      ) : match.source === 'external' ? (
        <ProDayText variant="caption" style={styles.badgeLeague}>
          {SUPPORTER_SPACE_COPY.sourceLeagues}
        </ProDayText>
      ) : null}
    </Pressable>
  );
};

const TeamSide: React.FC<{
  team: UnifiedMatch['homeTeam'];
  score: number | null;
}> = ({ team, score }) => (
  <View style={styles.teamRow}>
    {team.logoUrl ? (
      <Image source={{ uri: team.logoUrl }} style={styles.logo} />
    ) : (
      <View style={[styles.logo, styles.logoPh]} />
    )}
    <ProDayText variant="body" style={styles.teamName} numberOfLines={1}>
      {team.shortName || team.name}
    </ProDayText>
    {score != null ? (
      <ProDayText variant="title" style={styles.score}>
        {score}
      </ProDayText>
    ) : null}
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: SUPPORTER_SPACE.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: SUPPORTER_SPACE.border,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#1B2A6B',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  compact: { width: 260, marginRight: 10, marginBottom: 0 },
  liveCard: {
    borderColor: SUPPORTER_SPACE.accent,
    backgroundColor: SUPPORTER_SPACE.soft,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    gap: 8,
    alignItems: 'center',
  },
  compPill: {
    flexShrink: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: SUPPORTER_SPACE.band,
  },
  comp: { color: SUPPORTER_SPACE.accent, fontSize: 11, fontWeight: '600' },
  status: { color: SUPPORTER_SPACE.muted },
  live: { color: SUPPORTER_SPACE.live, fontWeight: '700' },
  teams: { gap: 8 },
  teamRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logo: { width: 24, height: 24, borderRadius: 12 },
  logoPh: { backgroundColor: SUPPORTER_SPACE.band },
  teamName: { color: SUPPORTER_SPACE.foreground, flex: 1, fontSize: 14 },
  score: {
    color: SUPPORTER_SPACE.foreground,
    minWidth: 22,
    textAlign: 'right',
    fontSize: 18,
    fontWeight: '700',
  },
  badge: { marginTop: 10, color: SUPPORTER_SPACE.proday, fontWeight: '600' },
  badgeLeague: { marginTop: 10, color: SUPPORTER_SPACE.league, fontWeight: '600' },
});
