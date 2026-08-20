import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { ProDayText } from '../../../components/ui/ProDayText';
import type { UnifiedMatch } from '../../../services/supporterFootball';
import { SUPPORTER_SPACE } from '../theme/supporterSpaceTheme';

type Props = {
  match: UnifiedMatch;
  onPress?: () => void;
};

/** Hero / carousel card for live fixtures. */
export const LiveMatchCard: React.FC<Props> = ({ match, onPress }) => (
  <Pressable onPress={onPress} style={styles.card}>
    <View style={styles.livePill}>
      <View style={styles.dot} />
      <ProDayText variant="caption" style={styles.liveText}>
        EN DIRECT{match.score.minute != null ? ` · ${match.score.minute}'` : ''}
      </ProDayText>
    </View>
    <ProDayText variant="caption" style={styles.comp} numberOfLines={1}>
      {match.competition.name}
    </ProDayText>
    <View style={styles.scoreRow}>
      <ProDayText variant="title" style={styles.team} numberOfLines={1}>
        {match.homeTeam.shortName || match.homeTeam.name}
      </ProDayText>
      <ProDayText variant="hero" style={styles.score}>
        {match.score.home ?? '–'} – {match.score.away ?? '–'}
      </ProDayText>
      <ProDayText variant="title" style={[styles.team, styles.teamRight]} numberOfLines={1}>
        {match.awayTeam.shortName || match.awayTeam.name}
      </ProDayText>
    </View>
  </Pressable>
);

const styles = StyleSheet.create({
  card: {
    width: 300,
    marginRight: 12,
    padding: 16,
    borderRadius: 18,
    backgroundColor: SUPPORTER_SPACE.elevated,
    borderWidth: 1,
    borderColor: SUPPORTER_SPACE.live,
  },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    backgroundColor: SUPPORTER_SPACE.liveSoft,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 10,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: SUPPORTER_SPACE.live,
  },
  liveText: { color: SUPPORTER_SPACE.live, fontWeight: '700' },
  comp: { color: SUPPORTER_SPACE.muted, marginBottom: 8 },
  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  team: { color: SUPPORTER_SPACE.foreground, flex: 1, fontSize: 15 },
  teamRight: { textAlign: 'right' },
  score: { color: SUPPORTER_SPACE.score, fontSize: 26 },
});
