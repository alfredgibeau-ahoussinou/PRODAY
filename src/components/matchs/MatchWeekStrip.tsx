import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { PressableSpring } from '../motion/PressableSpring';
import { prodayHaptics } from '../../utils/prodayHaptics';
import { ProDayText } from '../ui/ProDayText';
import { useMatchSkinTokens } from './matchCenterUi';

import { colors } from '../../theme/designTokens';
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
  const skin = useMatchSkinTokens();
  const styles = useMemo(() => createStyles(skin), [skin]);

  const todayDay = useMemo(() => days.find((d) => d.isToday), [days]);

  const monthTitle = useMemo(() => {
    const targetDate = selectedDate || todayDay?.date || days[0]?.date || new Date();
    const formatted = targetDate.toLocaleDateString('fr-FR', {
      month: 'long',
      year: 'numeric',
    });
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  }, [selectedDate, todayDay, days]);

  return (
    <View style={styles.panel}>
      <View style={styles.headerRow}>
        <ProDayText variant="title" style={styles.monthTitle}>
          {monthTitle}
        </ProDayText>

        {todayDay ? (
          <PressableSpring
            onPress={() => {
              prodayHaptics.press();
              onSelectDay?.(todayDay.date);
            }}
            scaleTo={0.94}
            haptic
            style={[
              styles.todayBadge,
              {
                backgroundColor: `${skin.accent}18`,
                borderColor: `${skin.accent}55`,
              },
            ]}
          >
            <ProDayText variant="caption" style={[styles.todayText, { color: skin.accent }]}>
              Aujourd'hui
            </ProDayText>
          </PressableSpring>
        ) : null}
      </View>

      <View style={styles.daysRow}>
        {days.map((day) => {
          const selected =
            selectedDate && day.date.toDateString() === selectedDate.toDateString();
          const weekday = day.date
            .toLocaleDateString('fr-FR', { weekday: 'short' })
            .replace('.', '');
          const dom = day.date.getDate();

          return (
            <PressableSpring
              key={day.date.toISOString()}
              style={[
                styles.chip,
                selected
                  ? {
                      backgroundColor: skin.accent,
                    }
                  : styles.chipInactive,
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
                style={[
                  styles.weekday,
                  { color: selected ? '#000000' : '#8B8B9A' },
                ]}
              >
                {weekday.toUpperCase()}
              </ProDayText>
              <ProDayText
                variant="section"
                style={[
                  styles.dom,
                  { color: selected ? '#000000' : '#FFFFFF' },
                ]}
              >
                {dom}
              </ProDayText>
            </PressableSpring>
          );
        })}
      </View>
    </View>
  );
};

function createStyles(_skin: ReturnType<typeof useMatchSkinTokens>) {
  return StyleSheet.create({
    panel: {
      backgroundColor: colors.surface,
      borderColor: colors.borderStrong,
      borderWidth: 1,
      borderRadius: 16,
      paddingHorizontal: 14,
      paddingVertical: 14,
      gap: 14,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 2,
    },
    monthTitle: {
      fontSize: 16,
      fontWeight: '900',
      color: '#FFFFFF',
      letterSpacing: -0.3,
    },
    todayBadge: {
      paddingHorizontal: 12,
      paddingVertical: 5,
      borderRadius: 999,
      borderWidth: 1,
    },
    todayText: {
      fontWeight: '800',
      fontSize: 11,
    },
    daysRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    chip: {
      width: 44,
      height: 56,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 12,
      gap: 2,
    },
    chipInactive: {
      backgroundColor: 'transparent',
    },
    weekday: {
      fontSize: 9.5,
      fontWeight: '800',
      letterSpacing: 0.2,
    },
    dom: {
      fontWeight: '900',
      fontSize: 17,
      lineHeight: 20,
    },
  });
}

