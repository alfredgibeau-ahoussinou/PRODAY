import React from 'react';
import { StyleSheet, View } from 'react-native';
import { PressableSpring, AnimatedEntrance } from '../motion';
import type { SeasonCalendarItem } from '../../utils/seasonCalendar';
import { formatCalendarDate } from '../../utils/seasonCalendar';
import { ProDayGradient } from '../ui/ProDayGradient';
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
      <PressableSpring onPress={onPress} scaleTo={0.98} haptic>
        <ProDayGradient kind="hero" style={styles.wrap}>
          <View style={styles.top}>
            <View style={styles.badge}>
              <Icon name="time" size={14} color={colors.brandInverse} />
              <ProDayText variant="caption" inverse style={styles.badgeText}>
                Prochain rendez-vous
              </ProDayText>
            </View>
            <Icon name="chevron-forward" size={20} color="rgba(255,255,255,0.85)" />
          </View>
          <ProDayText variant="section" inverse numberOfLines={2} style={styles.title}>
            {item.title}
          </ProDayText>
          <ProDayText variant="caption" inverse style={styles.meta}>
            {formatCalendarDate(item.starts_at)} · {item.city}
          </ProDayText>
        </ProDayGradient>
      </PressableSpring>
    </AnimatedEntrance>
  );
};

const styles = StyleSheet.create({
  wrap: {
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  badgeText: { fontWeight: '800', fontSize: 11 },
  title: { fontWeight: '800', letterSpacing: -0.2 },
  meta: { opacity: 0.88, fontWeight: '600' },
});
