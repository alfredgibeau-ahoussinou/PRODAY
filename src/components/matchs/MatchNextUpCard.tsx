import React from 'react';
import { StyleSheet, View } from 'react-native';
import { PressableSpring, AnimatedEntrance } from '../motion';
import type { SeasonCalendarItem } from '../../utils/seasonCalendar';
import { formatCalendarDate } from '../../utils/seasonCalendar';
import { ProDayText } from '../ui/ProDayText';
import { Icon } from '../ui/Icon';
import { useAppTheme } from '../../context/ProductLineContext';
import { spacing, radius } from '../../theme/designTokens';

interface MatchNextUpCardProps {
  item: SeasonCalendarItem;
  onPress: () => void;
}

export const MatchNextUpCard: React.FC<MatchNextUpCardProps> = ({ item, onPress }) => {
  const { colors } = useAppTheme();

  return (
    <AnimatedEntrance kind="zoom" delayStep={0}>
    <PressableSpring
      style={[
        styles.wrap,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderLeftColor: colors.accent,
        },
      ]}
      onPress={onPress}
      scaleTo={0.98}
      haptic
    >
      <ProDayText variant="caption" accent style={styles.eyebrow}>
        Prochain rendez-vous
      </ProDayText>
      <View style={styles.row}>
        <View style={styles.copy}>
          <ProDayText variant="section" numberOfLines={2}>
            {item.title}
          </ProDayText>
          <ProDayText variant="caption" muted numberOfLines={1}>
            {formatCalendarDate(item.starts_at)} · {item.city}
          </ProDayText>
        </View>
        <Icon name="chevron-forward" size={20} color={colors.textMuted} />
      </View>
    </PressableSpring>
    </AnimatedEntrance>
  );
};

const styles = StyleSheet.create({
  wrap: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderLeftWidth: 3,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  eyebrow: { fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.4, fontSize: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  copy: { flex: 1, gap: 4 },
});
