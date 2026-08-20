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

function Logo({ label }: { label: string }) {
  const initial = (label.trim()[0] ?? '?').toUpperCase();
  return (
    <View style={styles.logo}>
      <ProDayText variant="caption" style={styles.logoText}>
        {initial}
      </ProDayText>
    </View>
  );
}

export const HubLiveScoreCard: React.FC<Props> = ({ item, onPress }) => (
  <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
    <View style={styles.liveRow}>
      <View style={styles.liveDot} />
      <ProDayText variant="caption" style={styles.liveLabel}>
        LIVE{item.minute != null ? ` · ${item.minute}'` : ''}
      </ProDayText>
      {item.competitionLabel ? (
        <ProDayText variant="caption" style={styles.comp} numberOfLines={1}>
          {item.competitionLabel}
        </ProDayText>
      ) : null}
    </View>
    <View style={styles.scoreRow}>
      <View style={styles.team}>
        <Logo label={item.homeLabel} />
        <ProDayText variant="body" style={styles.teamName} numberOfLines={2}>
          {item.homeLabel}
        </ProDayText>
      </View>
      <View style={styles.scoreBlock}>
        <ProDayText variant="hero" style={styles.score}>
          {item.scoreHome ?? 0}
          <ProDayText variant="title" style={styles.scoreSep}>
            {' '}
            –{' '}
          </ProDayText>
          {item.scoreAway ?? 0}
        </ProDayText>
      </View>
      <View style={[styles.team, styles.teamRight]}>
        <Logo label={item.awayLabel} />
        <ProDayText variant="body" style={styles.teamName} numberOfLines={2}>
          {item.awayLabel}
        </ProDayText>
      </View>
    </View>
    {item.source === 'proday' ? (
      <View style={styles.badge}>
        <ProDayText variant="caption" style={styles.badgeText}>
          PRODAY MATCH
        </ProDayText>
      </View>
    ) : (
      <ProDayText variant="caption" style={styles.kick}>
        Coup d’envoi {formatKickoffClock(item.startsAt)}
      </ProDayText>
    )}
  </Pressable>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: FOOTBALL_HUB.elevated,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: FOOTBALL_HUB.border,
    gap: 14,
    minWidth: 280,
    marginRight: 12,
  },
  pressed: { opacity: 0.88, transform: [{ scale: 0.985 }] },
  liveRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: FOOTBALL_HUB.live,
  },
  liveLabel: {
    color: FOOTBALL_HUB.live,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  comp: { flex: 1, color: FOOTBALL_HUB.muted, textAlign: 'right' },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  team: { flex: 1, alignItems: 'center', gap: 8 },
  teamRight: {},
  logo: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: FOOTBALL_HUB.logoPlaceholder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: { color: FOOTBALL_HUB.foreground, fontWeight: '700' },
  teamName: { color: FOOTBALL_HUB.foreground, textAlign: 'center', fontSize: 13 },
  scoreBlock: { minWidth: 88, alignItems: 'center' },
  score: { color: FOOTBALL_HUB.score, fontSize: 36, lineHeight: 40 },
  scoreSep: { color: FOOTBALL_HUB.muted, fontSize: 22 },
  badge: {
    alignSelf: 'center',
    backgroundColor: FOOTBALL_HUB.soft,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: { color: FOOTBALL_HUB.bright, letterSpacing: 1, fontWeight: '700' },
  kick: { color: FOOTBALL_HUB.muted, textAlign: 'center' },
});
