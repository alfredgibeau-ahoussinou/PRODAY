import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { PressableSpring } from '../motion/PressableSpring';
import { prodayHaptics } from '../../utils/prodayHaptics';
import { ProDayText } from '../ui/ProDayText';
import { useAppTheme } from '../../context/ProductLineContext';
import { MATCH_SITE } from '../../content/matchPageIdentity';
import { spacing } from '../../theme/designTokens';

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
  const styles = useMemo(() => createStyles(colors.accent), [colors.accent]);

  return (
    <View style={styles.panel}>
      <ProDayText variant="caption" style={styles.label}>
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
                selected && styles.chipOn,
                day.isToday && !selected && styles.chipToday,
              ]}
              onPress={() => {
                prodayHaptics.tabSwitch();
                onSelectDay?.(day.date);
              }}
              scaleTo={0.97}
              haptic
            >
              <ProDayText
                variant="caption"
                style={[styles.weekday, selected ? styles.textOn : styles.textOff]}
              >
                {weekday}
              </ProDayText>
              <ProDayText
                variant="section"
                style={[styles.dom, selected ? styles.textOn : styles.domOff]}
              >
                {dom}
              </ProDayText>
              {day.count > 0 ? (
                <ProDayText
                  variant="caption"
                  style={[styles.count, selected ? styles.textOn : { color: colors.accent }]}
                >
                  {day.count}
                </ProDayText>
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

function createStyles(accent: string) {
  return StyleSheet.create({
    panel: {
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: MATCH_SITE.border,
      padding: spacing.sm,
      gap: spacing.xs,
      backgroundColor: MATCH_SITE.surface,
    },
    label: {
      fontWeight: '800',
      paddingHorizontal: spacing.xs,
      textTransform: 'uppercase',
      letterSpacing: 1.6,
      fontSize: 10,
      color: MATCH_SITE.muted,
    },
    row: {
      gap: 4,
      paddingHorizontal: 2,
    },
    chip: {
      width: 48,
      alignItems: 'center',
      paddingVertical: spacing.sm,
      paddingHorizontal: 4,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: MATCH_SITE.border,
      gap: 1,
      backgroundColor: 'transparent',
    },
    chipOn: {
      borderColor: accent,
      backgroundColor: MATCH_SITE.soft,
    },
    chipToday: {
      borderColor: accent,
    },
    weekday: {
      fontSize: 10,
      fontWeight: '700',
      textTransform: 'uppercase',
    },
    textOn: { color: accent },
    textOff: { color: MATCH_SITE.muted },
    dom: { fontWeight: '800', fontSize: 17, lineHeight: 20 },
    domOff: { color: MATCH_SITE.foreground },
    count: { fontWeight: '900', fontSize: 9, marginTop: 2 },
    dotPlaceholder: { height: 12, marginTop: 2 },
  });
}
