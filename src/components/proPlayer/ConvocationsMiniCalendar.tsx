import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { PressableSpring } from '../motion/PressableSpring';
import { ProDayText } from '../ui/ProDayText';
import { Icon } from '../ui/Icon';
import { useAppTheme } from '../../context/ProductLineContext';
import { spacing, radius } from '../../theme/designTokens';
import { prodayHaptics } from '../../utils/prodayHaptics';

const WEEKDAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'] as const;

export type CalendarMarkedDay = {
  dateKey: string;
  count: number;
};

interface ConvocationsMiniCalendarProps {
  /** Premier jour du mois affiché. */
  month: Date;
  onMonthChange: (month: Date) => void;
  /** Clés YYYY-MM-DD → nombre de convocations. */
  marks: Map<string, number>;
  selectedDate: Date | null;
  onSelectDate: (date: Date | null) => void;
}

function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** Mini calendrier mensuel — jours avec convocations marqués d’un point. */
export const ConvocationsMiniCalendar: React.FC<ConvocationsMiniCalendarProps> = ({
  month,
  onMonthChange,
  marks,
  selectedDate,
  onSelectDate,
}) => {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(), []);

  const monthLabel = useMemo(
    () =>
      startOfMonth(month)
        .toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
        .replace(/^./, (c) => c.toUpperCase()),
    [month],
  );

  const cells = useMemo(() => {
    const first = startOfMonth(month);
    // Lundi = 0 … Dimanche = 6
    const mondayOffset = (first.getDay() + 6) % 7;
    const daysInMonth = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const out: {
      key: string;
      date: Date | null;
      dayNum: number | null;
      count: number;
      isToday: boolean;
      isSelected: boolean;
    }[] = [];

    for (let i = 0; i < mondayOffset; i++) {
      out.push({
        key: `pad-${i}`,
        date: null,
        dayNum: null,
        count: 0,
        isToday: false,
        isSelected: false,
      });
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(first.getFullYear(), first.getMonth(), day);
      const key = toDateKey(date);
      out.push({
        key,
        date,
        dayNum: day,
        count: marks.get(key) ?? 0,
        isToday: sameDay(date, today),
        isSelected: selectedDate ? sameDay(date, selectedDate) : false,
      });
    }

    while (out.length % 7 !== 0) {
      out.push({
        key: `trail-${out.length}`,
        date: null,
        dayNum: null,
        count: 0,
        isToday: false,
        isSelected: false,
      });
    }

    return out;
  }, [month, marks, selectedDate]);

  const goMonth = (delta: number) => {
    const next = new Date(month.getFullYear(), month.getMonth() + delta, 1);
    onMonthChange(next);
    onSelectDate(null);
    prodayHaptics.tabSwitch();
  };

  return (
    <View style={[styles.panel, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.header}>
        <PressableSpring
          style={[styles.navBtn, { borderColor: colors.border }]}
          onPress={() => goMonth(-1)}
          scaleTo={0.92}
          haptic
          accessibilityLabel="Mois précédent"
        >
          <Icon name="arrow-back" size={16} color={colors.text} />
        </PressableSpring>
        <ProDayText variant="section" style={styles.monthLabel}>
          {monthLabel}
        </ProDayText>
        <PressableSpring
          style={[styles.navBtn, { borderColor: colors.border }]}
          onPress={() => goMonth(1)}
          scaleTo={0.92}
          haptic
          accessibilityLabel="Mois suivant"
        >
          <Icon name="chevron-forward" size={16} color={colors.text} />
        </PressableSpring>
      </View>

      <View style={styles.weekRow}>
        {WEEKDAYS.map((label, i) => (
          <View key={`${label}-${i}`} style={styles.cell}>
            <ProDayText variant="caption" muted style={styles.weekday}>
              {label}
            </ProDayText>
          </View>
        ))}
      </View>

      <View style={styles.grid}>
        {cells.map((cell) => {
          if (!cell.date || cell.dayNum == null) {
            return <View key={cell.key} style={styles.cell} />;
          }

          const onPress = () => {
            if (selectedDate && sameDay(selectedDate, cell.date!)) {
              onSelectDate(null);
            } else {
              onSelectDate(cell.date);
            }
            prodayHaptics.tabSwitch();
          };

          return (
            <PressableSpring
              key={cell.key}
              style={[
                styles.cell,
                styles.dayBtn,
                cell.isSelected && { backgroundColor: colors.accent },
                !cell.isSelected && cell.isToday && { borderColor: colors.accent, borderWidth: 1.5 },
              ]}
              onPress={onPress}
              scaleTo={0.9}
              haptic
            >
              <ProDayText
                variant="caption"
                inverse={cell.isSelected}
                style={[
                  styles.dayNum,
                  !cell.isSelected && cell.count > 0 ? { color: colors.text, fontWeight: '800' } : null,
                  !cell.isSelected && cell.count === 0 ? { color: colors.textMuted } : null,
                ]}
              >
                {cell.dayNum}
              </ProDayText>
              {cell.count > 0 ? (
                <View
                  style={[
                    styles.dot,
                    {
                      backgroundColor: cell.isSelected ? colors.brandInverse : colors.accent,
                    },
                  ]}
                />
              ) : (
                <View style={styles.dotSlot} />
              )}
            </PressableSpring>
          );
        })}
      </View>

      {selectedDate ? (
        <PressableSpring onPress={() => onSelectDate(null)} scaleTo={0.98} haptic>
          <ProDayText variant="caption" accent style={styles.clear}>
            Afficher toutes les convocations
          </ProDayText>
        </PressableSpring>
      ) : (
        <ProDayText variant="caption" muted style={styles.hint}>
          Les points marquent les jours avec convocation
        </ProDayText>
      )}
    </View>
  );
};

export function buildConvocationMarks(
  events: { starts_at: Date }[],
): Map<string, number> {
  const map = new Map<string, number>();
  for (const event of events) {
    const key = toDateKey(event.starts_at);
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return map;
}

export function isSameCalendarDay(a: Date, b: Date): boolean {
  return sameDay(a, b);
}

function createStyles() {
  return StyleSheet.create({
    panel: {
      borderRadius: radius.lg,
      borderWidth: StyleSheet.hairlineWidth,
      padding: spacing.md,
      gap: spacing.sm,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.xs,
    },
    navBtn: {
      width: 32,
      height: 32,
      borderRadius: radius.md,
      borderWidth: StyleSheet.hairlineWidth,
      alignItems: 'center',
      justifyContent: 'center',
    },
    monthLabel: { fontWeight: '800', fontSize: 15 },
    weekRow: { flexDirection: 'row' },
    grid: { flexDirection: 'row', flexWrap: 'wrap' },
    cell: {
      width: `${100 / 7}%`,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 36,
    },
    dayBtn: {
      borderRadius: radius.md,
      paddingVertical: 4,
      gap: 2,
    },
    weekday: {
      fontSize: 10,
      fontWeight: '700',
      textTransform: 'uppercase',
    },
    dayNum: { fontSize: 13, fontWeight: '600', lineHeight: 16 },
    dot: {
      width: 5,
      height: 5,
      borderRadius: 2.5,
    },
    dotSlot: { width: 5, height: 5 },
    hint: { textAlign: 'center', marginTop: 2 },
    clear: { textAlign: 'center', fontWeight: '700', marginTop: 2 },
  });
}
