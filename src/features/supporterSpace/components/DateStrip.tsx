import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { ProDayText } from '../../../components/ui/ProDayText';
import { SUPPORTER_SPACE } from '../theme/supporterSpaceTheme';

const DAY_LETTERS = ['D', 'L', 'M', 'M', 'J', 'V', 'S'] as const;

export type DateStripDay = {
  key: string;
  date: Date;
  dayLetter: string;
  dayNum: number;
};

function ymd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function buildDateStripDays(center = new Date(), span = 7): DateStripDay[] {
  const start = new Date(center);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - Math.floor(span / 2));
  const out: DateStripDay[] = [];
  for (let i = 0; i < span; i += 1) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    out.push({
      key: ymd(d),
      date: d,
      dayLetter: DAY_LETTERS[d.getDay()] ?? '·',
      dayNum: d.getDate(),
    });
  }
  return out;
}

type Props = {
  selectedKey: string;
  onSelect: (key: string) => void;
  days?: DateStripDay[];
};

export const DateStrip: React.FC<Props> = ({ selectedKey, onSelect, days: daysProp }) => {
  const days = useMemo(() => daysProp ?? buildDateStripDays(), [daysProp]);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {days.map((day) => {
        const active = day.key === selectedKey;
        return (
          <Pressable
            key={day.key}
            onPress={() => onSelect(day.key)}
            style={styles.item}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
          >
            <ProDayText variant="caption" style={[styles.letter, active && styles.letterActive]}>
              {day.dayLetter}
            </ProDayText>
            <View style={[styles.circle, active && styles.circleActive]}>
              <ProDayText
                variant="caption"
                style={[styles.num, active && styles.numActive]}
              >
                {day.dayNum}
              </ProDayText>
            </View>
          </Pressable>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  row: {
    gap: 10,
    paddingVertical: 4,
    paddingRight: 8,
    alignItems: 'center',
  },
  item: { alignItems: 'center', width: 40, gap: 6 },
  letter: { color: SUPPORTER_SPACE.muted, fontSize: 12 },
  letterActive: { color: SUPPORTER_SPACE.accent, fontWeight: '700' },
  circle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  circleActive: { backgroundColor: SUPPORTER_SPACE.accent },
  num: { color: SUPPORTER_SPACE.foreground, fontSize: 14, fontWeight: '600' },
  numActive: { color: SUPPORTER_SPACE.onBlue },
});
