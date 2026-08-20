import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { ProDayText } from '../../../components/ui/ProDayText';
import { SUPPORTER_HUB_THEME } from '../design/supporterHubTheme';
import { spacing, radius } from '../../../theme/designTokens';
import type { SupporterMatchViewItem } from '../../../utils/supporterMatchFilters';

type Props = {
  item: SupporterMatchViewItem;
  onPress?: () => void;
};

export const SupporterHeroLiveCard: React.FC<Props> = ({ item, onPress }) => {
  const score =
    item.scoreHome != null && item.scoreAway != null
      ? `${item.scoreHome} – ${item.scoreAway}`
      : '–';

  return (
    <Pressable onPress={onPress} style={styles.card}>
      <View style={styles.liveRow}>
        <View style={styles.liveDot} />
        <ProDayText variant="caption" style={styles.liveLabel}>
          EN DIRECT{item.minute != null ? ` · ${item.minute}'` : ''}
        </ProDayText>
      </View>
      {item.competitionLabel ? (
        <ProDayText variant="caption" style={styles.comp}>
          {item.competitionLabel}
        </ProDayText>
      ) : null}
      <ProDayText variant="hero" style={styles.teams}>
        {item.homeLabel}
      </ProDayText>
      <ProDayText variant="hero" style={styles.score}>
        {score}
      </ProDayText>
      <ProDayText variant="hero" style={styles.teams}>
        {item.awayLabel}
      </ProDayText>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing.lg,
    padding: spacing.lg,
    borderRadius: SUPPORTER_HUB_THEME.cardRadius,
    backgroundColor: SUPPORTER_HUB_THEME.elevated,
    borderWidth: 1,
    borderColor: SUPPORTER_HUB_THEME.liveBorder,
    gap: spacing.xs,
  },
  liveRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: SUPPORTER_HUB_THEME.electric,
  },
  liveLabel: {
    color: SUPPORTER_HUB_THEME.electric,
    letterSpacing: 1.6,
    fontSize: 10,
    textTransform: 'uppercase',
  },
  comp: {
    color: SUPPORTER_HUB_THEME.muted,
    letterSpacing: 1.4,
    fontSize: 10,
    textTransform: 'uppercase',
    marginTop: spacing.xs,
  },
  teams: { color: SUPPORTER_HUB_THEME.foreground, fontSize: 18, lineHeight: 24 },
  score: {
    color: SUPPORTER_HUB_THEME.foreground,
    fontSize: SUPPORTER_HUB_THEME.scoreboard.fontSize,
    fontWeight: SUPPORTER_HUB_THEME.scoreboard.fontWeight,
    letterSpacing: SUPPORTER_HUB_THEME.scoreboard.letterSpacing,
    textAlign: 'center',
    marginVertical: spacing.xs,
  },
});
