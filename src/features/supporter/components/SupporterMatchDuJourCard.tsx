import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { ProDayText } from '../../../components/ui/ProDayText';
import { SUPPORTER_HUB_THEME } from '../design/supporterHubTheme';
import { spacing, radius } from '../../../theme/designTokens';
import type { SupporterMatchViewItem } from '../../../utils/supporterMatchFilters';
import { formatKickoffClock } from '../../../utils/supporterMatchFilters';

type Props = {
  item: SupporterMatchViewItem;
  onPress?: () => void;
};

export const SupporterMatchDuJourCard: React.FC<Props> = ({ item, onPress }) => (
  <Pressable onPress={onPress} style={styles.card}>
    <ProDayText variant="caption" style={styles.eyebrow}>
      Match du jour
    </ProDayText>
    {item.competitionLabel ? (
      <ProDayText variant="caption" style={styles.comp}>
        {item.competitionLabel}
      </ProDayText>
    ) : null}
    <ProDayText variant="section" style={styles.matchup}>
      {item.homeLabel} vs {item.awayLabel}
    </ProDayText>
    <ProDayText variant="caption" style={styles.time}>
      {formatKickoffClock(item.startsAt)}
    </ProDayText>
  </Pressable>
);

const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing.lg,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: SUPPORTER_HUB_THEME.elevated,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: SUPPORTER_HUB_THEME.border,
    gap: 6,
  },
  eyebrow: {
    color: SUPPORTER_HUB_THEME.accent,
    letterSpacing: 1.6,
    fontSize: 10,
    textTransform: 'uppercase',
  },
  comp: {
    color: SUPPORTER_HUB_THEME.muted,
    letterSpacing: 1.2,
    fontSize: 10,
    textTransform: 'uppercase',
  },
  matchup: { color: SUPPORTER_HUB_THEME.foreground, fontSize: 17, marginTop: spacing.xs },
  time: { color: SUPPORTER_HUB_THEME.muted, fontVariant: ['tabular-nums'] },
});
