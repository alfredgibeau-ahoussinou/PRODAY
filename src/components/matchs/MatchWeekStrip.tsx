import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { PressableSpring } from '../motion/PressableSpring';
import { prodayHaptics } from '../../utils/prodayHaptics';
import { ProDayText } from '../ui/ProDayText';
import { useAppTheme } from '../../context/ProductLineContext';
import { spacing, radius } from '../../theme/designTokens';

type WeekDay = { date: Date; count: number; isToday: boolean };

interface MatchWeekStripProps {
  days: WeekDay[];
  selectedDate?: Date | null;
  onSelectDay?: (date: Date) => void;
}

export const MatchWeekStrip: React.FC<MatchWeekStripProps> = ({
  days,
  selectedDate,
  onSelectDay,
}) => {
  const { colors } = useAppTheme();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {days.map((day) => {
        const selected =
          selectedDate &&
          day.date.toDateString() === selectedDate.toDateString();
        const weekday = day.date.toLocaleDateString('fr-FR', { weekday: 'short' });
        const dom = day.date.getDate();

        return (
          <PressableSpring
            key={day.date.toISOString()}
            style={[
              styles.chip,
              {
                backgroundColor: selected ? colors.ink : colors.surface,
                borderColor: day.isToday ? colors.accent : colors.border,
              },
            ]}
            onPress={() => {
              prodayHaptics.tabSwitch();
              onSelectDay?.(day.date);
            }}
            scaleTo={0.94}
            haptic
          >
            <ProDayText
              variant="caption"
              inverse={Boolean(selected)}
              style={!selected ? { color: colors.textMuted } : undefined}
            >
              {weekday}
            </ProDayText>
            <ProDayText variant="section" inverse={Boolean(selected)}>
              {dom}
            </ProDayText>
            {day.count > 0 ? (
              <View
                style={[
                  styles.dot,
                  { backgroundColor: selected ? colors.brandInverse : colors.accent },
                ]}
              >
                <ProDayText variant="caption" inverse={Boolean(selected)} style={styles.dotText}>
                  {day.count}
                </ProDayText>
              </View>
            ) : (
              <View style={styles.dotPlaceholder} />
            )}
          </PressableSpring>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  row: {
    gap: spacing.sm,
    paddingBottom: spacing.sm,
  },
  chip: {
    width: 56,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: 2,
  },
  dot: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    marginTop: 2,
  },
  dotText: { fontSize: 10, fontWeight: '900' },
  dotPlaceholder: { height: 18, marginTop: 2 },
});
