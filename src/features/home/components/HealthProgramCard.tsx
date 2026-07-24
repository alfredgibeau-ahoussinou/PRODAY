import React, { useMemo, useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { HealthState } from '../../../core/types/health';
import {
  pickHealthProgram,
  programProgress,
  type HealthProgramDay,
} from '../../v3/engines/healthProgram.engine';
import { GlassCard } from '../../../components/aurora/GlassCard';
import { ProDayText } from '../../../components/ui/ProDayText';
import { Icon } from '../../../components/ui/Icon';
import { PressableSpring } from '../../../components/motion';
import { useAppTheme } from '../../../context/ProductLineContext';
import { spacing, radius } from '../../../theme/designTokens';

const storageKey = (uid: string, programId: string) => `v3_health_prog_${uid}_${programId}`;

type HealthProgramCardProps = {
  uid: string;
  healthState: HealthState;
  onOpenHealth?: () => void;
};

/** Programme guidé 7 jours — pattern Nike Training Club. */
export const HealthProgramCard: React.FC<HealthProgramCardProps> = ({
  uid,
  healthState,
  onOpenHealth,
}) => {
  const { colors } = useAppTheme();
  const program = useMemo(() => pickHealthProgram(healthState), [healthState]);
  const [completed, setCompleted] = useState<number[]>([]);
  const [activeDay, setActiveDay] = useState(1);

  React.useEffect(() => {
    void AsyncStorage.getItem(storageKey(uid, program.id)).then((raw) => {
      if (!raw) return;
      try {
        const parsed = JSON.parse(raw) as number[];
        if (Array.isArray(parsed)) setCompleted(parsed);
      } catch {
        /* ignore */
      }
    });
  }, [uid, program.id]);

  const progress = programProgress(completed);
  const today: HealthProgramDay | undefined = program.days.find((d) => d.day === activeDay);

  const toggleDay = async (day: number) => {
    const next = completed.includes(day)
      ? completed.filter((d) => d !== day)
      : [...completed, day].sort((a, b) => a - b);
    setCompleted(next);
    await AsyncStorage.setItem(storageKey(uid, program.id), JSON.stringify(next));
    if (!completed.includes(day) && day < 7) setActiveDay(day + 1);
  };

  return (
    <GlassCard variant="default" style={styles.card}>
      <View style={styles.header}>
        <View style={[styles.iconWrap, { backgroundColor: colors.accentSoft }]}>
          <Icon name="walk" size={18} color={colors.accent} />
        </View>
        <View style={styles.copy}>
          <ProDayText variant="section">{program.label}</ProDayText>
          <ProDayText variant="caption" muted>
            {program.description}
          </ProDayText>
        </View>
        <ProDayText variant="caption" accent style={styles.pct}>
          {progress}%
        </ProDayText>
      </View>

      <View style={[styles.track, { backgroundColor: colors.surfaceMuted }]}>
        <View style={[styles.fill, { width: `${progress}%`, backgroundColor: colors.accent }]} />
      </View>

      <View style={styles.days}>
        {program.days.map((d) => {
          const done = completed.includes(d.day);
          const active = d.day === activeDay;
          return (
            <Pressable
              key={d.day}
              onPress={() => setActiveDay(d.day)}
              style={[
                styles.dayChip,
                {
                  backgroundColor: done ? colors.accentSoft : colors.surfaceMuted,
                  borderColor: active ? colors.accent : colors.border,
                },
              ]}
            >
              <ProDayText variant="caption" accent={done || active}>
                J{d.day}
              </ProDayText>
            </Pressable>
          );
        })}
      </View>

      {today ? (
        <View style={[styles.today, { borderColor: colors.border }]}>
          <ProDayText variant="caption" accent style={styles.todayTitle}>
            Jour {today.day}. {today.title}
          </ProDayText>
          <ProDayText variant="body" muted>
            {today.task} · {today.durationMin} min
          </ProDayText>
          <View style={styles.todayActions}>
            <PressableSpring
              style={[styles.doneBtn, { backgroundColor: colors.accentSoft }]}
              onPress={() => void toggleDay(today.day)}
              scaleTo={0.96}
              haptic
            >
              <ProDayText variant="caption" accent style={styles.doneText}>
                {completed.includes(today.day) ? 'Fait ✓' : 'Marquer fait'}
              </ProDayText>
            </PressableSpring>
            {onOpenHealth ? (
              <PressableSpring onPress={onOpenHealth} scaleTo={0.96}>
                <ProDayText variant="caption" accent style={styles.link}>
                  Kiné →
                </ProDayText>
              </PressableSpring>
            ) : null}
          </View>
        </View>
      ) : null}
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  card: { marginBottom: spacing.md, padding: spacing.lg, gap: spacing.sm },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: { flex: 1, gap: 2 },
  pct: { fontWeight: '800' },
  track: { height: 4, borderRadius: 2, overflow: 'hidden' },
  fill: { height: '100%' },
  days: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  dayChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  today: { borderTopWidth: 1, paddingTop: spacing.sm, gap: 4 },
  todayTitle: { fontWeight: '800' },
  todayActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.xs },
  doneBtn: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.pill },
  doneText: { fontWeight: '800' },
  link: { fontWeight: '700' },
});
