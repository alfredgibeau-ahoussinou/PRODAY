import React from 'react';
import { StyleSheet, View } from 'react-native';
import { PressableSpring, AnimatedEntrance } from '../motion';
import type { SeasonCalendarItem } from '../../utils/seasonCalendar';
import { formatCalendarDate } from '../../utils/seasonCalendar';
import { ProDayText } from '../ui/ProDayText';
import { useAppTheme } from '../../context/ProductLineContext';
import { MATCH_SITE } from '../../content/matchPageIdentity';
import { spacing } from '../../theme/designTokens';

interface MatchNextUpCardProps {
  item: SeasonCalendarItem;
  onPress: () => void;
}

export const MatchNextUpCard: React.FC<MatchNextUpCardProps> = ({ item, onPress }) => {
  const { colors } = useAppTheme();

  return (
    <AnimatedEntrance kind="zoom" delayStep={0}>
      <PressableSpring onPress={onPress} scaleTo={0.98} haptic style={styles.card}>
        <View style={[styles.bar, { backgroundColor: colors.accent }]} />
        <View style={styles.body}>
          <ProDayText variant="caption" style={[styles.kicker, { color: colors.accent }]}>
            Prochain rendez-vous
          </ProDayText>
          <ProDayText variant="section" numberOfLines={2} style={styles.title}>
            {item.title}
          </ProDayText>
          <ProDayText variant="caption" style={styles.meta}>
            {formatCalendarDate(item.starts_at)} · {item.city}
          </ProDayText>
          <ProDayText variant="caption" style={[styles.cta, { color: colors.accent }]}>
            Ouvrir →
          </ProDayText>
        </View>
      </PressableSpring>
    </AnimatedEntrance>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: MATCH_SITE.border,
    backgroundColor: MATCH_SITE.elevated,
    overflow: 'hidden',
  },
  bar: { width: 3 },
  body: {
    flex: 1,
    padding: spacing.md,
    gap: 4,
  },
  kicker: {
    fontWeight: '800',
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1.6,
  },
  title: {
    fontWeight: '800',
    letterSpacing: -0.3,
    color: MATCH_SITE.foreground,
  },
  meta: { color: MATCH_SITE.muted, fontWeight: '600' },
  cta: { fontWeight: '800', marginTop: 2 },
});
