import React from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { ProDayText } from '../../../components/ui/ProDayText';
import type { UnifiedMatch } from '../../../services/supporterFootball';
import { SUPPORTER_SPACE } from '../theme/supporterSpaceTheme';

function formatKickoff(date: Date): string {
  if (Number.isNaN(date.getTime())) return '--:--';
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
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

  return (
    <Pressable
      onPress={onPress}
      style={[styles.card, compact && styles.compact, match.source === 'demo' && styles.demo]}
    >
      <View style={styles.metaRow}>
        <ProDayText variant="caption" style={styles.comp} numberOfLines={1}>
          {match.competition.name}
        </ProDayText>
        <ProDayText
          variant="caption"
          style={[
            styles.status,
            (match.status === 'live' || match.status === 'halftime') && styles.live,
          ]}
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
          ProDay
        </ProDayText>
      ) : null}
      {match.source === 'demo' ? (
        <ProDayText variant="caption" style={styles.demoBadge}>
          Démo
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
      {team.name}
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
    borderRadius: 14,
    borderWidth: 1,
    borderColor: SUPPORTER_SPACE.border,
    padding: 12,
    marginBottom: 10,
  },
  compact: { width: 260, marginRight: 10, marginBottom: 0 },
  demo: { borderColor: 'rgba(251, 191, 36, 0.35)' },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    gap: 8,
  },
  comp: { color: SUPPORTER_SPACE.muted, flex: 1 },
  status: { color: SUPPORTER_SPACE.muted },
  live: { color: SUPPORTER_SPACE.live, fontWeight: '700' },
  teams: { gap: 6 },
  teamRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logo: { width: 22, height: 22, borderRadius: 11 },
  logoPh: { backgroundColor: SUPPORTER_SPACE.soft },
  teamName: { color: SUPPORTER_SPACE.foreground, flex: 1, fontSize: 14 },
  score: { color: SUPPORTER_SPACE.score, minWidth: 22, textAlign: 'right', fontSize: 18 },
  badge: { marginTop: 8, color: SUPPORTER_SPACE.proday },
  demoBadge: { marginTop: 8, color: SUPPORTER_SPACE.demo },
});
