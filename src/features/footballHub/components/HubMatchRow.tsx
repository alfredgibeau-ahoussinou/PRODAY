import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { ProDayText } from '../../../components/ui/ProDayText';
import type { SupporterMatchViewItem } from '../../../utils/supporterMatchFilters';
import { formatKickoffClock } from '../../../utils/supporterMatchFilters';
import { FOOTBALL_HUB } from '../theme/footballHubTheme';

type Props = {
  item: SupporterMatchViewItem;
  onPress: () => void;
};

export const HubMatchRow: React.FC<Props> = ({ item, onPress }) => {
  const isLive = item.status === 'live';
  const score =
    item.scoreHome != null && item.scoreAway != null
      ? `${item.scoreHome} – ${item.scoreAway}`
      : formatKickoffClock(item.startsAt);

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      <View style={styles.meta}>
        {isLive ? (
          <View style={styles.livePill}>
            <ProDayText variant="caption" style={styles.liveText}>
              LIVE
            </ProDayText>
          </View>
        ) : (
          <ProDayText variant="caption" style={styles.time}>
            {formatKickoffClock(item.startsAt)}
          </ProDayText>
        )}
        {item.competitionLabel ? (
          <ProDayText variant="caption" style={styles.comp} numberOfLines={1}>
            {item.competitionLabel}
          </ProDayText>
        ) : null}
      </View>
      <View style={styles.teams}>
        <ProDayText variant="body" style={styles.team} numberOfLines={1}>
          {item.homeLabel}
        </ProDayText>
        <ProDayText variant="body" style={styles.team} numberOfLines={1}>
          {item.awayLabel}
        </ProDayText>
      </View>
      <ProDayText variant="title" style={[styles.score, isLive && styles.scoreLive]}>
        {score}
      </ProDayText>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: FOOTBALL_HUB.surface,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: FOOTBALL_HUB.border,
    marginBottom: 8,
  },
  pressed: { opacity: 0.85 },
  meta: { width: 72, gap: 4 },
  time: { color: FOOTBALL_HUB.muted },
  livePill: {
    alignSelf: 'flex-start',
    backgroundColor: FOOTBALL_HUB.liveSoft,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  liveText: { color: FOOTBALL_HUB.live, fontWeight: '700', fontSize: 10 },
  comp: { color: FOOTBALL_HUB.muted, fontSize: 10 },
  teams: { flex: 1, gap: 4 },
  team: { color: FOOTBALL_HUB.foreground },
  score: { color: FOOTBALL_HUB.foreground, minWidth: 56, textAlign: 'right', fontSize: 16 },
  scoreLive: { color: FOOTBALL_HUB.live },
});
