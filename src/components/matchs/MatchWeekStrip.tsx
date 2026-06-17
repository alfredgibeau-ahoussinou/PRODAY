import React, { useMemo } from 'react';
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
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={[styles.panel, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}>
      <ProDayText variant="caption" muted style={styles.label}>
        Cette semaine
      </ProDayText>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {days.map((day) => {
          const selected =
            selectedDate && day.date.toDateString() === selectedDate.toDateString();
          const weekday = day.date.toLocaleDateString('fr-FR', { weekday: 'short' });
          const dom = day.date.getDate();

          return (
            <PressableSpring
              key={day.date.toISOString()}
              style={[
                styles.chip,
                {
                  backgroundColor: selected ? colors.accent : colors.surface,
                  borderColor: day.isToday ? colors.accent : 'transparent',
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
                style={!selected ? { color: colors.textMuted, fontSize: 10 } : { fontSize: 10 }}
              >
                {weekday}
              </ProDayText>
              <ProDayText variant="section" inverse={Boolean(selected)} style={styles.dom}>
                {dom}
              </ProDayText>
              {day.count > 0 ? (
                <View
                  style={[
                    styles.dot,
                    { backgroundColor: selected ? colors.brandInverse : colors.accentSoft },
                  ]}
                >
                  <ProDayText
                    variant="caption"
                    style={{
                      color: selected ? colors.accent : colors.accent,
                      fontWeight: '900',
                      fontSize: 9,
                    }}
                  >
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
    </View>
  );
};

function createStyles(_colors: ReturnType<typeof useAppTheme>['colors']) {
  return StyleSheet.create({
    panel: {
      borderRadius: radius.lg,
      borderWidth: StyleSheet.hairlineWidth,
      padding: spacing.sm,
      marginBottom: spacing.lg,
      gap: spacing.xs,
    },
    label: {
      fontWeight: '700',
      paddingHorizontal: spacing.xs,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      fontSize: 10,
    },
    row: {
      gap: spacing.xs,
      paddingHorizontal: 2,
    },
    chip: {
      width: 52,
      alignItems: 'center',
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.xs,
      borderRadius: radius.md,
      borderWidth: 1.5,
      gap: 1,
    },
    dom: { fontWeight: '800', fontSize: 17, lineHeight: 20 },
    dot: {
      minWidth: 16,
      height: 16,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 3,
      marginTop: 2,
    },
    dotPlaceholder: { height: 16, marginTop: 2 },
  });
}
