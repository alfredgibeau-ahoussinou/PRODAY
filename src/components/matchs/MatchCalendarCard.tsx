import React from 'react';
import { View, StyleSheet } from 'react-native';
import { PressableSpring } from '../motion/PressableSpring';
import { ProDayText } from '../ui/ProDayText';
import { Icon } from '../ui/Icon';
import { useAppTheme } from '../../context/ProductLineContext';
import { spacing, radius, shadows } from '../../theme/designTokens';

interface MatchCalendarCardProps {
  kindLabel: string;
  dateLabel: string;
  title: string;
  subtitle: string;
  city: string;
  linkLabel: string;
  onPress: () => void;
}

export const MatchCalendarCard: React.FC<MatchCalendarCardProps> = ({
  kindLabel,
  dateLabel,
  title,
  subtitle,
  city,
  linkLabel,
  onPress,
}) => {
  const { colors } = useAppTheme();

  return (
    <PressableSpring
      style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }, shadows.soft]}
      onPress={onPress}
      scaleTo={0.98}
      haptic
    >
      <View style={[styles.dateCol, { backgroundColor: colors.accentSoft }]}>
        <ProDayText variant="caption" accent style={styles.dateText}>
          {dateLabel.split(' ').slice(0, 2).join('\n')}
        </ProDayText>
      </View>
      <View style={styles.body}>
        <View style={styles.top}>
          <View style={[styles.kindPill, { backgroundColor: colors.surfaceMuted }]}>
            <ProDayText variant="caption" muted style={styles.kindText}>
              {kindLabel}
            </ProDayText>
          </View>
        </View>
        <ProDayText variant="section" numberOfLines={2} style={styles.title}>
          {title}
        </ProDayText>
        <ProDayText variant="caption" muted numberOfLines={1}>
          {subtitle} · {city}
        </ProDayText>
      </View>
      <View style={styles.chevron}>
        <Icon name="chevron-forward" size={18} color={colors.textMuted} />
      </View>
    </PressableSpring>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'stretch',
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: spacing.sm,
    minHeight: 88,
  },
  dateCol: {
    width: 72,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
  },
  dateText: {
    fontWeight: '800',
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 15,
    textTransform: 'capitalize',
  },
  body: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingRight: spacing.xs,
    gap: 4,
    justifyContent: 'center',
  },
  top: { flexDirection: 'row', marginBottom: 2 },
  kindPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  kindText: { fontWeight: '700', fontSize: 10 },
  title: { fontWeight: '700', fontSize: 15 },
  chevron: {
    justifyContent: 'center',
    paddingRight: spacing.sm,
  },
});
